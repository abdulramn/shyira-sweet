import { useState } from "react";

/*
  TAGLINE OPTIONS (chosen the strongest, alternatives kept for the owner):
  ✅ USED:  "Handmade from our home to your table — the taste of Syria."
  Alt 1:    "Old Damascus recipes, baked with love in Michigan."
  Alt 2:    "Sweets made slow, the way family always has."
*/

const NAV = [
  { label: "Menu", href: "#menu" },
  { label: "Gallery", href: "#gallery" },
  { label: "Kunafa for Events", href: "#kunafa" },
  { label: "Our Story", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/25 bg-green-deep/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center gap-3">
          {/* LOGO PLACEHOLDER — replace /images/logo.png with the owner's final logo */}
          <img
            src="/images/logo.png"
            alt="SHYIRA Sweet logo — kunafa strand double-S monogram"
            className="h-12 w-12 rounded-full border border-gold/40 object-cover shadow-sm sm:h-14 sm:w-14"
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-wide text-cream sm:text-xl">
              SHYIRA Sweet
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold-soft sm:text-xs">
              Handmade Syrian Sweets
            </p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-cream/85 transition-colors hover:text-gold-soft"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cream md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-gold/20 bg-green-deep md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col px-5 py-2">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-gold/10 py-3 text-sm font-semibold text-cream/90 last:border-0"
              >
                {n.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
