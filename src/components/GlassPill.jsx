// Small glass eyebrow with a four-point sparkle, used to open a section.
export default function GlassPill({ children, className = "" }) {
  return (
    <span className={`glass-pill ${className}`}>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z"
          fill="currentColor"
        />
        <path d="M19 15.5c.25 1.9 1.1 2.75 3 3-1.9.25-2.75 1.1-3 3-.25-1.9-1.1-2.75-3-3 1.9-.25 2.75-1.1 3-3Z" fill="currentColor" opacity="0.6" />
      </svg>
      {children}
    </span>
  );
}
