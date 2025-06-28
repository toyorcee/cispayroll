import React, { useState, useEffect } from "react";

interface SimpleCarouselProps {
  children: React.ReactNode;
  slidesPerView?: number;
  spaceBetween?: number;
  autoplay?: boolean;
  autoplaySpeed?: number;
  loop?: boolean;
  className?: string;
  breakpoints?: {
    [key: number]: { slidesPerView: number };
  };
}

export const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
  children,
  slidesPerView = 1,
  spaceBetween = 16,
  autoplay = false,
  autoplaySpeed = 3000,
  loop = false,
  className = "",
  breakpoints = {},
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlidesPerView, setCurrentSlidesPerView] =
    useState(slidesPerView);
  const childrenArray = React.Children.toArray(children);
  const totalSlides = childrenArray.length;

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newSlidesPerView = slidesPerView;

      // Check breakpoints in descending order
      const sortedBreakpoints = Object.keys(breakpoints)
        .map(Number)
        .sort((a, b) => b - a);

      for (const breakpoint of sortedBreakpoints) {
        if (width >= breakpoint) {
          newSlidesPerView = breakpoints[breakpoint].slidesPerView;
          break;
        }
      }

      setCurrentSlidesPerView(newSlidesPerView);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slidesPerView, breakpoints]);

  useEffect(() => {
    if (!autoplay || totalSlides <= currentSlidesPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (loop) {
          return (prevIndex + 1) % (totalSlides - currentSlidesPerView + 1);
        } else {
          return prevIndex + 1 >= totalSlides - currentSlidesPerView + 1
            ? 0
            : prevIndex + 1;
        }
      });
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [autoplay, autoplaySpeed, loop, totalSlides, currentSlidesPerView]);

  if (totalSlides <= currentSlidesPerView) {
    return (
      <div className={`flex gap-${spaceBetween} ${className}`}>{children}</div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${
            currentIndex * (100 / currentSlidesPerView)
          }%)`,
          gap: `${spaceBetween}px`,
        }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{
              width: `calc(${100 / currentSlidesPerView}% - ${
                (spaceBetween * (currentSlidesPerView - 1)) /
                currentSlidesPerView
              }px)`,
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
