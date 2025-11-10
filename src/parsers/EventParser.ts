import * as XLSX from 'xlsx';
import {
  GameEvent,
  ShotEvent,
  ReboundEvent,
  FoulEvent,
  BlockEvent,
  StealEvent,
  TurnoverEvent,
  SubstitutionEvent,
  JumpBallEvent,
  QuarterEndEvent,
  ScoreUpdateEvent
} from '../models/GameEvent';

/**
 * 解析结果接口
 */
export interface ParseResult {
  events: GameEvent[];
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * 事件解析器 - 负责读取XLSX文件并转换成GameEvent对象数组
 */
export class EventParser {
  /**
   * 解析XLSX文件
   */
  static async parseXLSX(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const result = this.extractEventsFromWorkbook(workbook);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsBinaryString(file);
    });
  }

  /**
   * 从工作簿中提取事件
   */
  private static extractEventsFromWorkbook(workbook: XLSX.WorkBook): ParseResult {
    const events: GameEvent[] = [];
    let eventId = 1;
    let homeTeamName = '主队';
    let awayTeamName = '客队';

    console.log('可用的工作表:', Object.keys(workbook.Sheets));

    // 从第一个工作表(c1)读取队伍名称
    const firstSheet = workbook.Sheets['c1'];
    if (firstSheet) {
      const rows = XLSX.utils.sheet_to_json(firstSheet, { 
        header: 1, 
        defval: '',
        raw: false
      }) as any[][];
      
      // 第2行(索引1)包含队伍名称: [时间, 主队名, 比分, 客队名]
      if (rows.length > 1 && rows[1].length >= 4) {
        homeTeamName = rows[1][1] ? String(rows[1][1]).trim() : '主队';
        awayTeamName = rows[1][3] ? String(rows[1][3]).trim() : '客队';
        console.log(`✅ 队伍名称: ${homeTeamName} vs ${awayTeamName}`);
      }
    }

    // 遍历四节比赛 (c1, c2, c3, c4)
    for (let quarter = 1; quarter <= 4; quarter++) {
      const sheetName = `c${quarter}`;
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        console.warn(`未找到工作表: ${sheetName}`);
        continue;
      }

      // 转换为JSON,使用 raw: false 来获取格式化后的文本而不是原始数字
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false  // 重要!获取格式化后的文本,而不是原始数字
      }) as any[][];
      console.log(`第${quarter}节: 共 ${rows.length} 行数据`);
      // 跳过前两行标题，从第3行开始解析
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const timestamp = this.parseTimestamp(row[0]);
        const homeAction = row[1] ? String(row[1]).trim() : '';
        const score = row[2] ? String(row[2]).trim() : '';
        const awayAction = row[3] ? String(row[3]).trim() : '';

        // 如果有比分,创建比分更新事件
        if (score && score.includes('-')) {
          const scoreParts = score.split('-');
          if (scoreParts.length === 2) {
            const homeScore = parseInt(scoreParts[0].trim());
            const awayScore = parseInt(scoreParts[1].trim());
            if (!isNaN(homeScore) && !isNaN(awayScore)) {
              const scoreEvent = new ScoreUpdateEvent(
                eventId++,
                timestamp,
                quarter,
                `比分更新: ${score}`,
                homeScore,
                awayScore
              );
              events.push(scoreEvent);
            }
          }
        }

        // 解析主队事件
        if (homeAction) {
          const event = this.parseAction(eventId++, timestamp, quarter, homeTeamName, homeAction, score);
          if (event) events.push(event);
        }

        // 解析客队事件
        if (awayAction) {
          const event = this.parseAction(eventId++, timestamp, quarter, awayTeamName, awayAction, score);
          if (event) events.push(event);
        }
      }
    }

    console.log(`总共解析到 ${events.length} 个事件`);
    return {
      events: events.sort((a, b) => a.eventId - b.eventId),
      homeTeamName,
      awayTeamName
    };
  }

  /**
   * 解析时间戳
   */
  private static parseTimestamp(value: any): string {
    if (!value) return '12:00';
    
    const str = String(value).trim();
    
    // 如果是 "HH:MM:SS" 格式,只取 MM:SS 部分
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts.length === 3) {
        // HH:MM:SS -> MM:SS
        return `${parts[1]}:${parts[2]}`;
      }
      // 已经是 MM:SS 格式,直接返回
      return str;
    }
    
    // 如果是数字(备用方案)
    if (typeof value === 'number') {
      const totalSeconds = Math.round(value * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const totalMinutes = hours * 60 + minutes;
      const minutesStr = String(totalMinutes).padStart(2, '0');
      const secondsStr = String(seconds).padStart(2, '0');
      
      return `${minutesStr}:${secondsStr}`;
    }
    
    return '12:00';
  }

  /**
   * 解析具体的动作描述
   */
  private static parseAction(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    score: string
  ): GameEvent | null {
    const desc = description.trim();

    // 跳球
    if (desc.includes('跳球')) {
      return new JumpBallEvent(eventId, timestamp, quarter, teamName, desc, teamName);
    }

    // 节开始/结束
    if (desc.includes('节开始') || desc.includes('节结束') || desc.includes('全场结束')) {
      return new QuarterEndEvent(eventId, timestamp, quarter, desc);
    }

    // 投篮事件（包含各种投篮类型）
    if (desc.includes('投篮') || desc.includes('上篮') || desc.includes('扣篮') || 
        desc.includes('灌篮') || desc.includes('勾手') || desc.includes('抛投') || desc.includes('补篮')) {
      return this.parseShotEvent(eventId, timestamp, quarter, teamName, desc, score);
    }

    // 篮板
    if (desc.includes('抢到篮板')) {
      return this.parseReboundEvent(eventId, timestamp, quarter, teamName, desc);
    }

    // 犯规
    if (desc.includes('犯规')) {
      return this.parseFoulEvent(eventId, timestamp, quarter, teamName, desc);
    }

    // 盖帽
    if (desc.includes('封盖') || desc.includes('盖帽')) {
      return this.parseBlockEvent(eventId, timestamp, quarter, teamName, desc);
    }

    // 抢断
    if (desc.includes('抢断')) {
      return this.parseStealEvent(eventId, timestamp, quarter, teamName, desc);
    }

    // 失误
    if (desc.includes('失误')) {
      return this.parseTurnoverEvent(eventId, timestamp, quarter, teamName, desc);
    }

    // 换人
    if (desc.includes('换人')) {
      return this.parseSubstitutionEvent(eventId, timestamp, quarter, teamName, desc);
    }

    return null;
  }

  /**
   * 解析投篮事件
   */
  private static parseShotEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    _score: string
  ): ShotEvent | null {
    // 提取球员名字（第一个空格前的部分）
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    const isMade = description.includes('命中');
    const isThreePoint = description.includes('三分');
    
    // 从描述中提取得分
    let points = isThreePoint ? 3 : 2;
    const pointsMatch = description.match(/命中\((\d+)\s*分\)/);
    if (pointsMatch && isMade) {
      points = parseInt(pointsMatch[1]);
    }

    // 提取助攻信息
    let assistPlayer: string | undefined;
    const assistMatch = description.match(/\(([^\)]+)\s*\d+\s*次助攻\)/);
    if (assistMatch) {
      assistPlayer = assistMatch[1].trim();
    }

    // 提取投篮类型
    let shotType = '投篮';
    if (description.includes('三分')) shotType = '三分投篮';
    else if (description.includes('上篮')) shotType = '上篮';
    else if (description.includes('扣篮') || description.includes('灌篮')) shotType = '扣篮';
    else if (description.includes('勾手')) shotType = '勾手';
    else if (description.includes('抛投')) shotType = '抛投';

    return new ShotEvent(
      eventId,
      timestamp,
      quarter,
      teamName,
      description,
      playerName,
      isMade,
      points,
      shotType,
      assistPlayer
    );
  }

  /**
   * 解析篮板事件
   */
  private static parseReboundEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): ReboundEvent | null {
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    const reboundType = description.includes('进攻篮板') ? 'offensive' : 'defensive';

    return new ReboundEvent(eventId, timestamp, quarter, teamName, description, playerName, reboundType);
  }

  /**
   * 解析犯规事件
   */
  private static parseFoulEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): FoulEvent | null {
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    let foulType = '个人犯规';
    
    if (description.includes('进攻犯规')) foulType = '进攻犯规';
    else if (description.includes('技术犯规')) foulType = '技术犯规';
    
    return new FoulEvent(eventId, timestamp, quarter, teamName, description, playerName, foulType);
  }

  /**
   * 解析盖帽事件
   */
  private static parseBlockEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): BlockEvent | null {
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    return new BlockEvent(eventId, timestamp, quarter, teamName, description, playerName);
  }

  /**
   * 解析抢断事件
   */
  private static parseStealEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): StealEvent | null {
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    return new StealEvent(eventId, timestamp, quarter, teamName, description, playerName);
  }

  /**
   * 解析失误事件
   */
  private static parseTurnoverEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): TurnoverEvent | null {
    const playerMatch = description.match(/^([^\s]+)/);
    if (!playerMatch) return null;
    
    const playerName = playerMatch[1];
    return new TurnoverEvent(eventId, timestamp, quarter, teamName, description, playerName);
  }

  /**
   * 解析换人事件
   */
  private static parseSubstitutionEvent(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string
  ): SubstitutionEvent | null {
    // 换人： 拿斯列特 替换 戈贝尔
    const match = description.match(/换人[：:]\s*([^\s]+)\s*替换\s*([^\s]+)/);
    if (!match) return null;
    
    const playerIn = match[1];
    const playerOut = match[2];
    
    return new SubstitutionEvent(eventId, timestamp, quarter, teamName, description, playerIn, playerOut);
  }
}
