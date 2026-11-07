import * as XLSX from 'xlsx';
import type { RawMatch, RawMatchRow } from '@/application/ports';

/**
 * xlsx → RawMatch。
 *
 * 只做"读格子"，不认识投篮、犯规这些概念；语义交给应用层的事件工厂。
 * 表格约定：四张表 c1..c4 对应四节，表头两行，第 3 行起每行
 * `时间 | 主队动作 | 比分 | 客队动作`。
 */
const SHEET_PATTERN = /^c(\d+)$/i;
const HEADER_ROWS = 2;

export function parseWorkbook(workbook: XLSX.WorkBook, title: string): RawMatch {
  const sheets = quarterSheets(workbook);

  const rows: RawMatchRow[] = [];
  let homeName = '主队';
  let awayName = '客队';

  for (const [order, { quarter, sheet }] of sheets.entries()) {
    const grid = sheetToGrid(sheet);
    if (order === 0) {
      const header = grid[HEADER_ROWS - 1];
      homeName = cellText(header?.[1]) || homeName;
      awayName = cellText(header?.[3]) || awayName;
    }

    for (let index = HEADER_ROWS; index < grid.length; index += 1) {
      const line = grid[index];
      if (!line) continue;
      rows.push({
        quarter,
        time: cellText(line[0]),
        homeAction: cellText(line[1]),
        score: cellText(line[2]),
        awayAction: cellText(line[3])
      });
    }
  }

  return { title, homeName, awayName, rows };
}

export function parseArrayBuffer(buffer: ArrayBuffer, title: string): RawMatch {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return parseWorkbook(workbook, title);
}

function quarterSheets(workbook: XLSX.WorkBook): Array<{ quarter: number; sheet: XLSX.WorkSheet }> {
  const found: Array<{ quarter: number; sheet: XLSX.WorkSheet }> = [];

  for (const name of workbook.SheetNames) {
    const matched = SHEET_PATTERN.exec(name);
    if (!matched) continue;
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    found.push({ quarter: Number(matched[1]), sheet });
  }

  return found.sort((a, b) => a.quarter - b.quarter);
}

function sheetToGrid(sheet: XLSX.WorkSheet): string[][] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false
  });
  return raw.map((line) => line.map(cellText));
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}
