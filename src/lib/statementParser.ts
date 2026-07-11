// Parser de extratos/faturas bancárias (OFX e CSV) para a importação manual.
// Objetivo: extrair uma lista de transações candidatas para o usuário revisar
// e confirmar na tela — nunca salvamos nada direto a partir daqui.

import * as XLSX from "xlsx";

export interface ParsedStatementTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  /** Valor em reais (não em centavos). Sinal indica entrada (+) ou saída (-). */
  amount: number;
  /** Identificador do banco (FITID no OFX), usado para ajudar a detectar duplicatas. */
  externalId?: string;
}

/** Converte "1.234,56", "1234,56" ou "1234.56" para 1234.56 (número). */
function parseLocaleAmount(raw: string): number {
  let value = raw.trim().replace(/[^\d,.-]/g, "");
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    // O último separador é o decimal; o outro é milhar e é removido.
    if (lastComma > lastDot) {
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    value = value.replace(/\./g, "").replace(",", ".");
  }
  // Se só houver ponto (ou nenhum separador), já está em formato válido para Number().

  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function ddmmyyyyToIso(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!match) return null;
  const [, d, m, yRaw] = match;
  const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function isoOrNull(raw: string): string | null {
  const match = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Extrai o valor de uma tag OFX simples (SGML): <TAG>valor (sem fechamento ou com </TAG>). */
function ofxTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, "i"));
  return match ? match[1].trim() : null;
}

export function parseOFX(content: string): ParsedStatementTransaction[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>|$)/gi) || [];
  const results: ParsedStatementTransaction[] = [];

  for (const block of blocks) {
    const amountRaw = ofxTag(block, "TRNAMT");
    const dateRaw = ofxTag(block, "DTPOSTED");
    const name = ofxTag(block, "NAME") || ofxTag(block, "MEMO") || "Transação importada";
    const fitId = ofxTag(block, "FITID") || undefined;

    if (!amountRaw || !dateRaw) continue;

    // DTPOSTED vem como YYYYMMDDHHMMSS[.xxx][timezone] — pegamos só os 8 primeiros dígitos.
    const digits = dateRaw.replace(/\D/g, "");
    if (digits.length < 8) continue;
    const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;

    results.push({
      date: iso,
      description: name,
      amount: parseLocaleAmount(amountRaw),
      externalId: fitId,
    });
  }

  return results;
}

const HEADER_ALIASES = {
  date: ["data", "date", "dt", "data lancamento", "data lançamento"],
  description: [
    "descricao",
    "descrição",
    "historico",
    "histórico",
    "description",
    "lancamento",
    "lançamento",
    "memo",
  ],
  amount: ["valor", "amount", "value", "valor (r$)", "montante"],
};

const DIACRITIC_MARK_RANGE = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeHeader(h: string) {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITIC_MARK_RANGE, "");
}

function findColumnIndex(headerRow: string[], aliases: string[]) {
  const normalized = headerRow.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(normalizeHeader(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseCSV(content: string): ParsedStatementTransaction[] {
  const workbook = XLSX.read(content, { type: "string", raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  });

  if (rows.length === 0) return [];

  const firstRow = rows[0].map((c) => String(c ?? ""));
  let dateIdx = findColumnIndex(firstRow, HEADER_ALIASES.date);
  let descIdx = findColumnIndex(firstRow, HEADER_ALIASES.description);
  let amountIdx = findColumnIndex(firstRow, HEADER_ALIASES.amount);

  let dataRows = rows.slice(1);
  const hasHeader = dateIdx !== -1 || descIdx !== -1 || amountIdx !== -1;

  if (!hasHeader) {
    // Sem cabeçalho reconhecido: assume a ordem mais comum (data, descrição, valor).
    dateIdx = 0;
    descIdx = 1;
    amountIdx = 2;
    dataRows = rows;
  }

  const results: ParsedStatementTransaction[] = [];

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;
    const rawDate = String(row[dateIdx] ?? "").trim();
    const rawDesc = String(row[descIdx] ?? "").trim();
    const rawAmount = String(row[amountIdx] ?? "").trim();

    if (!rawDate || !rawAmount) continue;

    const iso = isoOrNull(rawDate) || ddmmyyyyToIso(rawDate);
    if (!iso) continue;

    results.push({
      date: iso,
      description: rawDesc || "Transação importada",
      amount: parseLocaleAmount(rawAmount),
    });
  }

  return results;
}

export function parseStatementFile(
  fileName: string,
  content: string,
): ParsedStatementTransaction[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".ofx") || content.includes("<OFX>")) {
    return parseOFX(content);
  }
  return parseCSV(content);
}
