// Ornamental divider — a small arabesque-inspired flourish used between sections
export default function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold sm:w-20" />
      <svg
        width="46"
        height="24"
        viewBox="0 0 46 24"
        fill="none"
        className="text-gold"
      >
        <path
          d="M23 2c3 5 8 5 11 8-4 3-8 3-11 8-3-5-7-5-11-8 3-3 8-3 11-8Z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
        />
        <circle cx="23" cy="10" r="2" fill="currentColor" />
        <path d="M2 10h4M40 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold sm:w-20" />
    </div>
  );
}
