import React from "react";

/* ----------------------------------------------------------------------------
 * Base primitive. `.skeleton` provides the shimmer sweep (see index.css).
 * Size / radius come from utility classes passed via `className`.
 * -------------------------------------------------------------------------- */
export const Skeleton: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className = "", style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 ${className}`}
  >
    {children}
  </div>
);

/* ------------------------------ Page header ------------------------------ */
export const HeaderSkeleton: React.FC = () => (
  <div className="flex items-center justify-between">
    <div className="space-y-2.5">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72" />
    </div>
    <Skeleton className="h-10 w-32 rounded-xl" />
  </div>
);

/* ------------------------------ Generic card ----------------------------- */
export const CardSkeleton: React.FC = () => (
  <Card className="p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="mt-5 space-y-2.5">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  </Card>
);

/* --------------------------- KPI / stat cards ---------------------------- */
export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </Card>
    ))}
  </div>
);

/* -------------------------------- Table ---------------------------------- */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 5,
}) => (
  <Card className="overflow-hidden">
    {/* header row */}
    <div
      className="grid gap-4 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/60 px-6 py-3.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 w-20" />
      ))}
    </div>
    {/* body rows */}
    <div className="divide-y divide-gray-100 dark:divide-gray-700/50 stagger-children">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 px-6 py-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex items-center gap-3">
              {c === 0 && <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />}
              <Skeleton className={`h-3.5 ${c === 0 ? "w-24" : "w-16"}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </Card>
);

/* ----------------------------- Card grid --------------------------------- */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/* --------------------------- Notifications list -------------------------- */
export const NotificationsSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <Card className="overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50 stagger-children">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-start gap-4 px-5 py-4">
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
    ))}
  </Card>
);

/* -------------------------------- Chart ---------------------------------- */
export const ChartSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`flex h-full items-end gap-2 ${className}`}>
    {[55, 80, 40, 95, 65, 75, 50, 88, 60, 70, 45, 82].map((h, i) => (
      <Skeleton
        key={i}
        className="flex-1 rounded-t-md"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

/* ------------------------------- Calendar -------------------------------- */
export const CalendarSkeleton: React.FC = () => (
  <div className="space-y-6">
    <HeaderSkeleton />
    <div className="flex gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-16" />
      ))}
    </div>
    <Card className="overflow-hidden">
      {/* weekday row */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/60">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-2 py-3">
            <Skeleton className="mx-auto h-3 w-8" />
          </div>
        ))}
      </div>
      {/* day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[6.5rem] border-b border-r border-gray-100 dark:border-gray-700/50 p-2"
          >
            <Skeleton className="h-6 w-6 rounded-full" />
            {i % 4 === 0 && <Skeleton className="mt-2 h-4 w-4/5 rounded" />}
            {i % 5 === 0 && <Skeleton className="mt-1 h-4 w-3/5 rounded" />}
          </div>
        ))}
      </div>
    </Card>
  </div>
);

/* ---------------------------- Employee profile --------------------------- */
export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* hero */}
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <Skeleton className="mx-auto h-6 w-48 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
          <div className="flex justify-center gap-2 sm:justify-start">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
    {/* detail + balances */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </Card>
      <Card className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </Card>
    </div>
  </div>
);

/* -------------------------------- Form ----------------------------------- */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <Card className="max-w-2xl p-6 sm:p-8">
    <div className="space-y-5 stagger-children">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  </Card>
);

/* ------------------------------- Reports --------------------------------- */
export const ReportSkeleton: React.FC = () => (
  <div className="space-y-6">
    <HeaderSkeleton />
    <StatCardsSkeleton count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 h-52">
            <ChartSkeleton />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

/* ---------------------- Dashboard (most premium) ------------------------- */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 fade-in">
    {/* hero */}
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="hidden h-14 w-14 rounded-2xl sm:block" />
      </div>
    </Card>

    {/* KPI cards */}
    <StatCardsSkeleton count={3} />

    {/* main grid: chart + right column */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* chart / activity timeline */}
      <div className="space-y-6 lg:col-span-2">
        <Card className="p-6">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 h-56">
            <ChartSkeleton />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-4 w-36" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* right column: holidays + availability */}
      <div className="space-y-6">
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);
