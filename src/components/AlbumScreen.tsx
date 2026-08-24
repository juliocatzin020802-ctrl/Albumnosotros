import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Camera, Plus, BookOpen, Sparkles } from 'lucide-react';
import { MemoryPage } from '../types';
import { PolaroidCard } from './PolaroidCard';

interface AlbumScreenProps {
  pages: MemoryPage[];
  onNavigateToEditor: () => void;
}

export const AlbumScreen: React.FC<AlbumScreenProps> = ({
  pages,
  onNavigateToEditor,
}) => {
  // currentSpread tracks which pair of pages is visible (0-indexed)
  // Spread 0 = cover (single right page)
  // Spread 1 = pages[1] (left) + pages[2] (right)
  // Last spread = back cover (single left page)
  const [currentSpread, setCurrentSpread] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  // Build spreads from pages array
  // First page (cover) is shown alone on the right
  // Last page (back cover) is shown alone on the left
  // Middle pages are paired: [1,2], [3,4], [5,6], etc.
  const spreads = buildSpreads(pages);
  const totalSpreads = spreads.length;

  const goToNext = useCallback(() => {
    if (currentSpread >= totalSpreads - 1 || isAnimating) return;
    setFlipDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSpread((s) => Math.min(s + 1, totalSpreads - 1));
      setIsAnimating(false);
    }, 300);
  }, [currentSpread, totalSpreads, isAnimating]);

  const goToPrev = useCallback(() => {
    if (currentSpread <= 0 || isAnimating) return;
    setFlipDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSpread((s) => Math.max(s - 1, 0));
      setIsAnimating(false);
    }, 300);
  }, [currentSpread, isAnimating]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnimating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSpread = Math.round(ratio * (totalSpreads - 1));
    setFlipDirection(targetSpread > currentSpread ? 'next' : 'prev');
    setCurrentSpread(targetSpread);
  };

  const handleBookmarkClick = () => {
    // Find the spread that contains the add_chapter page
    const addIdx = pages.findIndex((p) => p.type === 'add_chapter');
    if (addIdx === -1) return;
    for (let i = 0; i < spreads.length; i++) {
      if (spreads[i].left?.id === pages[addIdx].id || spreads[i].right?.id === pages[addIdx].id) {
        setFlipDirection(i > currentSpread ? 'next' : 'prev');
        setCurrentSpread(i);
        break;
      }
    }
  };

  const currentSpreadData = spreads[currentSpread];

  // Display page numbers
  const displayPageStart = getPageNumber(currentSpreadData.left, pages);
  const displayPageEnd = getPageNumber(currentSpreadData.right, pages);
  const pageLabel = displayPageStart && displayPageEnd
    ? `${displayPageStart} - ${displayPageEnd}`
    : displayPageStart
      ? `${displayPageStart}`
      : displayPageEnd
        ? `${displayPageEnd}`
        : '';

  // Scrubber percentage
  const progressPercent = totalSpreads > 1
    ? (currentSpread / (totalSpreads - 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-[#4a3b2c] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#5a4736_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between text-[#fcf9f2]/90 border-b border-[#31312c]/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#cba72f] shadow-sm"></div>
          <span className="font-serif-display tracking-widest text-sm uppercase text-[#d4af37]">
            Álbum de Recuerdos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fcf9f2]/10 hover:bg-[#fcf9f2]/20 text-[#fcf9f2] text-xs font-sans-ui border border-[#fcf9f2]/20 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#ffe088]" />
            <span>Editor de Recuerdos</span>
          </button>
        </div>
      </header>

      {/* Main Reading Stage */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 w-full max-w-[1240px] mx-auto">

        <div className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] rounded-lg">

          {/* Bookmark Tab */}
          <div
            id="bookmark-tab"
            onClick={handleBookmarkClick}
            title="Ir a página para añadir recuerdos"
            className="absolute right-4 sm:right-12 -top-2 w-10 sm:w-12 h-16 sm:h-20 bg-[#d92121] hover:bg-[#b91515] shadow-lg cursor-pointer flex flex-col items-center justify-start pt-2 z-40 hover:-translate-y-1 active:translate-y-0 transition-transform duration-200 group"
          >
            <Camera className="w-5 h-5 text-[#ffdcdc] group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-4 right-0 w-0 h-0 border-l-[20px] sm:border-l-[24px] border-l-transparent border-r-[20px] sm:border-r-[24px] border-r-transparent border-t-[16px] border-t-[#d92121] group-hover:border-t-[#b91515] transition-colors" />
          </div>

          {/* Open Book Spread */}
          <div
            className={`flex transition-opacity duration-300 ${isAnimating ? 'opacity-60' : 'opacity-100'}`}
          >
            {/* Left Page */}
            <div className="w-[480px] h-[600px] hidden md:block relative">
              {currentSpreadData.left ? (
                <div className="w-full h-full relative">
                  {renderPageContent(currentSpreadData.left, 'left', onNavigateToEditor)}
                  {/* Spine shadow on the right edge of left page */}
                  <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/15 to-transparent pointer-events-none z-10" />
                </div>
              ) : (
                <div className="w-full h-full bg-[#4a3b2c] rounded-l-lg" />
              )}
            </div>

            {/* Center Spine */}
            <div className="hidden md:block w-[2px] bg-[#2a1a17] shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 relative">
              <div className="absolute inset-y-0 -left-1 w-[4px] bg-gradient-to-r from-transparent via-black/20 to-transparent" />
            </div>

            {/* Right Page */}
            <div className="w-[400px] md:w-[480px] h-[540px] md:h-[600px] relative">
              {currentSpreadData.right ? (
                <div className="w-full h-full relative">
                  {renderPageContent(currentSpreadData.right, 'right', onNavigateToEditor)}
                  {/* Spine shadow on the left edge of right page */}
                  <div className="hidden md:block absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />
                </div>
              ) : (
                <div className="w-full h-full bg-[#4a3b2c] rounded-r-lg" />
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Navigation & Scrubber */}
      <nav className="relative z-30 w-full h-18 sm:h-20 flex justify-between items-center px-4 sm:px-12 bg-[#fcf9f2]/95 backdrop-blur-md border-t border-[#c2c7cc]/50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-[#002434]">
        {/* Previous Button */}
        <button
          id="btn-prev"
          onClick={goToPrev}
          disabled={currentSpread === 0}
          className="flex flex-col items-center justify-center w-20 h-full text-[#42474b] hover:text-[#002434] disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 mb-0.5" />
          <span className="font-sans-ui text-xs font-semibold tracking-wider uppercase">Previous</span>
        </button>

        {/* Center Progress Indicator */}
        <div className="flex flex-col items-center justify-center flex-grow max-w-xl px-4 sm:px-8">
          <div
            onClick={handleScrubberClick}
            className="w-full h-5 flex items-center cursor-pointer group relative"
          >
            <div className="w-full h-[3px] bg-[#c2c7cc]/50 rounded-full relative overflow-visible group-hover:h-[5px] transition-all">
              <div
                id="progress-bar"
                className="h-full bg-[#cba72f] rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                id="progress-handle"
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#cba72f] border border-[#735c00] rotate-45 transform origin-center shadow-md -ml-2 group-hover:scale-125 transition-transform"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="font-sans-ui text-xs text-[#42474b] mt-1 tracking-widest flex items-center gap-1.5 font-medium">
            <span id="page-num" className="text-[#002434] font-bold">
              {pageLabel || (currentSpread + 1)}
            </span>
            <span>/</span>
            <span id="total-pages">{pages.length}</span>
          </div>
        </div>

        {/* Next Button */}
        <button
          id="btn-next"
          onClick={goToNext}
          disabled={currentSpread >= totalSpreads - 1}
          className="flex flex-col items-center justify-center w-20 h-full text-[#42474b] hover:text-[#002434] disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 mb-0.5" />
          <span className="font-sans-ui text-xs font-semibold tracking-wider uppercase">Next</span>
        </button>
      </nav>
    </div>
  );
};

// ─── Helper: Build spreads from flat pages array ────────────────────────────

interface Spread {
  left: MemoryPage | null;
  right: MemoryPage | null;
}

function buildSpreads(pages: MemoryPage[]): Spread[] {
  if (pages.length === 0) return [{ left: null, right: null }];

  const spreads: Spread[] = [];

  // First spread: cover is alone on the right
  spreads.push({ left: null, right: pages[0] });

  // Middle pages are paired
  let i = 1;
  while (i < pages.length) {
    const left = pages[i] || null;
    const right = pages[i + 1] || null;

    // If we only have a left page (last page, e.g. back cover alone), show it on left
    if (left && !right) {
      spreads.push({ left, right: null });
      break;
    }

    spreads.push({ left, right });
    i += 2;
  }

  return spreads;
}

function getPageNumber(page: MemoryPage | null, allPages: MemoryPage[]): number | null {
  if (!page) return null;
  const idx = allPages.findIndex((p) => p.id === page.id);
  return idx >= 0 ? idx + 1 : null;
}

// ─── Render functions for page types ────────────────────────────────────────

function renderPageContent(
  page: MemoryPage,
  side: 'left' | 'right',
  onNavigateToEditor: () => void,
) {
  const shadowClass = side === 'left' ? 'page-shadow-left rounded-l-lg' : 'page-shadow-right rounded-r-lg';

  if (page.type === 'cover') {
    return renderCover(page, side);
  }
  if (page.type === 'back_cover') {
    return renderBackCover(side);
  }
  if (page.type === 'inside_blank') {
    return renderInsideBlank(side);
  }
  if (page.type === 'add_chapter') {
    return renderAddChapter(page, side, onNavigateToEditor);
  }
  return renderStoryPage(page, side);
}

function renderCover(page: MemoryPage, side: 'left' | 'right') {
  const roundedClass = side === 'left' ? 'rounded-l-md' : 'rounded-r-md';
  return (
    <div className={`w-full h-full leather-cover p-8 md:p-12 flex flex-col items-center justify-center text-center relative ${roundedClass} border-2 border-[#2a1a17] select-none`}>
      <div className="absolute inset-4 md:inset-6 border border-[#d4af37]/40 rounded-sm pointer-events-none"></div>
      <div className="absolute inset-5 md:inset-7 border border-[#d4af37]/20 rounded-sm pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center">
        <h1
          className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#d4af37] tracking-[0.15em] leading-tight mb-6"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.85)' }}
        >
          {page.title ? (
            page.title.split('\n').map((line, idx) => (
              <span key={idx} className="block">{line}</span>
            ))
          ) : (
            <>
              <span>NOSTALGIC</span>
              <span>MEMORIES</span>
              <span>ALBUM</span>
            </>
          )}
        </h1>

        <p
          className="font-serif-display text-xl sm:text-2xl text-[#d4af37]/90 italic mb-10 tracking-wide"
          style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
        >
          {page.subtitle || 'A Collection of Moments'}
        </p>

        <div className="w-20 h-[1.5px] bg-[#d4af37]/70 my-4 shadow-sm"></div>

        <p className="font-sans-ui text-xs sm:text-sm text-[#d4af37]/70 mt-3 uppercase tracking-[0.25em]">
          {page.dateRange || '1970 - 1985'}
        </p>

        <div className="mt-8 flex items-center gap-2 text-[#d4af37]/60 text-xs font-sans-ui">
          <BookOpen className="w-4 h-4" />
          <span>Usa las flechas para hojear el álbum</span>
        </div>
      </div>
    </div>
  );
}

function renderBackCover(side: 'left' | 'right') {
  const roundedClass = side === 'left' ? 'rounded-l-md' : 'rounded-r-md';
  return (
    <div className={`w-full h-full leather-cover p-8 flex flex-col items-center justify-center text-center relative ${roundedClass} select-none`}>
      <div className="absolute inset-4 border border-[#d4af37]/30 rounded-sm pointer-events-none"></div>
      <div className="w-12 h-12 rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]/60 mb-4">
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="font-serif-display text-lg text-[#d4af37]/80 italic">Fin del Álbum</p>
      <p className="font-sans-ui text-xs text-[#d4af37]/50 mt-2">Nostalgic Memories • Lumina Scholastica</p>
    </div>
  );
}

function renderInsideBlank(side: 'left' | 'right') {
  const shadowClass = side === 'left' ? 'page-shadow-left' : 'page-shadow-right';
  const roundedClass = side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg';
  return (
    <div className={`w-full h-full paper-texture paper-grain botanical-corner-tl botanical-corner-br ${shadowClass} ${roundedClass} p-8 flex flex-col justify-between`}>
      <div className="border border-stone-300/40 h-full w-full rounded p-6 flex flex-col items-center justify-center text-center">
        <p className="font-serif-display text-stone-500 italic text-lg mb-2">Ex Libris</p>
        <div className="w-16 h-[1px] bg-stone-300 mb-4"></div>
        <div className="botanical-divider mb-4">✿</div>
        <p className="font-handwriting text-2xl text-stone-700">Memorias y Recuerdos Atesorados</p>
      </div>
    </div>
  );
}

function renderAddChapter(page: MemoryPage, side: 'left' | 'right', onNavigateToEditor: () => void) {
  const shadowClass = side === 'left' ? 'page-shadow-left' : 'page-shadow-right';
  const roundedClass = side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg';
  return (
    <div className={`w-full h-full paper-texture paper-grain ${shadowClass} ${roundedClass} p-8 md:p-12 flex flex-col items-center justify-center text-center relative`}>
      <div className="w-16 h-16 rounded-full bg-[#f1eee7] border border-[#c2c7cc] flex items-center justify-center text-[#446274] mb-6 shadow-inner">
        <Sparkles className="w-8 h-8 text-[#735c00]" />
      </div>

      <p className="font-handwriting text-3xl md:text-4xl text-stone-700 italic mb-6">
        {page.handwrittenNote || 'Start a new chapter...'}
      </p>

      <p className="font-sans-ui text-sm text-stone-600 max-w-xs mb-8">
        Crea una nueva página con fotos personalizadas, notas manuscritas y recuerdos libres.
      </p>

      <button
        id="add-page-btn"
        onClick={onNavigateToEditor}
        className="group relative inline-flex items-center gap-2.5 bg-[#002434] text-white font-sans-ui text-sm font-medium px-7 py-3.5 rounded-full shadow-lg hover:bg-[#1a3a4a] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <Plus className="w-4 h-4 text-[#ffe088] group-hover:rotate-90 transition-transform duration-300" />
        <span>Añadir Recuerdos</span>
      </button>
    </div>
  );
}

function renderStoryPage(page: MemoryPage, side: 'left' | 'right') {
  const shadowClass = side === 'left' ? 'page-shadow-left' : 'page-shadow-right';
  const roundedClass = side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg';
  return (
    <div className={`w-full h-full paper-texture paper-grain botanical-corner-tl botanical-corner-br ${shadowClass} ${roundedClass} p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden`}>
      <div className="flex flex-col items-center text-center flex-grow justify-center">
        {/* Title */}
        {page.title && (
          <h2 className="font-handwriting text-3xl sm:text-4xl text-stone-800 mb-4 tracking-wide">
            {page.title}
          </h2>
        )}

        {/* Polaroid items */}
        {page.items && page.items.length > 0 && (
          <div className="my-3 flex flex-col items-center">
            {page.items.map((item) => (
              <PolaroidCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Narrative */}
        {page.narrative && (
          <div className={`${
            page.fontFamily === 'serif' ? 'font-serif text-xl sm:text-2xl' :
            page.fontFamily === 'sans' ? 'font-sans-ui text-base' :
            'font-handwriting text-xl sm:text-2xl'
          } text-stone-800 leading-relaxed max-w-sm mt-3 px-2`}>
            <p>{page.narrative}</p>
          </div>
        )}

        {/* Handwritten note */}
        {page.handwrittenNote && (!page.items || page.items.length === 0) && (
          <p className="font-handwriting text-2xl text-stone-700 my-4">
            {page.handwrittenNote}
          </p>
        )}
      </div>

      {/* Page number */}
      {page.pageIndexDisplay !== undefined && (
        <div className="w-full text-center font-sans-ui text-xs text-stone-400 mt-2 select-none">
          {page.pageIndexDisplay}
        </div>
      )}
    </div>
  );
}
