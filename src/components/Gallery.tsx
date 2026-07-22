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
  {
    src: "/images/awameh.jpg",
    alt: "SHYIRA Sweet Awameh",
    caption: "Awameh",
  },
  {
    src: "/images/barazek.jpg",
    alt: "SHYIRA Sweet Barazek",
    caption: "Barazek",
  },
  {
    src: "/images/maamoul.jpg",
    alt: "SHYIRA Sweet Maamoul",
    caption: "Maamoul",
  },
  {
    src: "/images/chef.jpg",
    alt: "SHYIRA Sweet kitchen",
    caption: "From Our Kitchen",
  },
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
  if (images.length === 0) {
    return null;
  }

  /*
    نكرر الصور عدة مرات حتى يكون السلايدر
    أعرض من أي شاشة Desktop كبيرة.

    بعد ذلك نكرر المجموعة كاملة مرتين
    حتى نحصل على Infinite Loop بدون فراغ.
  */
  const minimumCards = 16;

  const repeatCount = Math.max(
    1,
    Math.ceil(minimumCards / images.length)
  );

  const sequence: GalleryImage[] = Array.from(
    { length: repeatCount },
    () => images
  ).flat();

  const renderSequence = (copyNumber: number) => (
    <div
      className="ss-gallery-sequence"
      aria-hidden={copyNumber === 2 ? "true" : undefined}
    >
      {sequence.map((img, index) => {
        const originalIndex = index % images.length;

        return (
          <button
            type="button"
            key={`${copyNumber}-${img.src}-${index}`}
            onClick={() => onImageClick?.(originalIndex)}
            className="group relative h-36 w-52 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gold/30 bg-white/20 p-0 shadow-sm sm:h-44 sm:w-64"
            aria-label={`Open ${img.alt}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="ss-gallery-viewport">
      <div
        className={`ss-gallery-track ${
          reverse
            ? "ss-marquee-track-reverse"
            : "ss-marquee-track"
        }`}
      >
        {renderSequence(1)}
        {renderSequence(2)}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [images, setImages] =
    useState<GalleryImage[]>(FALLBACK_IMAGES);

  const [modalIndex, setModalIndex] =
    useState<number | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase
      .from("portfolio_items")
      .select(
        "title, category, description, image_url, sort_order"
      )
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const validImages = data
            .filter(
              (item: any) =>
                typeof item.image_url === "string" &&
                item.image_url.trim() !== ""
            )
            .map((item: any) => ({
              src: item.image_url,
              alt: item.title || "SHYIRA Sweet work",
              caption: item.description
                ? `${item.title} — ${item.description}`
                : item.title,
            }));

          if (validImages.length > 0) {
            setImages(validImages);
          }
        }
      });
  }, []);

  /*
    نقسم الصور بين صفين:
    الصورة الأولى للصف الأول
    الثانية للصف الثاني
    الثالثة للأول
    الرابعة للثاني...
  */
  const { row1, row2 } = useMemo(() => {
    const first: GalleryImage[] = [];
    const second: GalleryImage[] = [];

    images.forEach((img, index) => {
      if (index % 2 === 0) {
        first.push(img);
      } else {
        second.push(img);
      }
    });

    /*
      إذا كان لدينا صورة واحدة فقط،
      نجعلها تظهر في الصفين.
    */
    if (second.length === 0 && first.length > 0) {
      second.push(...first);
    }

    return {
      row1: first,
      row2: second,
    };
  }, [images]);

  const allGalleryPhotos: Photo[] = images.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
  }));

  const openGallery = (
    localIndex: number,
    row: 1 | 2
  ) => {
    const selected =
      row === 1
        ? row1[localIndex]
        : row2[localIndex];

    if (!selected) {
      return;
    }

    const globalIndex = images.findIndex(
      (img) => img.src === selected.src
    );

    setModalIndex(
      globalIndex >= 0 ? globalIndex : 0
    );
  };

  return (
    <section
      id="gallery"
      className="overflow-hidden bg-cream-deep py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
          Our Work
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
          A Little Taste, In Pictures
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
          A look at our recent work. Tap any photo to
          view it full-size.
        </p>

        <Ornament className="mt-6" />
      </div>

      <div className="mt-10 w-full space-y-4">
        <Row
          images={row1}
          onImageClick={(index) =>
            openGallery(index, 1)
          }
        />

        <Row
          images={row2}
          reverse
          onImageClick={(index) =>
            openGallery(index, 2)
          }
        />
      </div>

      {modalIndex !== null && (
        <ImageModal
          photos={allGalleryPhotos}
          startIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </section>
  );
}
