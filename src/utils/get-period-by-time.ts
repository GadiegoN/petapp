import type { Period } from "@/types/appointment";

export type PeriodResult = Period | "outside-hours";

export function getPeriodByTime(time: string): PeriodResult {
  const [hourText, minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return "outside-hours";
  }

  if (hour >= 9 && hour <= 12) return "morning";
  if (hour >= 13 && hour <= 18) return "afternoon";
  if (hour >= 19 && hour <= 21) return "night";

  return "outside-hours";
}
