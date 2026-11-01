export type AttendanceRecord = {
  id: string;
  date: string;
  memberName: string;
  status: string;
  leaveReason: string | null;
};

export type InvalidAttendanceRow = {
  rowId: string | null;
  reasons: string[];
  rawDate: string;
  rawMemberName: string;
  rawStatus: string;
  rawLeaveReason: string;
};

export type AttendanceFilters = {
  preset: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type AttendanceGroup = {
  key: string;
  label: string;
  total: number;
  statuses: Record<string, number>;
};

export type AttendancePersonGroup = AttendanceGroup & {
  leaveReasons: string[];
};

type NocolyControl = {
  value?: unknown;
};

type NocolyRow = {
  rowid?: string;
  rowId?: string;
  id?: string;
  controls?: Record<string, NocolyControl | undefined>;
  [key: string]: unknown;
};

const FIELD_IDS = {
  status: "69ca00c359589a6272c95ca8",
  memberName: "69ca0eebef0b95ca9b93cb7e",
  date: "69ca073c4f08ac5aead0e9ea",
  leaveReason: "69e3117c6e7b69b6c50cdb30",
} as const;

function isNocolyControl(value: unknown): value is NocolyControl {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNocolyRow(value: unknown): value is NocolyRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if ("rowid" in candidate && candidate.rowid !== undefined && typeof candidate.rowid !== "string") {
    return false;
  }

  if ("id" in candidate && candidate.id !== undefined && typeof candidate.id !== "string") {
    return false;
  }

  if ("rowId" in candidate && candidate.rowId !== undefined && typeof candidate.rowId !== "string") {
    return false;
  }

  if ("controls" in candidate && candidate.controls !== undefined) {
    if (
      typeof candidate.controls !== "object" ||
      candidate.controls === null ||
      Array.isArray(candidate.controls)
    ) {
      return false;
    }

    for (const control of Object.values(candidate.controls)) {
      if (control !== undefined && !isNocolyControl(control)) {
        return false;
      }
    }
  }

  return true;
}

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function readNocolyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
          return readString(entry);
        }
        const candidate = entry as Record<string, unknown>;
        return readString(candidate.value) || readString(candidate.name);
      })
      .filter(Boolean)
      .join(", ");
  }

  return readString(value);
}

function readFieldValue(row: NocolyRow, fieldId: string): string {
  if (row.controls?.[fieldId]) {
    return readNocolyValue(row.controls[fieldId]?.value);
  }
  return readNocolyValue(row[fieldId]);
}

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function normalizeAttendanceDate(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmedValue)) {
    return normalizeAttendanceDate(trimmedValue.slice(0, 10));
  }

  const iso = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const slash = trimmedValue.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  const match = iso ?? slash;
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealCalendarDate(year, month, day)) return "";
  return `${match[1]}-${pad(month)}-${pad(day)}`;
}

