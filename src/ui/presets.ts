export interface MatchPreset {
  readonly label: string;
  readonly url: string;
}

/** 预置比赛，随 `public/` 一起发布。 */
export const MATCH_PRESETS: MatchPreset[] = [
  { label: '比赛 1', url: `${import.meta.env.BASE_URL}match.xlsx` },
  { label: '比赛 2', url: `${import.meta.env.BASE_URL}match2.xlsx` }
];
