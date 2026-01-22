import { STOPS } from "./stops";

/**
 * ONLY celebrate on the date Suhu turns 21:
 * Each stop triggers when its LOCAL clock reaches:
 * 2026-01-24 00:00:00 (midnight starting Jan 24) in that stop's timezone.
 *
 * Celebrate window length:
 */
export const CELEBRATE_MS = 5 * 60 * 1000; // 5 minutes (change if you want)

// The target local date (midnight at start of this date in each TZ)
const TARGET_Y = 2026;
const TARGET_M = 1;
const TARGET_D = 24;

export type WorldState = {
  activeIndex: number;
  nextIndex: number;
  phase: "GLOBE" | "CELEBRATE";
  nextInMs: number;
  phaseTotalMs: number;
  done: boolean;
};

// ---------- helpers ----------

function getOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(at);

  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  if (tz === "GMT" || tz === "UTC") return 0;

  const m = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;

  const sign = m[1] === "-" ? -1 : 1;
  const hours = Number(m[2] ?? 0);
  const mins = Number(m[3] ?? 0);
  return sign * (hours * 60 + mins);
}

/**
 * Convert local midnight (TARGET_Y/TARGET_M/TARGET_D 00:00 in timeZone)
 * to an absolute UTC ms timestamp.
 * Uses a small refinement loop to handle DST correctly.
 */
function utcMsForLocalMidnight(timeZone: string, y: number, m: number, d: number): number {
  // start with "naive" UTC midnight then shift by tz offset
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);

  let utc = guess - getOffsetMinutes(timeZone, new Date()) * 60_000;

  // refine offset at that instant (DST-safe)
  for (let i = 0; i < 4; i++) {
    const off = getOffsetMinutes(timeZone, new Date(utc));
    const nextUtc = guess - off * 60_000;
    if (nextUtc === utc) break;
    utc = nextUtc;
  }

  return utc;
}

// ---------- main ----------

export function computeWorldState(): WorldState {
  const total = STOPS.length;
  const nowMs = Date.now();

  console.log(
  "Kiribati fires at:",
  new Date(
    utcMsForLocalMidnight(STOPS[0].tz, 2026, 1, 24)
  ).toUTCString()
);

  if (total === 0) {
    return {
      activeIndex: 0,
      nextIndex: 0,
      phase: "GLOBE",
      nextInMs: 0,
      phaseTotalMs: 1,
      done: true,
    };
  }

  // For each stop, compute its “Jan 24 midnight local” absolute instant
  const events = STOPS.map((s, idx) => {
    const startAt = utcMsForLocalMidnight(s.tz, TARGET_Y, TARGET_M, TARGET_D);
    const endAt = startAt + CELEBRATE_MS;
    return { idx, startAt, endAt };
  }).sort((a, b) => a.startAt - b.startAt);

  const firstAt = events[0].startAt;
  const lastEnd = events[events.length - 1].endAt;

  // ✅ Before the wave starts anywhere: show globe, countdown to first event
  if (nowMs < firstAt) {
    return {
      activeIndex: events[0].idx,
      nextIndex: events[0].idx,
      phase: "GLOBE",
      nextInMs: firstAt - nowMs,
      phaseTotalMs: Math.max(1, firstAt - nowMs),
      done: false,
    };
  }

  // ✅ After the entire wave is finished: DONE (spin forever)
  if (nowMs >= lastEnd) {
    const lastIdx = events[events.length - 1].idx;
    return {
      activeIndex: lastIdx,
      nextIndex: lastIdx,
      phase: "GLOBE",
      nextInMs: 0,
      phaseTotalMs: 1,
      done: true,
    };
  }

  // ✅ During the wave: find if we are inside any celebrate window
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (nowMs >= e.startAt && nowMs < e.endAt) {
      const next = events[i + 1] ?? events[i];
      return {
        activeIndex: e.idx,
        nextIndex: next.idx,
        phase: "CELEBRATE",
        nextInMs: e.endAt - nowMs,
        phaseTotalMs: CELEBRATE_MS,
        done: false,
      };
    }
  }

  // ✅ Between celebrations: globe phase until the next event
  const nextEvent = events.find((e) => e.startAt > nowMs)!;
  const prevEvent = [...events].reverse().find((e) => e.startAt <= nowMs)!;

  const untilNext = Math.max(0, nextEvent.startAt - nowMs);

  return {
    activeIndex: prevEvent.idx,
    nextIndex: nextEvent.idx,
    phase: "GLOBE",
    nextInMs: untilNext,
    phaseTotalMs: Math.max(1, untilNext),
    done: false,
  };
}
