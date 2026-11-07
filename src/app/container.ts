import { MatchAssembler } from '@/application/match-assembler';
import { MatchEngine } from '@/application/match-engine';
import type { MatchSource } from '@/application/ports';
import { BrowserScheduler } from '@/infrastructure/browser-scheduler';
import { XlsxMatchSource } from '@/infrastructure/xlsx/xlsx-match-source';

/** 组合根：具体实现只在这里 new，其余位置全部依赖接口。 */
export interface AppContainer {
  readonly matchSource: MatchSource;
  readonly assembler: MatchAssembler;
  createEngine(): MatchEngine;
}

export function createContainer(): AppContainer {
  const matchSource = new XlsxMatchSource();
  const assembler = new MatchAssembler();

  return {
    matchSource,
    assembler,
    createEngine: () => new MatchEngine(new BrowserScheduler())
  };
}
