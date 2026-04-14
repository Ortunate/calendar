import * as XLSX from 'xlsx'

export type ImportSheetRow = Record<string, string>

export type ImportWorkbook = {
  sheetNames: string[]
  rows: ImportSheetRow[]
}

function trimHeader(header: unknown, index: number) {
  const normalizedHeader = String(header ?? '').trim()

  return normalizedHeader || `column_${index + 1}`
}

function normalizeCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function isEmptyRow(row: ImportSheetRow) {
  return Object.values(row).every((value) => value === '')
}

function sheetToRows(sheet: XLSX.WorkSheet): ImportSheetRow[] {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })

  if (matrix.length === 0) {
    return []
  }

  const [headerRow, ...dataRows] = matrix
  const headers = (headerRow ?? []).map((header, index) => trimHeader(header, index))

  return dataRows
    .map((row) => {
      const result: ImportSheetRow = {}

      headers.forEach((header, index) => {
        result[header] = normalizeCellValue(row?.[index])
      })

      return result
    })
    .filter((row) => !isEmptyRow(row))
}

async function readWorkbook(file: File) {
  const buffer = await file.arrayBuffer()

  return XLSX.read(buffer, {
    type: 'array',
  })
}

export async function listWorkbookSheets(file: File): Promise<string[]> {
  const workbook = await readWorkbook(file)

  return workbook.SheetNames
}

export async function readSheetRows(
  file: File,
  sheetName: string,
): Promise<ImportSheetRow[]> {
  const workbook = await readWorkbook(file)
  const sheet = workbook.Sheets[sheetName]

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found.`)
  }

  return sheetToRows(sheet)
}

export async function readCsvRows(file: File): Promise<ImportSheetRow[]> {
  const workbook = await readWorkbook(file)
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    return []
  }

  return sheetToRows(workbook.Sheets[firstSheetName])
}

export async function readImportWorkbook(file: File): Promise<ImportWorkbook> {
  const workbook = await readWorkbook(file)
  const firstSheetName = workbook.SheetNames[0]

  return {
    sheetNames: workbook.SheetNames,
    rows: firstSheetName ? sheetToRows(workbook.Sheets[firstSheetName]) : [],
  }
}
