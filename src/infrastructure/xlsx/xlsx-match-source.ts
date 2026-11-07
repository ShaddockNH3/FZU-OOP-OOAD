import type { MatchSource, RawMatch } from '@/application/ports';
import { parseArrayBuffer } from './workbook-reader';

/** 从 URL 或本地文件读比赛的适配器。 */
export class XlsxMatchSource implements MatchSource {
  async loadFromUrl(url: string): Promise<RawMatch> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`比赛文件读取失败：${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return parseArrayBuffer(buffer, fileLabel(url));
  }

  async loadFromFile(file: File): Promise<RawMatch> {
    const buffer = await file.arrayBuffer();
    return parseArrayBuffer(buffer, file.name);
  }
}

function fileLabel(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name.replace(/\.[^.]+$/, '');
}
