import React, { useState, useEffect } from 'react';
import { extractDriveFileId } from '../utils/googleDrive';

interface DriveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export const DriveImage: React.FC<DriveImageProps> = ({
  src,
  alt,
  fallbackSrc = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
    const driveId = extractDriveFileId(src);

    if (driveId) {
      // Primary direct URL attempt
      setCurrentSrc(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
    } else {
      setCurrentSrc(src || fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    const driveId = extractDriveFileId(src);

    if (driveId && retryCount === 0) {
      // Retry attempt 1: export=view URL format
      setRetryCount(1);
      setCurrentSrc(`https://drive.google.com/uc?export=view&id=${driveId}`);
    } else if (driveId && retryCount === 1) {
      // Retry attempt 2: lh3 direct link
      setRetryCount(2);
      setCurrentSrc(`https://lh3.googleusercontent.com/d/${driveId}`);
    } else {
      // Fallback placeholder
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      console.warn(`[DriveImage] Image failed to load after retries. Src: ${src}`);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={`${className} ${hasError ? 'opacity-90 grayscale-[20%]' : ''}`}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};

export default DriveImage;
