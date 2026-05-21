import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export default function SlideNavigation({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onGoTo,
}: SlideNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gray-950/80 backdrop-blur-xl border-t border-white/10">
      <button
        onClick={onPrev}
        disabled={currentSlide === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
        <span className="hidden sm:inline text-sm font-medium">Previous</span>
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === currentSlide
                ? 'w-8 h-2.5 bg-indigo-500'
                : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-white/50 text-sm font-mono">
          {currentSlide + 1} / {totalSlides}
        </span>
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span className="hidden sm:inline text-sm font-medium">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
