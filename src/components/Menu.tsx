import { useEffect, useMemo, useState } from "react";
import Ornament from "./Ornament";
import ImageModal, { type Photo } from "./ImageModal";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string;
  alt_text: string;
  tag: string | null;
  active: boolean;
  sort_order: number;
};

const FALLBACK_ITEMS: Product[] = [
  {
    id: "fallback-kunafa",
    name: "Kunafa Cheese",
    description:
      "Freshly baked cheese kunafa — golden, crispy, and stretchy. Prepared for the perfect cheese pull, crowned with crushed pistachios.",
    price: "$50 / $25",
    unit: "Large / Small",
    image_url:
      "https://images.pexels.com/photos/36691305/pexels-photo-36691305.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt_text:
      "Traditional kunafa dessert garnished with crushed pistachios and mint on a decorative plate",
    tag: "Signature",
    active: true,
    sort_order: 10,
  },
  {
    id: "fallback-halawa",
    name: "Halawa Al-Jubn",
    description:
      "Traditional cheese halawa — soft, sweet, and delicately layered with cheese and ashta cream. A Syrian classic.",
    price: "$60 / $30",
    unit: "Large / Small",
    image_url:
      "https://images.pexels.com/photos/16557600/pexels-photo-16557600.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt_text: "Halawa al-jubn cheese dessert with pistachio topping",
    tag: null,
    active: true,
    sort_order: 20,
  },
  {
    id: "fallback-madlouqa",
    name: "Madlouqa",
    description:
      "Crispy layered pastry soaked in fragrant syrup, filled with ashta cream and topped with pistachios. Light, flaky, and deeply satisfying.",
    price: "$40 / $80",
    unit: "Small / Large",
    image_url:
      "https://images.pexels.com/photos/20183050/pexels-photo-20183050.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt_text: "Madlouqa layered pastry dessert, golden with crushed nuts",
    tag: null,
    active: true,
    sort_order: 30,
  },
  {
    id: "fallback-baklava",
    name: "Baklava",
    description:
      "Classic Syrian baklava with layers of paper-thin phyllo, clarified butter, and Aleppo pistachios. Finished with aromatic syrup.",
    price: "$40 / $20",
    unit: "Large / Small",
    image_url:
      "https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt_text: "Traditional baklava sprinkled with crushed pistachios",
    tag: "Best seller",
    active: true,
    sort_order: 40,
  },
];

export default function Menu() {
  const [items, setItems] = useState<Product[]>(FALLBACK_ITEMS);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase
      .from("products")
      .select("id,name,description,price,unit,image_url,alt_text,tag,active,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data && data.length > 0) setItems(data as Product[]);
      });

    return () => {
      active = false;
    };
  }, []);

  const allPhotos: Photo[] = useMemo(
    () =>
      items.map((item) => ({
        src: item.image_url,
        alt: item.alt_text || item.name,
        caption: `${item.name} — ${item.price}`,
      })),
    [items]
  );

  return (
    <section id="menu" className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">Our Catalog</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">The Sweets Table</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
            Everything is prepared fresh by hand. Browse our signature sweets, then contact us to ask about availability, events, or custom requests.
          </p>
          <Ornament className="mt-6" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((item, i) => (
            <article
              key={item.id}
              style={{ animationDelay: `${i * 90}ms` }}
              className="ss-reveal group overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.alt_text || item.name}
                  loading="lazy"
                  onClick={() => setModalIndex(i)}
                  className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-110 active:scale-[1.03]"
                />
                {item.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-maroon px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream shadow">
                    {item.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-green-deep">{item.name}</h3>
                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-maroon">{item.price}</span>
                    <p className="text-[10px] uppercase tracking-wide text-brown-soft">{item.unit}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brown-soft">{item.description}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs italic text-brown-soft">
          Questions about quantities, events, or dietary requests are always welcome. Tap any photo to enlarge.
        </p>
      </div>

      {modalIndex !== null && (
        <ImageModal photos={allPhotos} startIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </section>
  );
}
