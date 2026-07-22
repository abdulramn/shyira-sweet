import { useState } from "react";
import Ornament from "./Ornament";
import ImageModal, { type Photo } from "./ImageModal";

/*
  ================= MENU / CATALOG =================
  All prices and products for SHYIRA Sweet.
  High-quality real images from Pexels (production-ready).
*/

type Item = {
  name: string;
  desc: string;
  price: string;
  unit: string;
  image: string;
  alt: string;
  tag?: string;
};

const ITEMS: Item[] = [
  {
    name: "Kunafa Cheese",
    desc: "Freshly baked cheese kunafa — golden, crispy, and stretchy. Made to order for the perfect cheese pull, crowned with crushed pistachios.",
    price: "$50 / $25",
    unit: "Large / Small",
    image:
      "https://images.pexels.com/photos/36691305/pexels-photo-36691305.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Traditional kunafa dessert garnished with crushed pistachios and mint on a decorative plate",
    tag: "Signature",
  },
  {
    name: "Halawa Al-Jubn",
    desc: "Traditional cheese halawa — soft, sweet, and delicately layered with cheese and ashta cream. A Syrian classic.",
    price: "$60 / $30",
    unit: "Large / Small",
    image:
      "https://images.pexels.com/photos/16557600/pexels-photo-16557600.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Halawa al-jubn cheese dessert with pistachio topping",
  },
  {
    name: "Madlouqa",
    desc: "Crispy layered pastry soaked in fragrant syrup, filled with ashta cream and topped with pistachios. Light, flaky, and deeply satisfying.",
    price: "$40 / $80",
    unit: "Small / Large",
    image:
      "https://images.pexels.com/photos/20183050/pexels-photo-20183050.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Madlouqa layered pastry dessert, golden with crushed nuts",
  },
  {
    name: "Baklava",
    desc: "Classic Syrian baklava with layers of paper-thin phyllo, clarified butter, and Aleppo pistachios. Finished with aromatic syrup.",
    price: "$40 / $20",
    unit: "Large / Small",
    image:
      "https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Traditional baklava sprinkled with crushed pistachios",
    tag: "Best seller",
  },
];

function PhotoSlot({
  image,
  alt,
  onClick,
}: {
  image: string;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <img
      src={image}
      alt={alt}
      loading="lazy"
      onClick={onClick}
      className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-110 active:scale-[1.03]"
    />
  );
}

export default function Menu() {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const allPhotos: Photo[] = ITEMS.map((item) => ({
    src: item.image,
    alt: item.alt,
    caption: `${item.name} — ${item.price}`,
  }));

  return (
    <section id="menu" className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
            Our Catalog
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
            The Sweets Table
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
            Everything is baked fresh to order. Please place orders at least 48
            hours ahead so we can make yours the way it should be — by hand.
          </p>
          <Ornament className="mt-6" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {ITEMS.map((item, i) => (
            <article
              key={item.name}
              style={{ animationDelay: `${i * 90}ms` }}
              className="ss-reveal group overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <PhotoSlot
                  image={item.image}
                  alt={item.alt}
                  onClick={() => setModalIndex(i)}
                />
                {item.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-maroon px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream shadow">
                    {item.tag}
                  </span>
                )}
                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-green-deep opacity-0 shadow transition-opacity group-hover:opacity-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-green-deep">
                    {item.name}
                  </h3>
                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-maroon">
                      {item.price}
                    </span>
                    <p className="text-[10px] uppercase tracking-wide text-brown-soft">
                      {item.unit}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brown-soft">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs italic text-brown-soft">
          Custom quantities and dietary requests are always welcome. Tap any photo to enlarge.
        </p>
      </div>

      {modalIndex !== null && (
        <ImageModal
          photos={allPhotos}
          startIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </section>
  );
}
