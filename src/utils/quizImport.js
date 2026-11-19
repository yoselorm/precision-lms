import { nanoid } from "@reduxjs/toolkit";

// Bulk quiz authoring: a CSV template (opens in Excel / Google Sheets) with
// one question per row, read back into the QuizBuilder's question shape
// ({ type, prompt, options: [labels], correct: [option indexes] }).

export const MAX_OPTIONS = 6;
const OPTION_HEADERS = Array.from({ length: MAX_OPTIONS }, (_, i) => `option_${i + 1}`);
export const TEMPLATE_HEADERS = ["question", "type", ...OPTION_HEADERS, "correct"];

const EXAMPLE_ROWS = [
  ["What is the first step in an outbreak investigation?", "single", "Implement control measures", "Prepare for field work", "Write the final report", "", "", "", "2"],
  ["Which of these are needed to confirm an outbreak? (select all)", "multi", "A baseline to compare against", "A verified diagnosis", "A press release", "", "", "", "1,2"],
  ["Case definitions must include time, place and person.", "single", "True", "False", "", "", "", "", "A"],
];

const csvCell = (value) => (/[",\n\r]/.test(value) ? `"${String(value).replace(/"/g, '""')}"` : String(value));

// Template with three worked examples to overwrite. "correct" takes option
// numbers (1–6) or letters (A–F); several for "multi", comma-separated.
export function buildTemplateCsv() {
  return [TEMPLATE_HEADERS, ...EXAMPLE_ROWS].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// RFC 4180-ish parser: quoted fields, escaped quotes, newlines inside quotes.
// Some spreadsheet locales save with ";" — detected from the header line.
export function parseCsv(text) {
  const source = text.replace(/^﻿/, "");
  const headerLine = source.split(/\r?\n/, 1)[0] || "";
  const delimiter = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// "2" / "1,3" / "B" / "a, c" -> option indexes.
function parseCorrect(value, optionCount) {
  const parts = String(value)
    .split(/[,;/ ]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const indexes = parts.map((p) => (/^\d+$/.test(p) ? Number(p) - 1 : /^[a-z]$/i.test(p) ? p.toUpperCase().charCodeAt(0) - 65 : NaN));
  if (!indexes.length || indexes.some((i) => !Number.isInteger(i) || i < 0 || i >= optionCount)) return null;
  return [...new Set(indexes)].sort((a, b) => a - b);
}

// Resolves to { questions, errors: [{ row, message }] }. Row numbers match
// the spreadsheet (header is row 1). Blank options are skipped, so options
// keep their numbering only if filled in order.
export function parseQuizCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { questions: [], errors: [{ row: 1, message: "The file is empty." }] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  if (col("question") === -1 || col("correct") === -1 || col("option_1") === -1) {
    return { questions: [], errors: [{ row: 1, message: "This doesn't look like the quiz template — download the template and fill that in." }] };
  }

  const questions = [];
  const errors = [];
  rows.slice(1).forEach((cells, i) => {
    const row = i + 2;
    const get = (name) => (col(name) === -1 ? "" : (cells[col(name)] || "").trim());
    const prompt = get("question");
    const options = OPTION_HEADERS.map(get).filter(Boolean);
    if (!prompt) return errors.push({ row, message: "No question text." });
    if (options.length < 2) return errors.push({ row, message: "Needs at least two options." });
    const correct = parseCorrect(get("correct"), options.length);
    if (!correct) return errors.push({ row, message: `"correct" should be option numbers 1–${options.length} (or letters), e.g. 2 or 1,3.` });
    // An explicit type wins; left blank, it follows the number of answers.
    const typeText = get("type").toLowerCase();
    const type = !typeText
      ? correct.length > 1
        ? "multi"
        : "single"
      : typeText.startsWith("multi") || typeText.includes("all")
      ? "multi"
      : typeText.startsWith("single")
      ? "single"
      : null;
    if (!type) return errors.push({ row, message: 'Type should be "single" or "multi".' });
    if (type === "single" && correct.length > 1) return errors.push({ row, message: 'A "single" question can only have one correct option — use "multi" for several.' });
    questions.push({ id: `q-${nanoid(6)}`, type, prompt, options, correct });
  });
  return { questions, errors };
}
