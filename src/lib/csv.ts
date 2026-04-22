/**
 * Simple RFC-4180-ish CSV generator. Escapes double quotes and wraps fields
 * that contain quote / comma / newline in quotes.
 */

export type CsvRow = Array<string | number | null | undefined>;

function escapeField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: CsvRow[]): string {
  return rows.map((row) => row.map(escapeField).join(",")).join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  const body = `﻿${csv}`; // BOM for Excel UTF-8
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
