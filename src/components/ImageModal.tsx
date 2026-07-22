import { useEffect, useState } from "react";

/*
  ================= IMAGE MODAL / LIGHTBOX =================
  Full-screen photo viewer with swipe navigation.
  - Click any product or gallery image to open
  - Swipe left/right (or use arrows) to browse photos
  - Swipe up/down or press ESC to close
  - Touch-friendly for mobile (QR code users)
*/

export type Photo = {
  src: string;
  alt: string;
  caption?: string;
};

interface ImageModalProps {
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
}

export default function ImageModal({ photos, startIndex, onClose }: ImageModalProps) {
  const [index, setIndex] = useState(startIndex);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const current = photos[index];
  const total = photos.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index]);

  // Navigation
  const goNext = () => setIndex((i) => (i + 1) % total);
  const goPrev = () => setIndex((i) => (i - 1 + total) % total);

  // Touch handlers (swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    const deltaX = e.touches[0].clientX - touchStartX;

    // Vertical swipe = close gesture
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setOffsetY(deltaY * 0.6);
    } else {
      // Horizontal swipe = image change
      setOffsetX(deltaX * 0.4);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Close if swiped up or down enough
    if (Math.abs(offsetY) > 120) {
      onClose();
    }
    // Swipe right = next
    else if (offsetX < -80) {
      goNext();
    }
    // Swipe left = previous
    else if (offsetX > 80) {
      goPrev();
    }

    // Reset offsets
    setOffsetY(0);
    setOffsetX(0);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Image counter */}
      <div className="absolute top-5 left-5 rounded-full bg-white/10 px-4 py-1 text-sm text-white backdrop-blur">
        {index + 1} / {total}
      </div>

      {/* Main image container with swipe */}
      <div
        className="relative flex h-full w-full max-w-6xl select-none flex-col items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative flex max-h-[82vh] w-full items-center justify-center overflow-hidden rounded-2xl transition-transform duration-200"
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px)`,
            opacity: Math.max(0.4, 1 - Math.abs(offsetY) / 400),
          }}
        >
          <img
            src={current.src}
            alt={current.alt}
            className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>

        {/* Caption */}
        {current.caption && (
          <p className="mt-4 max-w-lg text-center text-sm text-white/80">
            {current.caption}
          </p>
        )}

        {/* Navigation arrows (desktop) */}
        {total > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 hidden h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:flex"
              aria-label="Previous photo"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 hidden h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:flex"
              aria-label="Next photo"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Bottom hint for mobile */}
      <div className="absolute bottom-6 text-center text-xs text-white/50">
        اسحب يمينًا أو يسارًا للتنقل • اسحب لأعلى للإغلاق
      </div>
    </div>
  );
}
