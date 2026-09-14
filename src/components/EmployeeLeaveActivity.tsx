import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leavesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Select from './ui/Select';
import { CardHeading } from './ui/CardPrimitives';
import { CARD } from '../lib/surfaces';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import '../styles/design-system.css';

/** The status filter, with the counts shown on each tab. */
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface EmployeeLeaveActivityProps {
  employeeId: string;
  dateFilter?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

const EmployeeLeaveActivity: React.FC<EmployeeLeaveActivityProps> = ({ 
  employeeId,
  dateFilter,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // One unfiltered fetch per employee backs every status tab and year. Status
  // and year are both applied client-side in `filteredRequests` below, so
  // keying the query by them only bought a refetch and a skeleton per click -
  // and in the year's case a refetch of byte-identical data, since the request
  // never sent the year at all.
  const { data: leaveRequestsData, isLoading } = useQuery({
    queryKey: ['employee-leave-requests', employeeId],
    queryFn: () => leavesAPI.getLeaves(1, 100, undefined, employeeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false, // Disabled to prevent rate limiting
    refetchIntervalInBackground: false,
  });

  const leaveRequests = leaveRequestsData?.data?.leaves || [];

  // Maternity and paternity are recorded elsewhere; this list reports the
  // three types the allocation is made of.
  const allowedLeaveTypes = ['annual', 'sick', 'casual'];

  // Everything in the period on screen, whatever its status. The status tab
  // narrows this further, and the counts on the tabs are taken from here - so
  // selecting one tab cannot change the number another one shows.
  const periodRequests = leaveRequests.filter((leave: any) => {
    // First filter out unwanted leave types (maternity, paternity)
    const isAllowedLeaveType = allowedLeaveTypes.includes(leave.leaveType.toLowerCase());
    if (!isAllowedLeaveType) return false;

    // If date filter is provided (for reports), use custom date range
    if (dateFilter && (dateFilter.dateFrom || dateFilter.dateTo)) {
      const leaveStartDate = new Date(leave.startDate);
      const dateFromFilter = dateFilter.dateFrom ? new Date(dateFilter.dateFrom) : null;
      const dateToFilter = dateFilter.dateTo ? new Date(dateFilter.dateTo) : null;
      
      if (dateFromFilter && dateToFilter) {
        return leaveStartDate >= dateFromFilter && leaveStartDate <= dateToFilter;
      } else if (dateFromFilter) {
        return leaveStartDate >= dateFromFilter;
      } else if (dateToFilter) {
        return leaveStartDate <= dateToFilter;
      }
    }
    
    // Default behavior: filter by year
    const leaveYear = new Date(leave.startDate).getFullYear();
    return leaveYear === selectedYear;
  });

  const filteredRequests = React.useMemo(
    () =>
      selectedStatus
        ? periodRequests.filter((leave: any) => leave.status === selectedStatus)
        : periodRequests,
    [periodRequests, selectedStatus]
  );

  /** How many requests sit behind each status tab, for this period. */
  const counts = React.useMemo(() => {
    const by = (status: string) =>
      periodRequests.filter((leave: any) => leave.status === status).length;
    return {
      "": periodRequests.length,
      pending: by("pending"),
      approved: by("approved"),
      rejected: by("rejected"),
    } as Record<string, number>;
  }, [periodRequests]);

  /** Status as a quiet tint behind a saturated word. Same scale as the
   *  employee record, so a status means one thing across the product. */
  const statusChip = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
      case 'pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate year options (current year and previous 2 years)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    yearOptions.push(currentYear - i);
  }


  if (isLoading) {
    return (
      <div className={`${CARD} flex h-40 items-center justify-center`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const periodLabel =
    dateFilter && (dateFilter.dateFrom || dateFilter.dateTo)
      ? `${
          dateFilter.dateFrom
            ? formatDate(dateFilter.dateFrom)
            : 'the beginning'
        } to ${dateFilter.dateTo ? formatDate(dateFilter.dateTo) : 'today'}`
      : String(selectedYear);

  return (
    <div className={`overflow-hidden ${CARD}`}>
      {/* One card, one heading, one filter row. The counts live on the tabs
          that select them, so the five stat tiles that used to sit above this
          list are gone: a tile whose only job is to label a filter is a filter
          with extra furniture. */}
      <div className="p-6 pb-4">
        <CardHeading
          title="Leave requests"
          sub={`${filteredRequests.length} ${
            filteredRequests.length === 1 ? 'request' : 'requests'
          } in ${periodLabel}`}
          action={
            !dateFilter || (!dateFilter.dateFrom && !dateFilter.dateTo) ? (
              <Select
                value={String(selectedYear)}
                onChange={(v) => setSelectedYear(Number(v))}
                options={yearOptions.map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
                className="min-w-[110px]"
              />
            ) : undefined
          }
        />

        <div className="mt-4 flex w-fit max-w-full flex-wrap gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-700/50">
          {STATUS_TABS.map((tab) => {
            const active = selectedStatus === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 tabular-nums text-gray-400">
                  {counts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredRequests.map((leave: any) => (
            <li key={leave._id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                    {leave.leaveType} leave
                    <span className="ml-2 font-normal tabular-nums text-gray-400">
                      {leave.totalDays || 1}{' '}
                      {leave.totalDays === 1 ? 'day' : 'days'}
                    </span>
                  </p>
                  {/* The span and when it was asked for, on one line: two
                      labelled fields for two dates was four lines of chrome
                      around eight words. */}
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(leave.startDate)}
                    {leave.endDate && leave.endDate !== leave.startDate
                      ? ` - ${formatDate(leave.endDate)}`
                      : ''}
                    <span className="text-gray-400">
                      {' '}
                      · applied {formatDate(leave.createdAt || leave.startDate)}
                    </span>
                  </p>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusChip(
                    leave.status
                  )}`}
                >
                  {leave.status}
                </span>
              </div>

              {leave.reason && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {leave.reason}
                </p>
              )}

              {leave.reviewComments && (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">
                    {leave.status === 'approved'
                      ? 'Approved: '
                      : leave.status === 'rejected'
                      ? 'Rejected: '
                      : 'Reviewed: '}
                  </span>
                  {leave.reviewComments}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 pb-12 pt-4 text-center">
          <CalendarDaysIcon className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No leave requests
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedStatus
              ? `Nothing ${selectedStatus} in ${periodLabel}.`
              : `Nothing recorded in ${periodLabel}.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveActivity;