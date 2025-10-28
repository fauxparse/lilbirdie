"use client";

import { useEffect, useState } from "react";
import { Blurhash } from "react-blurhash";
import { cn } from "@/lib/utils";

interface BlurImageProps {
  src: string;
  blurhash?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function BlurImage({ src, blurhash, alt, className, width, height }: BlurImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setImageLoaded(false);

    // Check if image is already loaded (for SSR cases)
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = src;

    // If the image is already cached and loaded
    if (img.complete) {
      setImageLoaded(true);
    }

    // Fallback: check after a short delay in case the image loads very quickly
    const timeout = setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        setImageLoaded(true);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [src]);

  // Handle image load events
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {blurhash && !imageLoaded && (
        <Blurhash
          hash={blurhash}
          width="100%"
          height="100%"
          resolutionX={32}
          resolutionY={32}
          punch={1}
          className="absolute inset-0"
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          "block w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
}
