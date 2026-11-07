/**
 * 直播文字稿的文本规则。
 *
 * 原始数据是"人名 + 动作 + 括号补注"的自由文本，这里只做三件事：
 * 认出动作类型、切出人名、拆出助攻人。所有规则都放进一个表里，
 * 新增动作类型时加一行即可，不用再改 if/else 链。
 */

/** 投篮动作词，长的放前面，命中时优先报更具体的类型。 */
export const SHOT_VERBS = [
  '空中接力灌篮',
  '突破打板勾手投篮',
  '转身打板勾手投篮',
  '快攻打板抛投',
  '突破勾手投篮',
  '转身后仰投篮',
  '转身后仰打板',
  '行进间灌篮',
  '行进间挑篮',
  '行进间上篮',
  '突破反手上篮',
  '空切扣篮',
  '空切上篮',
  '反手灌篮',
  '突破上篮',
  '突破挑篮',
  '急停跳投',
  '撤步跳投',
  '漂移跳投',
  '后仰跳投',
  '勾手投篮',
  '直接补篮',
  '快攻抛投',
  '三分远投',
  '三分投篮',
  '勾手擦板',
  '挑篮上篮',
  '补扣篮',
  '补扣',
  '补篮',
  '扣篮',
  '灌篮',
  '上篮',
  '跳投',
  '抛投',
  '挑篮',
  '投篮',
  '三分'
] as const;

export interface ShotDescriptor {
  readonly verb: string;
  readonly index: number;
}

/** 找最先出现的投篮动作词。`三分投篮` 会命中 `三分投篮` 而不是 `投篮`。 */
export function findShotVerb(text: string): ShotDescriptor | null {
  let best: ShotDescriptor | null = null;
  for (const verb of SHOT_VERBS) {
    const index = text.indexOf(verb);
    if (index < 0) continue;
    if (!best || index < best.index || (index === best.index && verb.length > best.verb.length)) {
      best = { verb, index };
    }
  }
  return best;
}

/**
 * 切出动作前的人名。
 *
 * 文字稿里人名可能自带空格（`L. 勒布朗-詹姆斯`），动作前也可能带修饰词
 * （`行进间` / `空切` / `突破`……）。区分办法看空格位置：
 * 动作正前方有空格 → 空格前整段是人名；没有空格 → 那一截是修饰词，砍掉。
 */
export function nameBefore(text: string, actionIndex: number): string {
  const raw = text.slice(0, Math.max(actionIndex, 0));
  const trimmed = raw.trimEnd();
  const gluedToAction = raw.length === trimmed.length;
  const space = trimmed.lastIndexOf(' ');
  const name = gluedToAction && space >= 0 ? trimmed.slice(0, space) : trimmed;
  return name.trim().replace(/[：:]\s*$/, '');
}

/** 从 `(戴维斯 1 次助攻)` 里取助攻人。括号内不允许再出现括号，避免跨到前面的分值括号。 */
export function extractAssist(text: string): string | undefined {
  const matched = /\(([^()]+?)\s+\d+\s*次助攻\)/.exec(text);
  const name = matched?.[1]?.trim();
  return name && name.length > 0 ? name : undefined;
}

/** `107-98` → `{ home: 107, away: 98 }`。 */
export function parseScoreCell(cell: string): { home: number; away: number } | null {
  const matched = /^(\d+)\s*[-:]\s*(\d+)$/.exec(cell.trim());
  if (!matched) return null;
  const home = Number(matched[1]);
  const away = Number(matched[2]);
  return Number.isFinite(home) && Number.isFinite(away) ? { home, away } : null;
}

/** 判断文字里的人名是不是整支球队（`湖人` / `森林狼`）。 */
export function isTeamName(name: string, teamName: string, shortName: string): boolean {
  const candidate = name.trim();
  if (candidate.length === 0) return false;
  return candidate === teamName || candidate === shortName || teamName.endsWith(candidate);
}
