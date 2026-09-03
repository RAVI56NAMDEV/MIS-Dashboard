import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ColumnMapping } from '../types';
import { autoDetectColumnMapping } from './columnMapper';

export interface ExcelParseResult {
  isValid: boolean;
  error?: string;
  filename: string;
  rawRows: Record<string, any>[];
  availableColumns: string[];
  mapping: ColumnMapping;
  summary: {
    rowCount: number;
    columnCount: number;
    detectedFieldsCount: number;
  };
}

/**
 * Sanitizes a row record to ensure no undefined values.
 * Preserves all source values, preserving blank strings for empty cells without synthetic auto-filling.
 */
function sanitizeRow(row: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const keys = Object.keys(row);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const val = row[key];
    if (val === undefined || val === null) {
      sanitized[key] = '';
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else {
      sanitized[key] = String(val);
    }
  }
  return sanitized;
}

/**
 * Reads and parses an Excel (.xlsx, .xls) or CSV (.csv) file in the browser.
 * Preserves all original values and blanks without generating synthetic or sample data.
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const raw = (results.data as Record<string, any>[]).filter((row) =>
              Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
            );

            if (raw.length === 0) {
              return resolve({
                isValid: false,
                error: 'Unable to read this Excel file. The uploaded file contains no data rows.',
                filename: file.name,
                rawRows: [],
                availableColumns: [],
                mapping: {} as ColumnMapping,
                summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
              });
            }

            const rawCols = Object.keys(raw[0] || {}).map((c) => c.trim()).filter(Boolean);
            if (rawCols.length === 0) {
              return resolve({
                isValid: false,
                error: 'Unable to read this Excel file. No column headers detected in the first row.',
                filename: file.name,
                rawRows: [],
                availableColumns: [],
                mapping: {} as ColumnMapping,
                summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
              });
            }

            const sanitizedRows = raw.map(sanitizeRow);
            const mapping = autoDetectColumnMapping(rawCols);
            const mappedCount = Object.values(mapping).filter(Boolean).length;

            resolve({
              isValid: true,
              filename: file.name,
              rawRows: sanitizedRows,
              availableColumns: rawCols,
              mapping,
              summary: {
                rowCount: sanitizedRows.length,
                columnCount: rawCols.length,
                detectedFieldsCount: mappedCount,
              },
            });
          } catch (err: any) {
            resolve({
              isValid: false,
              error: `Unable to read this Excel file: ${err?.message || 'Invalid format'}`,
              filename: file.name,
              rawRows: [],
              availableColumns: [],
              mapping: {} as ColumnMapping,
              summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
            });
          }
        },
        error: (err) => {
          resolve({
            isValid: false,
            error: `Unable to read this Excel file. CSV parsing error: ${err.message}`,
            filename: file.name,
            rawRows: [],
            availableColumns: [],
            mapping: {} as ColumnMapping,
            summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
          });
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return resolve({
              isValid: false,
              error: 'Unable to read this Excel file. The workbook has no valid sheets.',
              filename: file.name,
              rawRows: [],
              availableColumns: [],
              mapping: {} as ColumnMapping,
              summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
            });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
            defval: '',
            raw: false,
            dateNF: 'yyyy-mm-dd',
          });

          const raw = json.filter((row) =>
            Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
          );

          if (raw.length === 0) {
            return resolve({
              isValid: false,
              error: 'Unable to read this Excel file. The uploaded worksheet contains no valid data rows.',
              filename: file.name,
              rawRows: [],
              availableColumns: [],
              mapping: {} as ColumnMapping,
              summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
            });
          }

          const rawCols = Object.keys(raw[0] || {}).map((c) => c.trim()).filter(Boolean);
          if (rawCols.length === 0) {
            return resolve({
              isValid: false,
              error: 'Unable to read this Excel file. No column headers detected in the first row.',
              filename: file.name,
              rawRows: [],
              availableColumns: [],
              mapping: {} as ColumnMapping,
              summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
            });
          }

          const sanitizedRows = raw.map(sanitizeRow);
          const mapping = autoDetectColumnMapping(rawCols);
          const mappedCount = Object.values(mapping).filter(Boolean).length;

          resolve({
            isValid: true,
            filename: file.name,
            rawRows: sanitizedRows,
            availableColumns: rawCols,
            mapping,
            summary: {
              rowCount: sanitizedRows.length,
              columnCount: rawCols.length,
              detectedFieldsCount: mappedCount,
            },
          });
        } catch (err: any) {
          resolve({
            isValid: false,
            error: `Unable to read this Excel file. Please upload a valid MIS Excel file. (${err?.message || 'Invalid format'})`,
            filename: file.name,
            rawRows: [],
            availableColumns: [],
            mapping: {} as ColumnMapping,
            summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
          });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: false,
          error: 'Unable to read this Excel file from disk.',
          filename: file.name,
          rawRows: [],
          availableColumns: [],
          mapping: {} as ColumnMapping,
          summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
        });
      };

      reader.readAsArrayBuffer(file);
    } else {
      resolve({
        isValid: false,
        error: 'Unable to read this file. Please upload a valid MIS Excel file (.xlsx or .xls).',
        filename: file.name,
        rawRows: [],
        availableColumns: [],
        mapping: {} as ColumnMapping,
        summary: { rowCount: 0, columnCount: 0, detectedFieldsCount: 0 },
      });
    }
  });
}
