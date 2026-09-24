/**
 * The shape of a request row.
 *
 * Leave and work-from-home are two queues of the same thing - a person, a span
 * of dates, a sentence of reasoning and a decision - and they are reviewed by
 * the same people on the same day. These three functions are what makes the two
 * lists print that shape identically instead of nearly identically.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Sep 23, 2026". */
export const formatRequestDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * "Sep 17 to Sep 18, 2026" - one line, with the year printed once.
 *
 * Two fully spelled dates stacked on "From"/"To" lines cost the widest column
 * in a list for what is a single span. The year only repeats when the request
 * actually crosses into another one, and a single-day request drops the range.
 */
export const formatRequestRange = (start?: string, end?: string) => {
  const a = start ? new Date(start) : null;
  const b = end ? new Date(end) : null;
  if (!a || Number.isNaN(a.getTime())) return "-";
  if (!b || Number.isNaN(b.getTime())) return formatRequestDate(start);

  const sameDay =
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay) return formatRequestDate(start);

  const head =
    a.getFullYear() === b.getFullYear()
      ? `${MONTHS[a.getMonth()]} ${a.getDate()}`
      : formatRequestDate(start);
  return `${head} to ${formatRequestDate(end)}`;
};

/* A row shows the opening words of a reason, never the reason itself. A cell
   wide enough for a sentence sets the width of the whole table, and a two-line
   clamp makes every row as tall as its wordiest neighbour. Two words name the
   request; the dialog behind the row carries the rest. */
const REASON_WORDS = 2;

export const previewReason = (
  reason?: string,
  fallback = "No reason given"
) => {
  const words = (reason || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  return words.length > REASON_WORDS
    ? `${words.slice(0, REASON_WORDS).join(" ")} ...`
    : words.join(" ");
};
