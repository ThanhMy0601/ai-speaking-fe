interface Props {
  size?: number;
  className?: string;
  label?: string;
}

/** Indeterminate progress. The app previously used the literal text "Loading...". */
export default function Spinner({ size = 18, className, label }: Props) {
  return (
    <span
      className={className}
      role="status"
      aria-label={label ?? "Loading"}
      style={{ display: "inline-flex" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin 720ms linear infinite" }}
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </span>
  );
}
