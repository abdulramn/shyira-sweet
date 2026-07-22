import Ornament from "./Ornament";

export default function About() {
  return (
    <section id="about" className="bg-cream-deep py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
          Our Story
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
          A Family Kitchen, Not a Factory
        </h2>
        <Ornament className="mt-6" />

        <div className="mt-10 grid items-center gap-8 md:grid-cols-[minmax(0,300px)_1fr]">
          {/* Owner portrait — high-quality painted illustration in the brand's style */}
          <div className="ss-reveal mx-auto w-56 shrink-0 sm:w-72 md:w-full">
            <div className="overflow-hidden rounded-[2rem] border-4 border-gold/50 shadow-2xl">
              <img
                src="/images/owner.jpg"
                alt="Mohamad Alshalabi — SHYIRA Sweet owner, wearing a white chef hat and jacket in the bakery kitchen"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <p className="mt-3 text-center font-display text-sm italic text-brown-soft">
              "Every tray leaves our kitchen the way I'd serve it to my own family."
            </p>
          </div>

          <div className="space-y-5 text-left text-base leading-relaxed text-brown">
            <div className="inline-block rounded-full border border-green-deep/30 px-4 py-1 text-xs font-semibold tracking-wider text-green-deep">
              MOHAMAD ALSHALABI
            </div>
            <p className="text-lg leading-relaxed">
              I started my journey in the world of desserts at the age of 11,
              crafting sweets right from my kitchen. My goal has always been to
              share delicious treats with people everywhere.
            </p>
            <p>
              I pour my heart and passion into every dessert I make. These are
              the recipes I grew up with — made with care, tradition, and the
              same love that filled our home in Syria.
            </p>
            <p className="font-semibold text-green-deep">
              Thank you for letting our family be part of your sweetest
              moments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
