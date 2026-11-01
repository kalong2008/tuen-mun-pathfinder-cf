import { useEffect, useMemo, useRef, useState } from "react";
import { resolveDateRange, type AttendanceGroup, type AttendancePersonGroup } from "./report";
import "./attendance.css";

type PresetKey = "this-month" | "last-3-months" | "this-year" | "custom";

type AttendanceRecord = {
  id: string;
  date: string;
  memberName: string;
  status: string;
  leaveReason: string | null;
};

type InvalidAttendanceRow = {
  rowId: string | null;
  reasons: string[];
  rawDate: string;
  rawMemberName: string;
  rawStatus: string;
  rawLeaveReason: string;
};

type AttendanceReport = {
  filters: {
    preset: string | null;
    startDate: string | null;
    endDate: string | null;
  };
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
  invalidRowCount: number;
  invalidRows: InvalidAttendanceRow[];
};

const PRESET_OPTIONS: Array<{ key: Exclude<PresetKey, "custom">; label: string }> = [
  { key: "this-month", label: "This month" },
  { key: "last-3-months", label: "Last 3 months" },
  { key: "this-year", label: "This year" },
];

const DEFAULT_STATUS_COLOR_CLASS = "bg-slate-400";
const STATUS_ORDER = [
  "出席",
  "Present",
  "遲到",
  "Late",
  "請假",
  "Sick Leave",
  "Annual Leave",
  "Absent Leave",
  "缺席",
  "Absent",
] as const;

function getPresetRange(preset: Exclude<PresetKey, "custom">) {
  return resolveDateRange({ preset });
}

