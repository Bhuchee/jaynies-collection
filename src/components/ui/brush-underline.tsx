/*
  DESIGN.md section 5. A yellow swash under the second half of a section title.
  It inherits its colour, so the caller sets text-highlight.
*/
export function BrushUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M4 8.5C42 3.2 98 1.4 196 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}