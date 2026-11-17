import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE = '/images/listings/fallback.jpg';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-contain',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  loading = 'lazy',
}) => {
  const trimmedSrc = (src || '').trim();
  const [currentSrc, setCurrentSrc] = useState<string>(trimmedSrc || fallbackSrc);
  const [failedCompletely, setFailedCompletely] = useState(false);

  useEffect(() => {
    const next = (src || '').trim();
    setCurrentSrc(next || fallbackSrc);
    setFailedCompletely(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setFailedCompletely(true);
    }
  };

  if (failedCompletely) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none ${className}`}
      >
        <ImageIcon className="w-7 h-7 opacity-70" />
        <span className="text-[10px] font-medium mt-1 px-2 text-center line-clamp-1">
          Photo unavailable
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={className}
    />
  );
};
