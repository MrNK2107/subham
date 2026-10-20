/** Subham's mark: a short strand of three serial lights on a hanging wire. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M3 10c7 12 35 12 42 0"
        fill="none"
        stroke="#3d4686"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="10.5" y="15" width="4" height="4" rx="1" fill="#4a5293" />
      <rect x="22" y="18.2" width="4" height="4" rx="1" fill="#4a5293" />
      <rect x="33.5" y="15" width="4" height="4" rx="1" fill="#4a5293" />
      <ellipse cx="12.5" cy="26" rx="5" ry="7" fill="#ffb703" />
      <ellipse cx="24" cy="29.2" rx="5" ry="7" fill="#ff4f8b" />
      <ellipse cx="35.5" cy="26" rx="5" ry="7" fill="#2ee59d" />
    </svg>
  );
}
