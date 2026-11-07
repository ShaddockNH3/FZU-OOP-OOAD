import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 分层依赖检查。
 *
 * 用一条测试卡住 import 方向：口头约定撑不过三个月，测试能。
 */

const SRC = resolve(process.cwd(), 'src');

type Layer = 'domain' | 'application' | 'infrastructure' | 'ui' | 'app' | 'entry';

const ALLOWED: Record<Layer, readonly Layer[]> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure'],
  ui: ['domain', 'application', 'infrastructure', 'ui', 'app'],
  app: ['domain', 'application', 'infrastructure', 'app'],
  entry: ['domain', 'application', 'infrastructure', 'ui', 'app', 'entry']
};

const FORBIDDEN_IN_CORE = ['pixi.js', 'vue', 'naive-ui', '@phosphor-icons/vue', 'xlsx'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function layerOf(file: string): Layer {
  const [, first] = relative(SRC, file).split('/');
  if (first === undefined) return 'entry';
  if (first === 'domain' || first === 'application' || first === 'infrastructure' || first === 'ui' || first === 'app') {
    return first;
  }
  return 'entry';
}

function importSpecifiers(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const matches = [...source.matchAll(/^\s*import\s+(?:type\s+)?[^'"]*from\s+['"]([^'"]+)['"]/gm)];
  const dynamic = [...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)];
  return [...matches, ...dynamic].map((match) => match[1]);
}

function resolveTarget(file: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) return join(SRC, specifier.slice(2));
  if (specifier.startsWith('.')) return resolve(file, '..', specifier);
  return null;
}

const files = walk(SRC).filter((file) => /\.(ts|vue)$/.test(file));

describe('分层依赖', () => {
  it('文件都归到层里了', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('domain / application / infrastructure / ui / app 之间只允许单向依赖', () => {
    const violations: string[] = [];

    for (const file of files) {
      const from = layerOf(file);
      for (const specifier of importSpecifiers(file)) {
        const target = resolveTarget(file, specifier);
        if (!target) continue;
        const to = layerOf(target);
        if (!ALLOWED[from].includes(to)) {
          violations.push(`${relative(SRC, file)} (${from}) → ${specifier} (${to})`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('domain 与 application 不碰框架和渲染库', () => {
    const violations: string[] = [];

    for (const file of files) {
      const layer = layerOf(file);
      if (layer !== 'domain' && layer !== 'application') continue;
      for (const specifier of importSpecifiers(file)) {
        if (FORBIDDEN_IN_CORE.includes(specifier)) {
          violations.push(`${relative(SRC, file)} (${layer}) → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
