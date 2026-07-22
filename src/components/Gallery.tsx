import { useEffect, useMemo, useState } from "react";
import Ornament from "./Ornament";
import ImageModal, { type Photo } from "./ImageModal";
import { supabase } from "../lib/supabase";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

/*
  الصور الأساسية الموجودة داخل:
  public/images

  هذه الصور ستظهر دائمًا في Gallery.
  وأي صور تضيفها من Admin Dashboard
  سيتم دمجها معها تلقائيًا.
*/
const FALLBACK_IMAGES: GalleryImage[] = [
  {
    src: "/images/Crafted Fresh by Hand.jpeg",
    alt: "SHYIRA Sweet handcrafted Syrian sweets",
    caption: "Crafted Fresh by Hand",
  },
  {
    src: "/images/Freshly Made Kunafa.jpeg",
    alt: "Freshly made kunafa by SHYIRA Sweet",
    caption: "Freshly Made Kunafa",
  },
  {
    src: "/images/Halawet El Jibn 2.jpeg",
    alt: "Halawet El Jibn by SHYIRA Sweet",
    caption: "Halawet El Jibn",
  },
  {
    src: "/images/Halawet El Jibn.jpeg",
    alt: "Traditional Halawet El Jibn",
    caption: "Traditional Halawet El Jibn",
  },
  {
    src: "/images/Halawet El Jibn3.jpeg",
    alt: "Fresh Halawet El Jibn",
    caption: "Fresh Halawet El Jibn",
  },
  {
    src: "/images/Premium Pistachio Baklava.png",
    alt: "Premium Pistachio Baklava by SHYIRA Sweet",
    caption: "Premium Pistachio Baklava",
  },
  {
    src: "/images/The Perfect Cheese Pull.webp",
    alt: "Fresh kunafa cheese pull",
    caption: "The Perfect Cheese Pull",
  },
  {
    src: "/images/Traditional Madlouqa2.jpeg",
    alt: "Traditional Syrian Madlouqa",
    caption: "Traditional Madlouqa",
  },
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
    نكرر الصور بما يكفي لتغطية حتى
    الشاشات الكبيرة جدًا.

    بعدها نعرض المجموعة مرتين للحصول
    على Infinite Loop بدون فراغ.
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
  /*
    نبدأ بالصور الموجودة في public/images.
  */
  const [images, setImages] =
    useState<GalleryImage[]>(FALLBACK_IMAGES);

  const [modalIndex, setModalIndex] =
    useState<number | null>(null);

  /*
    نحضر الصور التي أضفتها من Admin Dashboard
    ونضيفها إلى الصور الأساسية بدل استبدالها.
  */
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
        if (error) {
          console.error(
            "Could not load gallery images from Supabase:",
            error
          );
          return;
        }

        if (!data || data.length === 0) {
          return;
        }

        const adminImages: GalleryImage[] = data
          .filter(
            (item: any) =>
              typeof item.image_url === "string" &&
              item.image_url.trim() !== ""
          )
          .map((item: any) => ({
            src: item.image_url.trim(),
            alt:
              item.title?.trim() ||
              "SHYIRA Sweet work",
            caption: item.description
              ? `${item.title} — ${item.description}`
              : item.title || "SHYIRA Sweet",
          }));

        /*
          دمج صور GitHub مع صور Admin.

          نمنع تكرار نفس الصورة إذا كان
          رابطها موجودًا أكثر من مرة.
        */
        const combinedImages = [
          ...FALLBACK_IMAGES,
          ...adminImages,
        ];

        const uniqueImages = combinedImages.filter(
          (image, index, array) =>
            array.findIndex(
              (item) => item.src === image.src
            ) === index
        );

        setImages(uniqueImages);
      });
  }, []);

  /*
    تقسيم الصور إلى صفين.

    1 → الصف الأول
    2 → الصف الثاني
    3 → الصف الأول
    4 → الصف الثاني
    وهكذا...
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
      إذا كان هناك صورة واحدة فقط،
      نعرضها في الصفين.
    */
    if (
      second.length === 0 &&
      first.length > 0
    ) {
      second.push(...first);
    }

    return {
      row1: first,
      row2: second,
    };
  }, [images]);

  /*
    تجهيز جميع الصور للـ Image Modal.
  */
  const allGalleryPhotos: Photo[] = images.map(
    (photo) => ({
      src: photo.src,
      alt: photo.alt,
      caption: photo.caption,
    })
  );

  /*
    فتح الصورة بالحجم الكامل عند الضغط عليها.
  */
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
      {/* Gallery Heading */}
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
          Our Work
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
          A Little Taste, In Pictures
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
          A look at our recent work. Tap any photo
          to view it full-size.
        </p>

        <Ornament className="mt-6" />
      </div>

      {/* Infinite Gallery Slider */}
      <div className="mt-10 w-full space-y-4">
        {/* First Row */}
        <Row
          images={row1}
          onImageClick={(index) =>
            openGallery(index, 1)
          }
        />

        {/* Second Row — Reverse Direction */}
        <Row
          images={row2}
          reverse
          onImageClick={(index) =>
            openGallery(index, 2)
          }
        />
      </div>

      {/* Full-size Image Modal */}
      {modalIndex !== null && (
        <ImageModal
          photos={allGalleryPhotos}
          startIndex={modalIndex}
          onClose={() =>
            setModalIndex(null)
          }
        />
      )}
    </section>
  );
}
