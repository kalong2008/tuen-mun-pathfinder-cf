import {
  buildAttendanceReport,
  normalizeAttendanceFilters,
  normalizeAttendanceRows,
  resolveDateRange,
  type AttendanceFilters,
} from "../attendance/report";
import { fetchWorksheetRowPage } from "./nocoly";

const ATTENDANCE_WORKSHEET_ID = "69ca006a59589a6272c95c8b";
const PAGE_SIZE = 1000;

export class AttendanceReportError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AttendanceReportError";
    this.status = status;
  }
}

type RowPagePayload = {
  rows?: unknown;
  data?: {
    rows?: unknown;
  };
};

function readRows(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") {
    throw new AttendanceReportError("Received malformed attendance payload from Nocoly.", 502);
  }

  const response = payload as RowPagePayload;
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.data?.rows)) return response.data.rows;

  throw new AttendanceReportError("Received malformed attendance payload from Nocoly.", 502);
}

async function fetchAllAttendanceRows(): Promise<unknown[]> {
  const rows: unknown[] = [];
  const seenFullPages = new Set<string>();
  let pageIndex = 1;

  while (true) {
    let payload: unknown;
    try {
      payload = await fetchWorksheetRowPage(ATTENDANCE_WORKSHEET_ID, {
        pageSize: PAGE_SIZE,
        pageIndex,
        tableView: true,
      });
    } catch (error) {
      if (error instanceof AttendanceReportError) throw error;
      throw new AttendanceReportError("Failed to fetch attendance rows from Nocoly.", 502);
    }

    const pageRows = readRows(payload);
    if (pageRows.length === PAGE_SIZE) {
      const pageSignature = JSON.stringify(pageRows);
      if (seenFullPages.has(pageSignature)) {
        throw new AttendanceReportError("Nocoly returned the same full attendance page repeatedly.", 502);
      }
      seenFullPages.add(pageSignature);
    }

    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) return rows;
    pageIndex += 1;
  }
}

export async function loadAttendanceReport(input: {
  preset: string | null;
  startDate: string | null;
  endDate: string | null;
}) {
  const preset = input.preset ?? "this-month";
  const defaultRange = resolveDateRange({ preset });
  const startDate = input.startDate ?? defaultRange.startDate;
  const endDate = input.endDate ?? defaultRange.endDate;
  const effectiveFilters: AttendanceFilters = normalizeAttendanceFilters({
    preset,
    startDate,
    endDate,
  });

  if (input.startDate !== null && effectiveFilters.startDate === null) {
    throw new AttendanceReportError("startDate must be a valid supported date format.", 400);
  }

  if (input.endDate !== null && effectiveFilters.endDate === null) {
    throw new AttendanceReportError("endDate must be a valid supported date format.", 400);
  }

  if (
    effectiveFilters.startDate &&
    effectiveFilters.endDate &&
    effectiveFilters.startDate > effectiveFilters.endDate
  ) {
    throw new AttendanceReportError("startDate cannot be later than endDate.", 400);
  }

  const payload = await fetchAllAttendanceRows();
  const { records, invalidRowCount, invalidRows } = normalizeAttendanceRows(payload);
  return {
    ...buildAttendanceReport(records, effectiveFilters),
    invalidRowCount,
    invalidRows,
  };
}
