import { useEffect, useState } from "react";
import { relativeTime } from "../lib/surfaces";

/**
 * A "2m ago" label that keeps up with the clock.
 *
 * `relativeTime()` is a pure function of the moment it is called, so a
 * component that renders it once prints "just now" and then keeps printing it
 * for the rest of the session - which is worse than printing nothing, because
 * a freshness stamp that never moves is one that lies. This re-renders the
 * caller on a minute tick, which is the resolution the label itself has.
 *
 * The timer only runs while there is a timestamp to describe, and stops when
 * the component unmounts.
 */
export function useTimeAgo(iso: string | null | undefined): string {
  const [label, setLabel] = useState(() => (iso ? relativeTime(iso) : ""));

  useEffect(() => {
    if (!iso) {
      setLabel("");
      return;
    }

    setLabel(relativeTime(iso));
    const id = window.setInterval(() => setLabel(relativeTime(iso)), 60_000);
    return () => window.clearInterval(id);
  }, [iso]);

  return label;
}

export default useTimeAgo;
