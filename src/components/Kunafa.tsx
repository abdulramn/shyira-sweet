import Ornament from "./Ornament";

const WHATSAPP_LINK = "17346293442";

export default function Kunafa() {
  return (
    <section
      id="kunafa"
      className="relative overflow-hidden bg-green-deep py-14 text-cream sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 ss-pattern" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-5 md:grid-cols-2">
        {/* High-quality kunafa photo */}
        <div className="ss-reveal order-2 aspect-[4/3] overflow-hidden rounded-2xl border border-gold/40 shadow-xl md:order-1">
          <img
            src="https://images.pexels.com/photos/36691304/pexels-photo-36691304.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Large tray of fresh kunafa, golden crispy top with crushed pistachios and mint garnish"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
          />
        </div>

        <div className="order-1 md:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">
            Weddings & Events
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-cream sm:text-4xl">
            Fresh Kunafa for Your Celebration
          </h2>
          <p className="mt-4 text-base leading-relaxed text-cream/85">
            Kunafa is meant to be eaten warm, the moment it comes off the heat —
            golden and crisp on top, molten and stretchy underneath. That's why
            we make it{" "}
            <span className="text-gold-soft">fresh on-site or same-day</span>{" "}
            for your wedding, engagement, or special gathering. No sitting in a
            box, no reheating — just the real thing, at its peak.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-cream/85">
            {[
              "Cheese kunafa (kunafa nabulsiyeh) & cream kunafa available",
              "Sized for parties from 20 to 300+ guests",
              "Crowned with crushed pistachios & rose or orange-blossom syrup",
              "Served warm with our own serving setup on request",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 text-gold">◆</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <a
              href="#contact"
              className="inline-block rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-green-deep shadow-md transition-transform hover:-translate-y-0.5"
            >
              Inquire About Your Date
            </a>
            <p className="mt-3 text-xs text-cream/70">
              Event availability can fill quickly during wedding season — reach out early
              to reserve your date.
            </p>
          </div>

          {/* Quick contact buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_LINK}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold-soft transition-colors hover:bg-white/10"
            >
              💬 WhatsApp
            </a>
            <a
              href="https://www.instagram.com/shyira.sweet/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold-soft transition-colors hover:bg-white/10"
            >
              📷 Instagram
            </a>
          </div>
        </div>
      </div>

      <Ornament className="relative mt-12" />
    </section>
  );
}
