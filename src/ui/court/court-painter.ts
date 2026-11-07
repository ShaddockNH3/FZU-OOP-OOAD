import { Container, Graphics } from 'pixi.js';
import { CENTER, COURT } from './geometry';
import { COURT_COLORS } from './palette';

/** 画一次球场，之后不再重绘（球员和球在别的图层）。 */
export function paintCourt(): Container {
  const layer = new Container();
  const graphics = new Graphics();

  const left = COURT.padding;
  const top = COURT.padding;
  const right = COURT.width - COURT.padding;
  const bottom = COURT.height - COURT.padding;
  const courtWidth = right - left;
  const courtHeight = bottom - top;

  graphics.rect(left, top, courtWidth, courtHeight).fill({ color: COURT_COLORS.floor });

  // 两侧禁区
  graphics
    .rect(left, CENTER.y - COURT.keyHeight / 2, COURT.keyWidth, COURT.keyHeight)
    .rect(right - COURT.keyWidth, CENTER.y - COURT.keyHeight / 2, COURT.keyWidth, COURT.keyHeight)
    .fill({ color: COURT_COLORS.floorKey, alpha: 0.85 });

  const stroke = { color: COURT_COLORS.line, width: 3, alpha: 0.95 };

  // 边线、中线、中圈
  graphics.rect(left, top, courtWidth, courtHeight).stroke({ color: COURT_COLORS.line, width: 4 });
  graphics.moveTo(CENTER.x, top).lineTo(CENTER.x, bottom).stroke(stroke);
  graphics.circle(CENTER.x, CENTER.y, COURT.centerCircleRadius).stroke(stroke);

  // 禁区线 + 罚球圈
  graphics
    .rect(left, CENTER.y - COURT.keyHeight / 2, COURT.keyWidth, COURT.keyHeight)
    .rect(right - COURT.keyWidth, CENTER.y - COURT.keyHeight / 2, COURT.keyWidth, COURT.keyHeight)
    .stroke(stroke);
  graphics.circle(left + COURT.keyWidth, CENTER.y, COURT.freeThrowRadius).stroke(stroke);
  graphics.circle(right - COURT.keyWidth, CENTER.y, COURT.freeThrowRadius).stroke(stroke);

  // 三分线：左筐扫右半圆，右筐扫左半圆
  for (const hoopX of [left + COURT.hoopInset, right - COURT.hoopInset]) {
    const radius = COURT.threePointRadius;
    const baseline = hoopX < CENTER.x ? left : right;
    const [from, to] = hoopX < CENTER.x ? [-Math.PI / 2, Math.PI / 2] : [Math.PI / 2, (Math.PI * 3) / 2];

    graphics.moveTo(hoopX, CENTER.y - radius).arc(hoopX, CENTER.y, radius, from, to).stroke(stroke);
    graphics
      .moveTo(hoopX, CENTER.y - radius)
      .lineTo(baseline, CENTER.y - radius)
      .moveTo(hoopX, CENTER.y + radius)
      .lineTo(baseline, CENTER.y + radius)
      .stroke(stroke);
  }

  // 篮板与篮筐
  for (const hoopX of [left + COURT.hoopInset, right - COURT.hoopInset]) {
    const boardX = hoopX < CENTER.x ? left + 12 : right - 12;
    graphics.moveTo(boardX, CENTER.y - 34).lineTo(boardX, CENTER.y + 34).stroke({ color: COURT_COLORS.board, width: 5 });
    graphics.circle(hoopX, CENTER.y, COURT.hoopRadius).stroke({ color: COURT_COLORS.hoop, width: 5 });
    graphics.moveTo(boardX, CENTER.y).lineTo(hoopX, CENTER.y).stroke({ color: COURT_COLORS.hoop, width: 3 });
  }

  layer.addChild(graphics);
  return layer;
}