function buildRequestUrl(input: {
  preset: PresetKey | null;
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();
  if (input.preset) params.set("preset", input.preset);
  if (input.startDate) params.set("startDate", input.startDate);
  if (input.endDate) params.set("endDate", input.endDate);
  const query = params.toString();
  return query ? `/api/attendance?${query}` : "/api/attendance";
}

function renderStatusCell(statuses: Record<string, number>, statusKey: string) {
  return statuses[statusKey] ?? 0;
}

function formatPercentage(count: number, total: number) {
  if (total <= 0) return "0.0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

function formatCountWithPercentage(count: number, total: number) {
  return `${count} (${formatPercentage(count, total)})`;
}

function getStatusOrder(statusKey: string) {
  const explicitIndex = STATUS_ORDER.findIndex(
    (candidate) => candidate.toLowerCase() === statusKey.toLowerCase(),
  );
  return explicitIndex === -1 ? Number.MAX_SAFE_INTEGER : explicitIndex;
}

function sortStatusKeys(statusKeys: string[]) {
  return [...statusKeys].sort((left, right) => {
    const orderDifference = getStatusOrder(left) - getStatusOrder(right);
    if (orderDifference !== 0) return orderDifference;
    return left.localeCompare(right);
  });
}

function getStatusColorClass(statusKey: string) {
  if (/present|出席/i.test(statusKey)) return "bg-emerald-500";
  if (/late|遲到/i.test(statusKey)) return "bg-amber-400";
  if (/absent|缺席/i.test(statusKey)) return "bg-rose-600";
  if (/\bleave\b/i.test(statusKey) || statusKey.includes("假")) return "bg-orange-500";
  return DEFAULT_STATUS_COLOR_CLASS;
}

function StatusChart({
  title,
  groups,
  statusKeys,
  variant = "horizontal",
}: {
  title: string;
  groups: AttendanceGroup[];
  statusKeys: string[];
  variant?: "horizontal" | "stacked-bars";
}) {
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    content: string;
    left: number;
    top: number;
  } | null>(null);

  function showTooltip(content: string, left: number, top: number) {
    setHoveredTooltip({ content, left, top });
  }

  function hideTooltip() {
    setHoveredTooltip(null);
  }

  if (variant === "stacked-bars") {
    return (
      <div
        aria-label={`${title} stacked bar chart`}
        className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        {hoveredTooltip ? (
          <div
            className="pointer-events-none absolute z-10 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{
              left: hoveredTooltip.left,
              top: hoveredTooltip.top,
              transform: "translate(-50%, -110%)",
            }}
          >
            {hoveredTooltip.content}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {statusKeys.map((statusKey) => (
            <div key={statusKey} className="flex items-center gap-2 text-xs text-slate-600">
              <span aria-hidden="true" className={`h-3 w-3 rounded-full ${getStatusColorClass(statusKey)}`} />
              <span>{statusKey}</span>
            </div>
          ))}
        </div>
        {groups.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No records found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-max items-end gap-4">
              {groups.map((group) => (
                <div key={group.key} className="w-24 shrink-0 space-y-3">
                  <div className="flex h-56 items-end justify-center">
                    <div className="flex h-full w-12 flex-col-reverse overflow-hidden rounded-t-lg bg-slate-100">
                      {statusKeys.map((statusKey) => {
                        const count = renderStatusCell(group.statuses, statusKey);
                        const height = group.total > 0 ? `${(count / group.total) * 100}%` : "0%";
                        return (
                          <div
                            key={statusKey}
                            aria-label={`${group.label} ${statusKey} segment`}
                            className={`${getStatusColorClass(statusKey)} w-full transition-[height]`}
                            style={{ height }}
                            onMouseEnter={(event) =>
                              showTooltip(
                                `${group.label} · ${statusKey}: ${count} (${formatPercentage(count, group.total)})`,
                                event.currentTarget.offsetLeft + event.currentTarget.offsetWidth / 2,
                                event.currentTarget.offsetTop,
                              )
                            }
                            onMouseMove={(event) =>
                              showTooltip(
                                `${group.label} · ${statusKey}: ${count} (${formatPercentage(count, group.total)})`,
                                event.currentTarget.offsetLeft + event.currentTarget.offsetWidth / 2,
                                event.currentTarget.offsetTop,
                              )
                            }
                            onMouseLeave={hideTooltip}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-center text-xs font-medium text-slate-900">{group.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      aria-label={`${title} chart`}
      className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {hoveredTooltip ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: hoveredTooltip.left,
            top: hoveredTooltip.top,
            transform: "translate(-50%, -110%)",
          }}
        >
          {hoveredTooltip.content}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {statusKeys.map((statusKey) => (
          <div key={statusKey} className="flex items-center gap-2 text-xs text-slate-600">
            <span aria-hidden="true" className={`h-3 w-3 rounded-full ${getStatusColorClass(statusKey)}`} />
            <span>{statusKey}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">No records found.</p>
        ) : (
          groups.map((group) => (
            <div
              key={group.key}
              aria-label={`${group.label} chart row`}
              className="grid grid-cols-[minmax(0,8rem)_1fr] items-center gap-2"
            >
              <p className="truncate text-sm font-medium text-slate-900">{group.label}</p>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-full">
                  {statusKeys.map((statusKey) => {
                    const count = renderStatusCell(group.statuses, statusKey);
                    const width = group.total > 0 ? `${(count / group.total) * 100}%` : "0%";
                    return (
                      <div
                        key={statusKey}
                        aria-label={`${group.label} ${statusKey} segment`}
                        className={`${getStatusColorClass(statusKey)} h-full transition-[width]`}
                        style={{ width }}
                        onMouseEnter={(event) =>
                          showTooltip(
                            `${group.label} · ${statusKey}: ${count} (${formatPercentage(count, group.total)})`,
                            event.currentTarget.offsetLeft + event.currentTarget.offsetWidth / 2,
                            event.currentTarget.offsetTop,
                          )
                        }
                        onMouseMove={(event) =>
                          showTooltip(
                            `${group.label} · ${statusKey}: ${count} (${formatPercentage(count, group.total)})`,
                            event.currentTarget.offsetLeft + event.currentTarget.offsetWidth / 2,
                            event.currentTarget.offsetTop,
                          )
                        }
                        onMouseLeave={hideTooltip}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GroupTable({
  groups,
  statusKeys,
  firstColumnLabel,
}: {
  groups: AttendanceGroup[];
  statusKeys: string[];
  firstColumnLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {firstColumnLabel}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </th>
            {statusKeys.map((statusKey) => (
              <th
                key={statusKey}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {statusKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {groups.length === 0 ? (
            <tr>
              <td colSpan={statusKeys.length + 2} className="px-4 py-6 text-sm text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            groups.map((group) => (
              <tr key={group.key}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{group.label}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{group.total}</td>
                {statusKeys.map((statusKey) => (
                  <td key={statusKey} className="px-4 py-3 text-sm text-slate-700">
                    {formatCountWithPercentage(renderStatusCell(group.statuses, statusKey), group.total)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PersonTable({
  groups,
  statusKeys,
}: {
  groups: AttendancePersonGroup[];
  statusKeys: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Person
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </th>
            {statusKeys.map((statusKey) => (
              <th
                key={statusKey}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {statusKey}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Leave reasons
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {groups.length === 0 ? (
            <tr>
              <td colSpan={statusKeys.length + 3} className="px-4 py-6 text-sm text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            groups.map((group) => (
              <tr key={group.key}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{group.label}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{group.total}</td>
                {statusKeys.map((statusKey) => (
                  <td key={statusKey} className="px-4 py-3 text-sm text-slate-700">
                    {formatCountWithPercentage(renderStatusCell(group.statuses, statusKey), group.total)}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-slate-700">
                  {group.leaveReasons.length > 0 ? group.leaveReasons.join(", ") : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AttendanceDashboard() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>("this-month");
  const initialRange = useMemo(() => getPresetRange("this-month"), []);
  const [startDate, setStartDate] = useState(initialRange.startDate ?? "");
  const [endDate, setEndDate] = useState(initialRange.endDate ?? "");
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvalidRows, setShowInvalidRows] = useState(false);
  const activeRequestIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  async function loadReport(input: {
    preset: PresetKey | null;
    startDate: string;
    endDate: string;
  }) {
    const requestId = activeRequestIdRef.current + 1;
    const abortController = new AbortController();
    activeRequestIdRef.current = requestId;
    activeAbortControllerRef.current?.abort();
    activeAbortControllerRef.current = abortController;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildRequestUrl(input), {
        cache: "no-store",
        signal: abortController.signal,
      });
      const payload = (await response.json()) as AttendanceReport | { error?: string };
      if (requestId !== activeRequestIdRef.current) return;

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Failed to load attendance report.",
        );
      }

      const nextReport = payload as AttendanceReport;
      setReport(nextReport);
      setShowInvalidRows(false);
      const nextPreset = nextReport.filters.preset;
      if (
        nextPreset === "this-month" ||
        nextPreset === "last-3-months" ||
        nextPreset === "this-year" ||
        nextPreset === "custom"
      ) {
        setSelectedPreset(nextPreset);
      } else {
        setSelectedPreset(null);
      }
      setStartDate(nextReport.filters.startDate ?? "");
      setEndDate(nextReport.filters.endDate ?? "");
    } catch (caughtError) {
      if (
        abortController.signal.aborted ||
        (caughtError instanceof Error && caughtError.name === "AbortError") ||
        requestId !== activeRequestIdRef.current
      ) {
        return;
      }
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load attendance report.");
      setReport(null);
    } finally {
      if (requestId === activeRequestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport({
      preset: "this-month",
      startDate: initialRange.startDate ?? "",
      endDate: initialRange.endDate ?? "",
    });
    return () => {
      activeAbortControllerRef.current?.abort();
    };
  }, [initialRange]);

  function handlePresetClick(preset: Exclude<PresetKey, "custom">) {
    const range = getPresetRange(preset);
    setSelectedPreset(preset);
    setStartDate(range.startDate ?? "");
    setEndDate(range.endDate ?? "");
  }

  function handleStartDateChange(value: string) {
    setSelectedPreset("custom");
    setStartDate(value);
  }

  function handleEndDateChange(value: string) {
    setSelectedPreset("custom");
    setEndDate(value);
  }

  function handleApplyFilters() {
    void loadReport({ preset: selectedPreset, startDate, endDate });
  }

  const kpiCards = report
    ? [
        { label: "Total records", value: report.kpis.totalRecords },
        { label: "Unique members", value: report.kpis.uniqueMembers },
        { label: "Date range", value: report.kpis.dateRangeLabel },
        { label: "Leave count", value: report.kpis.leaveCount },
      ]
    : [];
  const orderedStatusKeys = report ? sortStatusKeys(report.statusKeys) : [];

  if (loading && !report) {
    return (
      <div className="attendance mx-auto w-full max-w-7xl px-4 pb-14 pt-28">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading attendance...
        </div>
      </div>
    );
  }

  return (
    <div className="attendance mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 pb-14 pt-28">
      <header>
        <p className="text-sm font-medium text-slate-500">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Attendance dashboard</h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handlePresetClick(option.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedPreset === option.key
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => handleStartDateChange(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            End date
            <input
              type="date"
              value={endDate}
              onChange={(event) => handleEndDateChange(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply filters
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Loading attendance...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {report?.invalidRowCount ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>
              {report.invalidRowCount} attendance {report.invalidRowCount === 1 ? "row was" : "rows were"} skipped
              because they were invalid.
            </p>
            {report.invalidRows.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowInvalidRows((current) => !current)}
                className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                {showInvalidRows ? "Hide skipped-row details" : "Show skipped-row details"}
              </button>
            ) : null}
          </div>
          {showInvalidRows && report.invalidRows.length > 0 ? (
            <div className="mt-4 space-y-3">
              <h2 className="text-base font-semibold text-amber-950">Skipped row details</h2>
              <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
                <table className="min-w-full divide-y divide-amber-100">
                  <thead className="bg-amber-50">
                    <tr>
                      {["Row ID", "Why skipped", "Raw date", "Raw member", "Raw status", "Raw leave reason"].map(
                        (label) => (
                          <th
                            key={label}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-900"
                          >
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {report.invalidRows.map((row, index) => (
                      <tr key={`${row.rowId ?? "missing-row-id"}-${index}`}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.rowId ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.reasons.join(", ")}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.rawDate || "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.rawMemberName || "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.rawStatus || "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.rawLeaveReason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {report ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">By month</h2>
            <StatusChart title="By month" groups={report.byMonth} statusKeys={orderedStatusKeys} variant="stacked-bars" />
            <GroupTable groups={report.byMonth} statusKeys={orderedStatusKeys} firstColumnLabel="Month" />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">By date</h2>
            <StatusChart title="By date" groups={report.byDate} statusKeys={orderedStatusKeys} variant="stacked-bars" />
            <GroupTable groups={report.byDate} statusKeys={orderedStatusKeys} firstColumnLabel="Date" />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">By person</h2>
            <StatusChart title="By person" groups={report.byPerson} statusKeys={orderedStatusKeys} />
            <PersonTable groups={report.byPerson} statusKeys={orderedStatusKeys} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Raw records</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Date", "Member", "Status", "Leave reason"].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    report.records.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">{record.date}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.memberName}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{record.status}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{record.leaveReason ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
