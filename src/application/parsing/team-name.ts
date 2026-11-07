const CITY_PREFIXES = [
  '洛杉矶',
  '明尼苏达',
  '俄克拉荷马城',
  '俄克拉荷马',
  '新奥尔良',
  '圣安东尼奥',
  '印第安纳',
  '波特兰',
  '萨克拉门托',
  '孟菲斯',
  '密尔沃基',
  '克利夫兰',
  '多伦多',
  '布鲁克林',
  '亚特兰大',
  '华盛顿',
  '菲尼克斯',
  '芝加哥',
  '休斯顿',
  '休斯敦',
  '底特律',
  '夏洛特',
  '奥兰多',
  '波士顿',
  '迈阿密',
  '丹佛',
  '犹他',
  '达拉斯',
  '费城',
  '纽约',
  '金州'
];

/** `洛杉矶湖人` → `湖人`，拿不到就退化成后两个字。 */
export function shortTeamName(name: string): string {
  const trimmed = name.trim();
  const city = CITY_PREFIXES.find((prefix) => trimmed.startsWith(prefix) && trimmed.length - prefix.length >= 2);
  if (city) return trimmed.slice(city.length);
  return trimmed.length > 3 ? trimmed.slice(-2) : trimmed;
}
