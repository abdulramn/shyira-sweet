import Ornament from "./Ornament";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-green-deep text-cream"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-deep/70 via-green-deep/85 to-green-deep" />
      </div>

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-maroon/25 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-5 py-14 text-center sm:py-20">
        <img
          src="/images/logo.png"
          alt="SHYIRA Sweet logo — kunafa strand double-S monogram"
          className="ss-reveal mx-auto mb-6 h-28 w-28 rounded-full border-2 border-gold/40 object-cover shadow-lg transition-transform duration-500 hover:rotate-6 sm:h-36 sm:w-36"
        />

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-gold-soft">
          Made in Michigan
        </p>

        <h1 className="font-display text-3xl font-bold leading-tight text-cream sm:text-5xl">
          Authentic Syrian Sweets,
          <br className="hidden sm:block" /> Made With Love
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
          Traditional Syrian sweets — kunafa, baklava, halawa al-jubn, and
          madlouqa — baked in small batches with the same recipes our family
          has carried for generations. No factory, no shortcuts. Just butter,
          honey, pistachios, and a lot of patience.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#menu"
            className="w-full rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-green-deep shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
          >
            View the Menu
          </a>
          <a
            href="#kunafa"
            className="w-full rounded-full border border-gold/60 px-8 py-3 text-sm font-bold uppercase tracking-wide text-gold-soft transition-colors hover:bg-gold/10 sm:w-auto"
          >
            Kunafa for Events
          </a>
        </div>

        <Ornament className="mt-12 opacity-90" />
      </div>
    </section>
  );
}
