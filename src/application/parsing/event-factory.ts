import type { GameEvent } from '@/domain/events';
import { DEFAULT_RULES, type ActionContext, type ActionRule } from './rules';

/**
 * 事件工厂。
 *
 * 只负责"一段文字该变成哪种事件"。规则表可替换，单测可以只喂一条规则，
 * 以后接别的表格格式也不用动这里。
 */
export class EventFactory {
  private readonly ruleList: readonly ActionRule[];

  constructor(rules: readonly ActionRule[] = DEFAULT_RULES) {
    this.ruleList = rules;
  }

  get rules(): readonly ActionRule[] {
    return this.ruleList;
  }

  create(context: ActionContext): GameEvent | null {
    for (const rule of this.ruleList) {
      const event = rule.tryCreate(context);
      if (event) return event;
    }
    return null;
  }
}
