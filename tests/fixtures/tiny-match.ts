import type { RawMatch } from '@/application/ports';

/** 一张手写的小表格，够覆盖开局、得分、罚球、犯规四类事件。 */
export function tinyRawMatch(): RawMatch {
  return {
    title: 'fixture',
    homeName: '洛杉矶湖人',
    awayName: '明尼苏达森林狼',
    rows: [
      { quarter: 1, time: '12:00', homeAction: '第1节开始.', score: '', awayAction: '' },
      {
        quarter: 1,
        time: '11:40',
        homeAction: '八村塁 三分投篮： 命中(3 分) (戴维斯 1 次助攻)',
        score: '3-0',
        awayAction: ''
      },
      {
        quarter: 1,
        time: '11:20',
        homeAction: '',
        score: '3-2',
        awayAction: '爱德华兹 突破上篮： 命中(2 分)'
      },
      { quarter: 1, time: '11:00', homeAction: '里维斯 犯规: 个人犯规 (1 次犯规)', score: '3-2', awayAction: '' },
      {
        quarter: 1,
        time: '10:30',
        homeAction: '',
        score: '3-3',
        awayAction: '爱德华兹 (两罚)第一罚 命中(3 分)'
      }
    ]
  };
}
