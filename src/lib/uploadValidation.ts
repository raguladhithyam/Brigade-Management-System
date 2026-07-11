import * as XLSX from 'xlsx';
import { collection, doc, getDocs, query, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RowIssue {
  /** 1-based row number in the spreadsheet (accounts for the header row). */
  row: number;
  key: string;
  type: 'invalid' | 'duplicate';
  reason: string;
}

export interface ValidationReport<T> {
  totalRows: number;
  /** Deduplicated, valid records ready to commit (last occurrence wins on dup keys). */
  validRecords: T[];
  issues: RowIssue[];
  invalidCount: number;
  duplicateCount: number;
}

/** Read the first worksheet of an .xlsx file into an array of row-arrays. */
export function parseWorkbook(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export interface Student {
  stdroll: string;
  stdname: string;
  stdbg: string;
}

export interface Brigade {
  bnameno: string;
  blname: string;
  blno: string;
  venue: string;
}

const cell = (v: any) => (v === undefined || v === null ? '' : String(v).trim());

export function validateStudents(rows: any[][]): ValidationReport<Student> {
  const dataRows = rows.slice(1); // drop header
  const issues: RowIssue[] = [];
  const seen = new Map<string, number>(); // key -> index in validRecords
  const validRecords: Student[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  dataRows.forEach((row, i) => {
    const rowNo = i + 2; // +1 for header, +1 for 1-based
    const stdroll = cell(row[0]).toUpperCase();
    const stdname = cell(row[1]);
    const stdbg = cell(row[2]);

    const reasons: string[] = [];
    if (!stdroll) reasons.push('Missing roll number');
    if (!stdname) reasons.push('Missing name');
    if (!stdbg) reasons.push('Missing brigade');

    if (reasons.length > 0) {
      invalidCount++;
      issues.push({ row: rowNo, key: stdroll || '(blank)', type: 'invalid', reason: reasons.join(', ') });
      return;
    }

    const record: Student = { stdroll, stdname, stdbg };
    if (seen.has(stdroll)) {
      duplicateCount++;
      issues.push({
        row: rowNo,
        key: stdroll,
        type: 'duplicate',
        reason: 'Duplicate roll number in file — later row will overwrite earlier',
      });
      validRecords[seen.get(stdroll)!] = record; // last occurrence wins
    } else {
      seen.set(stdroll, validRecords.length);
      validRecords.push(record);
    }
  });

  return { totalRows: dataRows.length, validRecords, issues, invalidCount, duplicateCount };
}

export function validateBrigades(rows: any[][]): ValidationReport<Brigade> {
  const dataRows = rows.slice(1);
  const issues: RowIssue[] = [];
  const seen = new Map<string, number>();
  const validRecords: Brigade[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  dataRows.forEach((row, i) => {
    const rowNo = i + 2;
    const bnameno = cell(row[0]);
    const blname = cell(row[1]);
    const blno = cell(row[2]);
    const venue = cell(row[3]);

    const reasons: string[] = [];
    if (!bnameno) reasons.push('Missing brigade number');
    if (!blname) reasons.push('Missing lead name');
    if (!blno) reasons.push('Missing phone');
    else if (!/^\d{10}$/.test(blno)) reasons.push('Phone must be 10 digits');
    if (!venue) reasons.push('Missing venue');

    if (reasons.length > 0) {
      invalidCount++;
      issues.push({ row: rowNo, key: bnameno || '(blank)', type: 'invalid', reason: reasons.join(', ') });
      return;
    }

    const record: Brigade = { bnameno, blname, blno, venue };
    if (seen.has(bnameno)) {
      duplicateCount++;
      issues.push({
        row: rowNo,
        key: bnameno,
        type: 'duplicate',
        reason: 'Duplicate brigade number in file — later row will overwrite earlier',
      });
      validRecords[seen.get(bnameno)!] = record;
    } else {
      seen.set(bnameno, validRecords.length);
      validRecords.push(record);
    }
  });

  return { totalRows: dataRows.length, validRecords, issues, invalidCount, duplicateCount };
}

/**
 * Cross-check a set of keys against existing documents in a collection and return
 * the subset that already exists (and would be overwritten). Reads are batched via
 * `documentId() in` queries (max 30 ids each). Cost scales with matches, so this is
 * opt-in from the UI.
 */
export async function findExistingKeys(collectionName: string, keys: string[]): Promise<Set<string>> {
  const existing = new Set<string>();
  // Reading the whole collection once is cheaper than N point reads when the file is large.
  const snap = await getDocs(query(collection(db, collectionName)));
  const present = new Set(snap.docs.map((d) => d.id));
  keys.forEach((k) => {
    if (present.has(k)) existing.add(k);
  });
  return existing;
}

/**
 * Commit records with batched writes (500 per batch — Firestore's limit), reporting
 * progress. No artificial delay: a 1000-row upload is a handful of batch commits.
 */
export async function batchUpload<T extends Record<string, any>>(
  collectionName: string,
  records: T[],
  keyField: keyof T,
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const BATCH_SIZE = 500;
  let committed = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const slice = records.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    slice.forEach((record) => {
      const id = String(record[keyField]);
      batch.set(doc(db, collectionName, id), record);
    });
    await batch.commit();
    committed += slice.length;
    onProgress?.(committed, records.length);
  }
  return committed;
}