function toYyyyMmDd(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

function startOfYear(value: Date): Date {
  return new Date(value.getFullYear(), 0, 1);
}

function endOfYear(value: Date): Date {
  return new Date(value.getFullYear(), 11, 31);
}

function subMonths(value: Date, months: number): Date {
  return new Date(value.getFullYear(), value.getMonth() - months, value.getDate());
}

function createStatusMap(statusKeys: string[]): Record<string, number> {
  return Object.fromEntries(statusKeys.map((statusKey) => [statusKey, 0]));
}

function isLeaveStatus(status: string): boolean {
  return /\bleave\b/i.test(status) || status.includes("假");
}

function isLeaveRecord(record: AttendanceRecord): boolean {
  return isLeaveStatus(record.status);
}

function normalizeAttendanceRecord(record: AttendanceRecord): AttendanceRecord | null {
  const date = normalizeAttendanceDate(record.date);
  if (!date) return null;
  return { ...record, date };
}

export function normalizeAttendanceFilters(filters: AttendanceFilters): AttendanceFilters {
  return {
    preset: filters.preset,
    startDate: filters.startDate ? normalizeAttendanceDate(filters.startDate) || null : null,
    endDate: filters.endDate ? normalizeAttendanceDate(filters.endDate) || null : null,
  };
}

function isRecordInRange(record: AttendanceRecord, filters: AttendanceFilters): boolean {
  if (filters.startDate && record.date < filters.startDate) return false;
  if (filters.endDate && record.date > filters.endDate) return false;
  return true;
}

function getDateRangeLabel(filters: AttendanceFilters): string {
  if (filters.startDate && filters.endDate) return `${filters.startDate} to ${filters.endDate}`;
  if (filters.startDate) return `From ${filters.startDate}`;
  if (filters.endDate) return `Through ${filters.endDate}`;
  return "All dates";
}

export function resolveDateRange(input: {
  preset: string | null;
  today?: Date;
}): { startDate: string | null; endDate: string | null } {
  const today = input.today ?? new Date();

  if (input.preset === "this-month") {
    return {
      startDate: toYyyyMmDd(startOfMonth(today)),
      endDate: toYyyyMmDd(endOfMonth(today)),
    };
  }

  if (input.preset === "last-3-months") {
    return {
      startDate: toYyyyMmDd(startOfMonth(subMonths(today, 2))),
      endDate: toYyyyMmDd(endOfMonth(today)),
    };
  }

  if (input.preset === "this-year") {
    return {
      startDate: toYyyyMmDd(startOfYear(today)),
      endDate: toYyyyMmDd(endOfYear(today)),
    };
  }

  return { startDate: null, endDate: null };
}

export function normalizeAttendanceRows(rows: readonly unknown[]): {
  records: AttendanceRecord[];
  invalidRowCount: number;
  invalidRows: InvalidAttendanceRow[];
} {
  const records: AttendanceRecord[] = [];
  const invalidRows: InvalidAttendanceRow[] = [];
  let invalidRowCount = 0;

  for (const row of rows) {
    if (!isNocolyRow(row)) {
      invalidRowCount += 1;
      invalidRows.push({
        rowId: null,
        reasons: ["Unexpected row format"],
        rawDate: "",
        rawMemberName: "",
        rawStatus: "",
        rawLeaveReason: "",
      });
      continue;
    }

    const id = readString(row.rowid ?? row.rowId ?? row.id);
    const rawDate = readFieldValue(row, FIELD_IDS.date);
    const rawMemberName = readFieldValue(row, FIELD_IDS.memberName);
    const rawStatus = readFieldValue(row, FIELD_IDS.status);
    const rawLeaveReason = readFieldValue(row, FIELD_IDS.leaveReason);
    const date = normalizeAttendanceDate(rawDate);
    const reasons: string[] = [];

    if (!date) reasons.push("Missing or invalid date");
    if (!rawMemberName) reasons.push("Missing member name");
    if (!rawStatus) reasons.push("Missing status");

    if (!id || reasons.length > 0) {
      invalidRowCount += 1;
      invalidRows.push({
        rowId: id || null,
        reasons: !id ? ["Missing row id", ...reasons] : reasons,
        rawDate,
        rawMemberName,
        rawStatus,
        rawLeaveReason,
      });
      continue;
    }

    records.push({
      id,
      date,
      memberName: rawMemberName,
      status: rawStatus,
      leaveReason: rawLeaveReason || null,
    });
  }

  return { records, invalidRowCount, invalidRows };
}

export function buildAttendanceReport(records: AttendanceRecord[], filters: AttendanceFilters): {
  filters: AttendanceFilters;
  kpis: {
    totalRecords: number;
    uniqueMembers: number;
    leaveCount: number;
    dateRangeLabel: string;
  };
  statusKeys: string[];
  byMonth: AttendanceGroup[];
  byDate: AttendanceGroup[];
  byPerson: AttendancePersonGroup[];
  records: AttendanceRecord[];
} {
  const normalizedFilters = normalizeAttendanceFilters(filters);
  const normalizedRecords = records.flatMap((record) => {
    const normalizedRecord = normalizeAttendanceRecord(record);
    return normalizedRecord ? [normalizedRecord] : [];
  });
  const filteredRecords = normalizedRecords.filter((record) => isRecordInRange(record, normalizedFilters));
  const statusKeys = Array.from(new Set(filteredRecords.map((record) => record.status))).sort((left, right) =>
    left.localeCompare(right),
  );

  const groupBy = <TGroup extends AttendanceGroup | AttendancePersonGroup>(
    makeGroup: (key: string) => TGroup,
    getKey: (record: AttendanceRecord) => string,
    updateGroup?: (group: TGroup, record: AttendanceRecord) => void,
  ): TGroup[] => {
    const groups = new Map<string, TGroup>();

    for (const record of filteredRecords) {
      const key = getKey(record);
      const group = groups.get(key) ?? makeGroup(key);
      group.total += 1;
      group.statuses[record.status] += 1;
      updateGroup?.(group, record);
      groups.set(key, group);
    }

    return Array.from(groups.values()).sort((left, right) => left.key.localeCompare(right.key));
  };

  return {
    filters: normalizedFilters,
    kpis: {
      totalRecords: filteredRecords.length,
      uniqueMembers: new Set(filteredRecords.map((record) => record.memberName)).size,
      leaveCount: filteredRecords.filter(isLeaveRecord).length,
      dateRangeLabel: getDateRangeLabel(normalizedFilters),
    },
    statusKeys,
    byMonth: groupBy(
      (key) => ({
        key,
        label: key,
        total: 0,
        statuses: createStatusMap(statusKeys),
      }),
      (record) => record.date.slice(0, 7),
    ),
    byDate: groupBy(
      (key) => ({
        key,
        label: key,
        total: 0,
        statuses: createStatusMap(statusKeys),
      }),
      (record) => record.date,
    ),
    byPerson: groupBy<AttendancePersonGroup>(
      (key): AttendancePersonGroup => ({
        key,
        label: key,
        total: 0,
        statuses: createStatusMap(statusKeys),
        leaveReasons: [],
      }),
      (record) => record.memberName,
      (group, record) => {
        if (isLeaveRecord(record) && record.leaveReason && !group.leaveReasons.includes(record.leaveReason)) {
          group.leaveReasons.push(record.leaveReason);
        }
      },
    ),
    records: filteredRecords,
  };
}
