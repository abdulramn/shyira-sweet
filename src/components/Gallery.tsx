import { useEffect, useMemo, useState } from "react";
import Ornament from "./Ornament";
import ImageModal, { type Photo } from "./ImageModal";
import { supabase } from "../lib/supabase";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

const FALLBACK_IMAGES: GalleryImage[] = [
  { src: "/images/awameh.jpg", alt: "SHYIRA Sweet Awameh", caption: "Awameh" },
  { src: "/images/barazek.jpg", alt: "SHYIRA Sweet Barazek", caption: "Barazek" },
  { src: "/images/maamoul.jpg", alt: "SHYIRA Sweet Maamoul", caption: "Maamoul" },
  { src: "/images/chef.jpg", alt: "SHYIRA Sweet kitchen", caption: "From Our Kitchen" },
];

function Row({
  images,
  reverse = false,
  onImageClick,
}: {
  images: GalleryImage[];
  reverse?: boolean;
  onImageClick?: (idx: number) => void;
}) {
  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <div className={`flex w-max gap-4 ${reverse ? "ss-marquee-track-reverse" : "ss-marquee-track"}`}>
        {doubled.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            onClick={() => onImageClick?.(i % images.length)}
            className="group relative h-36 w-52 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gold/30 shadow-sm sm:h-44 sm:w-64"
          >
            <img src={img.src} alt={img.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>(FALLBACK_IMAGES);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("portfolio_items")
      .select("title, category, description, image_url, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setImages(
            data.map((item: any) => ({
              src: item.image_url,
              alt: item.title,
              caption: item.description ? `${item.title} — ${item.description}` : item.title,
            }))
          );
        }
      });
  }, []);

  const { row1, row2 } = useMemo(() => {
    const first: GalleryImage[] = [];
    const second: GalleryImage[] = [];
    images.forEach((img, index) => (index % 2 === 0 ? first : second).push(img));
    if (second.length === 0) second.push(...first);
    return { row1: first, row2: second };
  }, [images]);

  const allGalleryPhotos: Photo[] = images.map((p) => ({ src: p.src, alt: p.alt, caption: p.caption }));

  const openGallery = (localIndex: number, row: 1 | 2) => {
    const selected = row === 1 ? row1[localIndex] : row2[localIndex];
    const globalIndex = images.findIndex((img) => img.src === selected.src);
    setModalIndex(globalIndex >= 0 ? globalIndex : 0);
  };

  return (
    <section id="gallery" className="bg-cream-deep py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">Our Work</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">A Little Taste, In Pictures</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
          A look at our recent work. Tap any photo to view it full-size.
        </p>
        <Ornament className="mt-6" />
      </div>

      <div className="mt-10 space-y-4">
        <Row images={row1} onImageClick={(i) => openGallery(i, 1)} />
        <Row images={row2} reverse onImageClick={(i) => openGallery(i, 2)} />
      </div>

      {modalIndex !== null && (
        <ImageModal photos={allGalleryPhotos} startIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </section>
  );
}
