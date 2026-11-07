/**
 * 技术统计值对象。
 *
 * 用显式字段表代替 `keyof` + getter 的写法：字段集合唯一，`add()` 只能写数字字段，
 * 命中率之类的派生量单独算，不会被误当成可累加项。
 */
export const BOX_SCORE_FIELDS = [
  'points',
  'fieldGoalsMade',
  'fieldGoalsAttempted',
  'threePointersMade',
  'threePointersAttempted',
  'freeThrowsMade',
  'freeThrowsAttempted',
  'offensiveRebounds',
  'defensiveRebounds',
  'assists',
  'fouls',
  'blocks',
  'steals',
  'turnovers'
] as const;

export type BoxScoreField = (typeof BOX_SCORE_FIELDS)[number];

export type BoxScoreValues = Record<BoxScoreField, number>;

export function emptyBoxScore(): BoxScoreValues {
  return Object.fromEntries(BOX_SCORE_FIELDS.map((field) => [field, 0])) as BoxScoreValues;
}

export class BoxScore {
  private readonly values: BoxScoreValues;

  constructor(values?: Partial<BoxScoreValues>) {
    this.values = { ...emptyBoxScore(), ...values };
  }

  get(field: BoxScoreField): number {
    return this.values[field];
  }

  set(field: BoxScoreField, value: number): void {
    this.values[field] = value;
  }

  add(field: BoxScoreField, amount = 1): void {
    this.values[field] += amount;
  }

  get points(): number {
    return this.values.points;
  }

  get rebounds(): number {
    return this.values.offensiveRebounds + this.values.defensiveRebounds;
  }

  /** 命中率，0..1；没有出手返回 null，交给展示层决定显示成什么。 */
  rate(made: BoxScoreField, attempted: BoxScoreField): number | null {
    const attempts = this.values[attempted];
    return attempts === 0 ? null : this.values[made] / attempts;
  }

  get fieldGoalRate(): number | null {
    return this.rate('fieldGoalsMade', 'fieldGoalsAttempted');
  }

  get threePointRate(): number | null {
    return this.rate('threePointersMade', 'threePointersAttempted');
  }

  get freeThrowRate(): number | null {
    return this.rate('freeThrowsMade', 'freeThrowsAttempted');
  }

  snapshot(): BoxScoreValues {
    return { ...this.values };
  }
}
