import { useState } from "react";
import Ornament from "./Ornament";
import ImageModal, { type Photo } from "./ImageModal";

/*
  ================= GALLERY =================
  Moving strip of high-quality real photos from Pexels.
*/

const ROW_1 = [
  {
    src: "https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Baklava with pistachios",
  },
  {
    src: "https://images.pexels.com/photos/36691305/pexels-photo-36691305.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Kunafa with pistachios and mint",
  },
  {
    src: "https://images.pexels.com/photos/20183050/pexels-photo-20183050.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Round baklava tray with layers",
  },
  {
    src: "https://images.pexels.com/photos/16557600/pexels-photo-16557600.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Turkish kunefe with pistachios",
  },
  {
    src: "https://images.pexels.com/photos/20183038/pexels-photo-20183038.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Baklava slices with glaze",
  },
  {
    src: "https://images.pexels.com/photos/33066205/pexels-photo-33066205.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Golden baklava on a plate",
  },
];

const ROW_2 = [
  {
    src: "https://images.pexels.com/photos/36691304/pexels-photo-36691304.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Kunafa dessert close-up",
  },
  {
    src: "https://images.pexels.com/photos/37740840/pexels-photo-37740840.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Kunafa with fine pistachio topping",
  },
  {
    src: "https://images.pexels.com/photos/20183032/pexels-photo-20183032.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Rectangular baklava pieces",
  },
  {
    src: "https://images.pexels.com/photos/27088089/pexels-photo-27088089.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Assorted Middle Eastern pastries tray",
  },
  {
    src: "https://images.pexels.com/photos/18543484/pexels-photo-18543484.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Baklava with walnuts and pistachios",
  },
  {
    src: "https://images.pexels.com/photos/20183040/pexels-photo-20183040.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Turkish baklava slice close-up",
  },
];

function Row({
  images,
  reverse = false,
  onImageClick,
}: {
  images: { src: string; alt: string }[];
  reverse?: boolean;
  onImageClick?: (idx: number) => void;
}) {
  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-4 ${
          reverse ? "ss-marquee-track-reverse" : "ss-marquee-track"
        }`}
      >
        {doubled.map((img, i) => (
          <div
            key={`${img.alt}-${i}`}
            onClick={() => onImageClick && onImageClick(i % images.length)}
            className="group relative h-36 w-52 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gold/30 shadow-sm sm:h-44 sm:w-64"
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const allGalleryPhotos: Photo[] = [...ROW_1, ...ROW_2].map((p) => ({
    src: p.src,
    alt: p.alt,
  }));

  const openGallery = (localIndex: number, row: 1 | 2) => {
    const offset = row === 1 ? 0 : ROW_1.length;
    setModalIndex(localIndex + offset);
  };

  return (
    <section id="gallery" className="bg-cream-deep py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
          From Our Kitchen
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
          A Little Taste, In Pictures
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft sm:text-base">
          A peek at what's coming out of the oven. Tap any photo to view full-size.
        </p>
        <Ornament className="mt-6" />
      </div>

      <div className="mt-10 space-y-4">
        <Row images={ROW_1} onImageClick={(i) => openGallery(i, 1)} />
        <Row images={ROW_2} reverse onImageClick={(i) => openGallery(i, 2)} />
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
