"use client";

import Image from "next/image";
import { useState } from "react";
import type { ListingImage } from "@/features/listings/types";

export function ListingGallery({
  images,
  title,
}: {
  images: ListingImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return (
      <div className="detail__image">
        <div className="listing-card__placeholder" aria-hidden="true">
          CB
        </div>
      </div>
    );
  }

  return (
    <div className="listing-gallery">
      <div className="detail__image" aria-live="polite">
        <Image
          alt={activeImage.alt_text || title}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 62vw"
          src={activeImage.image_url}
        />
        {images.length > 1 && (
          <span className="listing-gallery__count">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div aria-label="Vælg annoncebillede" className="listing-gallery__thumbs">
          {images.map((image, index) => (
            <button
              aria-label={`Vis billede ${index + 1} af ${images.length}`}
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? "is-active" : undefined}
              key={image.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt=""
                fill
                sizes="88px"
                src={image.image_url}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

