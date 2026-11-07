import { describe, expect, it } from 'vitest';
import { GameClock } from '@/domain/game/clock';
import {
  FoulEvent,
  FreeThrowEvent,
  PeriodEvent,
  ReboundEvent,
  ShotEvent,
  StealEvent,
  SubstitutionEvent,
  TurnoverEvent
} from '@/domain/events';
import { EventFactory } from '@/application/parsing/event-factory';

const factory = new EventFactory();

function parse(text: string, side: 'home' | 'away' = 'home') {
  return factory.create({
    id: 1,
    clock: new GameClock(1, 11, 40),
    side,
    teamName: side === 'home' ? '洛杉矶湖人' : '明尼苏达森林狼',
    teamShortName: side === 'home' ? '湖人' : '森林狼',
    text
  });
}

describe('EventFactory 文字识别', () => {
  it('三分命中：人名带空格也要切干净', () => {
    const event = parse('L. 勒布朗-詹姆斯 三分投篮： 命中(16 分)');
    expect(event).toBeInstanceOf(ShotEvent);
    const shot = event as ShotEvent;
    expect(shot.playerName).toBe('L. 勒布朗-詹姆斯');
    expect(shot.made).toBe(true);
    expect(shot.points).toBe(3);
  });

  it('括号里的累计得分不当成本球分值', () => {
    const event = parse('戴维斯 补篮： 命中(32 分)') as ShotEvent;
    expect(event.points).toBe(2);
  });

  it('动作前的修饰词不算进人名', () => {
    const event = parse('戴维斯 行进间上篮： 不中') as ShotEvent;
    expect(event.playerName).toBe('戴维斯');
    expect(event.made).toBe(false);
  });

  it('助攻人从括号里取，不会被前面的分括号带跑', () => {
    const event = parse('八村塁 三分投篮： 命中(3 分) (戴维斯 1 次助攻)') as ShotEvent;
    expect(event.assistName).toBe('戴维斯');
  });

  it('两罚第一罚也认', () => {
    const event = parse('八村塁 (两罚)第一罚 命中(14 分)');
    expect(event).toBeInstanceOf(FreeThrowEvent);
    expect((event as FreeThrowEvent).made).toBe(true);
  });

  it('犯规行里的"投篮犯规""罚球出手"不会被投篮/罚球规则抢走', () => {
    const event = parse('戈贝尔 犯规: 投篮犯规 (2 次犯规)(2 罚球出手) (裁判：N.布赫特吹罚)');
    expect(event).toBeInstanceOf(FoulEvent);
    expect((event as FoulEvent).playerName).toBe('戈贝尔');
    expect((event as FoulEvent).foulType).toBe('投篮犯规');
  });

  it('失误优先于犯规：失误：进攻犯规 归到失误', () => {
    const event = parse('戈贝尔 失误：进攻犯规 (1 次失误)');
    expect(event).toBeInstanceOf(TurnoverEvent);
    expect((event as TurnoverEvent).reason).toBe('进攻犯规');
  });

  it('球队篮板没有球员，只记在球队上', () => {
    const event = parse('湖人 抢到篮板球');
    expect(event).toBeInstanceOf(ReboundEvent);
    expect((event as ReboundEvent).playerName).toBe('');
  });

  it('抢断不被篮板规则抢走', () => {
    const event = parse('康利 抢断 (1 次抢断)');
    expect(event).toBeInstanceOf(StealEvent);
    expect((event as StealEvent).playerName).toBe('康利');
  });

  it('换人拆出上下场球员', () => {
    const event = parse('换人： 拉塞尔 替换 戴维斯');
    expect(event).toBeInstanceOf(SubstitutionEvent);
    expect((event as SubstitutionEvent).playerIn).toBe('拉塞尔');
    expect((event as SubstitutionEvent).playerOut).toBe('戴维斯');
  });

  it('节次与全场结束', () => {
    expect(parse('第1节开始.')).toBeInstanceOf(PeriodEvent);
    expect((parse('第2节结束.') as PeriodEvent).phase).toBe('end');
    expect((parse('全场结束.') as PeriodEvent).isFullTime).toBe(true);
  });

  it('认不出来的文字返回 null，不硬造事件', () => {
    expect(parse('时间')).toBeNull();
  });
});
