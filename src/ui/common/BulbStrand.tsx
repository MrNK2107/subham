import styles from "./BulbStrand.module.css";

const COLORS = ["amber", "rani", "leaf", "warm"] as const;

interface Props {
  /** How many are done (lit). */
  value: number;
  /** Out of how many. */
  max: number;
  /** Accessible name, e.g. "Tasks done". */
  label: string;
  /** Spoken value, e.g. "3 of 12". */
  valueText: string;
  /** Upper bound on bulbs drawn; larger totals are scaled. */
  bulbs?: number;
  /** Past the limit (e.g. overspent): every bulb turns rani pink and pulses. */
  over?: boolean;
}

/**
 * Subham's progress indicator: a strand of serial lights where each bulb that comes on is
 * progress. Exposed to assistive tech as a meter with its value in words.
 */
export function BulbStrand({ value, max, label, valueText, bulbs = 12, over = false }: Props) {
  const count = Math.max(1, Math.min(bulbs, max || 1));
  const lit = max > 0 ? Math.round((Math.min(value, max) / max) * count) : 0;
  return (
    <div
      className={`${styles.strand} ${over ? styles.over : ""}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
    >
      <span className={styles.wire} aria-hidden="true" />
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`${styles.bulb} ${i < lit ? styles.on : ""} ${styles[COLORS[i % COLORS.length]!]}`}
        />
      ))}
    </div>
  );
}
