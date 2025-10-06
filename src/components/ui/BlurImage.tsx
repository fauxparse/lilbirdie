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
  }, [src]);

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
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          // Fallback to showing without blurhash if image fails to load
          setImageLoaded(true);
        }}
      />
    </div>
  );
}
