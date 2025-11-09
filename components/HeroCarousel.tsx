'use client';

import React, { useEffect, useRef, useState } from 'react';
import SmartImage from './SmartImage';

export type CarouselImage = Readonly<{
  src: string;
  alt?: string;
  caption?: string;
  key?: string;
}>;

export default function HeroCarousel({
  images,
  interval = 5000,
  className = '',
}: Readonly<{ images: CarouselImage[]; interval?: number; className?: string }>) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) setIsVisible(e.isIntersecting);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!isPlaying || !isVisible || images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isPlaying, isVisible, images.length, interval, prefersReducedMotion]);

  const handleImageClick = () => {
    if (images.length <= 1) return;
    // Clear existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Advance to next image
    setIndex((i) => (i + 1) % images.length);
    // Restart autoplay by toggling isPlaying
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 50);
  };

  // Controls intentionally silent: no keyboard or swipe handlers — autoplay only

  if (!images || images.length === 0) return null;

  return (
    <div
      className={`hero-carousel ${className}`}
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Portfolio images"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div 
        className="hero-carousel__viewport"
        onClick={handleImageClick}
        style={{ cursor: images.length > 1 ? 'pointer' : 'default' }}
      >
        {images.map((img, i) => (
          <div
            key={img.key ?? img.src + i}
            className={`hero-carousel__slide ${i === index ? 'is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <div className="hero-carousel__slide-inner">
              <SmartImage
                src={img.src}
                alt={img.alt ?? img.caption ?? 'Hero image'}
                fill
                sizes="(min-width: 1024px) 640px, 90vw"
                priority={i === 0}
                className="object-cover"
              />
              {img.caption && <div className="hero-carousel__caption">{img.caption}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Announce slide changes to screen readers only */}
      <div className="sr-only" aria-live="polite">{`Slide ${index + 1} of ${images.length}`}</div>
    </div>
  );
}
