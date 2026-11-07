import type { TeamSide } from '@/domain/game/team';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** 球场逻辑坐标（Pixi 内部单位）。CSS 负责等比缩放，绘制代码只认这套坐标。 */
export const COURT = {
  width: 960,
  height: 540,
  padding: 44,
  keyWidth: 150,
  keyHeight: 200,
  freeThrowRadius: 56,
  centerCircleRadius: 66,
  hoopInset: 46,
  hoopRadius: 14,
  threePointRadius: 196,
  playerRadius: 19,
  ballRadius: 9
} as const;

export const CENTER: Point = { x: COURT.width / 2, y: COURT.height / 2 };

/** 主队攻右筐，客队攻左筐。 */
export function attackingHoop(side: TeamSide): Point {
  const x = side === 'home' ? COURT.width - COURT.padding - COURT.hoopInset : COURT.padding + COURT.hoopInset;
  return { x, y: CENTER.y };
}

function defendHoop(side: TeamSide): Point {
  return attackingHoop(side === 'home' ? 'away' : 'home');
}

/** 篮板落点：靠近自家篮筐，动画里球从这里弹出。 */
export function reboundSpot(side: TeamSide): Point {
  const hoop = defendHoop(side);
  const towardCenter = side === 'home' ? 90 : -90;
  return { x: hoop.x + towardCenter, y: CENTER.y - 30 };
}

const FORMATION: ReadonlyArray<Point> = [
  { x: 110, y: 0 },
  { x: 190, y: -120 },
  { x: 190, y: 120 },
  { x: 270, y: -50 },
  { x: 270, y: 50 }
];

/** 站位：主队在左半场一字排开，客队镜像。`slot` 超过 4 的替补挤在边线外。 */
export function formationPosition(side: TeamSide, slot: number): Point {
  const base = FORMATION[slot] ?? { x: 110 + (slot - 4) * 46, y: 210 };
  const x = COURT.padding + base.x;
  const y = CENTER.y + base.y;
  return side === 'home' ? { x, y: Math.min(y, COURT.height - 24) } : { x: COURT.width - x, y: Math.min(y, COURT.height - 24) };
}
