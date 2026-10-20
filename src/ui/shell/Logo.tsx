/** A diya: the small oil lamp lit at the start of every celebration. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 4c4 6 6 9.5 6 13a6 6 0 0 1-12 0c0-3.5 2-7 6-13z" fill="#e8a317" />
      <path
        d="M24 11c1.8 3 2.6 4.6 2.6 6.2a2.6 2.6 0 0 1-5.2 0c0-1.6.8-3.2 2.6-6.2z"
        fill="#f28c28"
      />
      <path d="M5 27h38c-1.5 9-9 15-19 15S6.5 36 5 27z" fill="#9e1b32" />
      <path d="M9 31h30" stroke="#e8a317" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
