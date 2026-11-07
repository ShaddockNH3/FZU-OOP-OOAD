import { BoxScore } from './box-score';

/**
 * 球员实体。
 *
 * 只存"这个人是谁、站位第几格、数据多少"，不存像素坐标 —— 坐标是渲染层的事情。
 * `slot` 同时决定首发造型站位（0..4 在场上）和球衣号码生成，跨换人保持稳定。
 */
export class Player {
  readonly stats = new BoxScore();

  constructor(
    readonly id: string,
    readonly name: string,
    readonly number: string,
    readonly slot: number
  ) {}

  get isStarter(): boolean {
    return this.slot < 5;
  }
}
