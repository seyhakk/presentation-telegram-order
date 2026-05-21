import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlideNavigation from './components/SlideNavigation';
import Slide01Title from './slides/Slide01Title';
import Slide02Architecture from './slides/Slide02Architecture';
import Slide03AdminOverview from './slides/Slide03AdminOverview';
import Slide04AdminCapabilities from './slides/Slide04AdminCapabilities';
import Slide05DineInFlow from './slides/Slide05DineInFlow';
import Slide06DineInTechnical from './slides/Slide06DineInTechnical';
import Slide07DeliveryFlow from './slides/Slide07DeliveryFlow';
import Slide08DeliveryBenefits from './slides/Slide08DeliveryBenefits';
import Slide09UnifiedData from './slides/Slide09UnifiedData';
import Slide10TechStack from './slides/Slide10TechStack';
import Slide11Value from './slides/Slide11Value';
import Slide12NextSteps from './slides/Slide12NextSteps';

const slides = [
  Slide01Title,
  Slide02Architecture,
  Slide03AdminOverview,
  Slide04AdminCapabilities,
  Slide05DineInFlow,
  Slide06DineInTechnical,
  Slide07DeliveryFlow,
  Slide08DeliveryBenefits,
  Slide09UnifiedData,
  Slide10TechStack,
  Slide11Value,
  Slide12NextSteps,
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/swipe support
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrev]);

  const CurrentSlideComponent = slides[currentSlide];

  return (
    <div className="w-full h-screen bg-gray-950 overflow-hidden">
      <AnimatePresence mode="wait">
        <CurrentSlideComponent key={currentSlide} />
      </AnimatePresence>
      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onPrev={goToPrev}
        onNext={goToNext}
        onGoTo={goTo}
      />
    </div>
  );
}
