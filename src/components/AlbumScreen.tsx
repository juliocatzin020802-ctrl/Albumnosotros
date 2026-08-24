import React, { useState, useEffect, useRef } from 'react';
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
  const flipbookRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = pages.length;

  // Initialize Turn.js
  useEffect(() => {
    if (!flipbookRef.current || pages.length === 0) return;

    const $el = $(flipbookRef.current);
    
    // Determine initial display mode based on window width
    const isMobile = window.innerWidth < 768;
    
    $el.turn({
      width: isMobile ? 400 : 960,
      height: isMobile ? 540 : 600,
      autoCenter: true,
      display: isMobile ? 'single' : 'double',
      gradients: true,
      elevation: 50,
      page: 1,
      when: {
        turned: (event: any, page: number) => {
          setCurrentPage(page);
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      if ($el.turn('is')) {
        const mobile = window.innerWidth < 768;
        $el.turn('display', mobile ? 'single' : 'double');
        $el.turn('size', mobile ? 400 : 960, mobile ? 540 : 600);
      }
    };

    window.addEventListener('resize', handleResize);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        $el.turn('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        $el.turn('previous');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if ($el.turn('is')) {
        $el.turn('destroy');
      }
    };
  }, [pages]); // Re-init when pages change

  const goToNext = () => {
    if (flipbookRef.current) $(flipbookRef.current).turn('next');
  };

  const goToPrev = () => {
    if (flipbookRef.current) $(flipbookRef.current).turn('previous');
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetPage = Math.round(ratio * (totalPages - 1)) + 1;
    if (flipbookRef.current) {
      $(flipbookRef.current).turn('page', targetPage);
    }
  };

  const handleBookmarkClick = () => {
    const addChapterIndex = pages.findIndex(p => p.type === 'add_chapter');
    if (addChapterIndex !== -1 && flipbookRef.current) {
      $(flipbookRef.current).turn('page', addChapterIndex + 1);
    }
  };

  // Scrubber percentage based on current page
  const progressPercent = totalPages > 1 
    ? ((currentPage - 1) / (totalPages - 1)) * 100 
    : 0;

  const renderCover = (page: MemoryPage) => (
    <div className="w-full h-full leather-cover p-8 md:p-12 flex flex-col items-center justify-center text-center relative rounded-r-md border-2 border-[#2a1a17] select-none">
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
          <span>Haz clic en &apos;Next&apos; o usa las flechas para hojear</span>
        </div>
      </div>
    </div>
  );

  const renderBackCover = () => (
    <div className="w-full h-full leather-cover p-8 flex flex-col items-center justify-center text-center relative rounded-l-md select-none">
      <div className="absolute inset-4 border border-[#d4af37]/30 rounded-sm pointer-events-none"></div>
      <div className="w-12 h-12 rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]/60 mb-4">
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="font-serif-display text-lg text-[#d4af37]/80 italic">Fin del Álbum</p>
      <p className="font-sans-ui text-xs text-[#d4af37]/50 mt-2">Nostalgic Memories • Lumina Scholastica</p>
    </div>
  );

  const renderPageContent = (page: MemoryPage, index: number) => {
    // For turn.js, even pages are on the left, odd are on the right (usually).
    // The first page (cover) is 1 (right). 
    // We add 'hard' class to covers if we want them to feel stiff, but for simplicity we'll just style them.
    const isLeft = index % 2 !== 0; // 0-based index. 0 is page 1 (right). 1 is page 2 (left).

    if (page.type === 'cover') {
      return renderCover(page);
    }

    if (page.type === 'back_cover') {
      return renderBackCover();
    }

    if (page.type === 'inside_blank') {
      return (
        <div className={`w-full h-full paper-texture paper-grain botanical-corner-tl botanical-corner-br ${isLeft ? 'page-shadow-left' : 'page-shadow-right'} p-8 flex flex-col justify-between`}>
          <div className="border border-stone-300/40 h-full w-full rounded p-6 flex flex-col items-center justify-center text-center">
            <p className="font-serif-display text-stone-500 italic text-lg mb-2">Ex Libris</p>
            <div className="w-16 h-[1px] bg-stone-300 mb-4"></div>
            <div className="botanical-divider mb-4">✿</div>
            <p className="font-handwriting text-2xl text-stone-700">Memorias y Recuerdos Atesorados</p>
          </div>
        </div>
      );
    }

    if (page.type === 'add_chapter') {
      return (
        <div className={`w-full h-full paper-texture paper-grain ${isLeft ? 'page-shadow-left' : 'page-shadow-right'} p-8 md:p-12 flex flex-col items-center justify-center text-center relative`}>
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

    // Standard memory content page
    return (
      <div className={`w-full h-full paper-texture paper-grain botanical-corner-tl botanical-corner-br ${isLeft ? 'page-shadow-left' : 'page-shadow-right'} p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden`}>
        <div className="flex flex-col items-center text-center flex-grow justify-center">
          {/* Main Title if present */}
          {page.title && (
            <h2 className="font-handwriting text-3xl sm:text-4xl text-stone-800 mb-4 tracking-wide">
              {page.title}
            </h2>
          )}

          {/* Polaroid and items */}
          {page.items && page.items.length > 0 && (
            <div className="my-3 flex flex-col items-center">
              {page.items.map((item) => (
                <PolaroidCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Narrative Story */}
          {page.narrative && (
            <div className={`${
              page.fontFamily === 'serif' ? 'font-serif text-xl sm:text-2xl' : 
              page.fontFamily === 'sans' ? 'font-sans-ui text-base' : 
              'font-handwriting text-xl sm:text-2xl'
            } text-stone-800 leading-relaxed max-w-sm mt-3 px-2`}>
              <p>{page.narrative}</p>
            </div>
          )}

          {/* Handwritten Note without items */}
          {page.handwrittenNote && (!page.items || page.items.length === 0) && (
            <p className="font-handwriting text-2xl text-stone-700 my-4">
              {page.handwrittenNote}
            </p>
          )}
        </div>

        {/* Page Number */}
        {page.pageIndexDisplay !== undefined && (
          <div className="w-full text-center font-sans-ui text-xs text-stone-400 mt-2 select-none">
            {page.pageIndexDisplay}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#4a3b2c] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience / Subtle Wood Desk Grain */}
      <div className="absolute inset-0 bg-[radial-gradient(#5a4736_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Top Header Bar with title */}
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

      {/* Main Reading Stage (The Desk & Flipbook) */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 w-full max-w-[1240px] mx-auto">
        
        {/* Turn.js Flipbook Container */}
        <div className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] rounded-lg">
          
          {/* Bookmark Tab - Attached to the book */}
          <div
            id="bookmark-tab"
            onClick={handleBookmarkClick}
            title="Ir a página para añadir recuerdos"
            className="absolute right-4 sm:right-12 -top-2 w-10 sm:w-12 h-16 sm:h-20 bg-[#d92121] hover:bg-[#b91515] shadow-lg cursor-pointer flex flex-col items-center justify-start pt-2 z-40 hover:-translate-y-1 active:translate-y-0 transition-transform duration-200 group"
          >
            <Camera className="w-5 h-5 text-[#ffdcdc] group-hover:scale-110 transition-transform" />
            
            {/* Bookmark ribbon tail notch at the bottom */}
            <div className="absolute -bottom-4 right-0 w-0 h-0 border-l-[20px] sm:border-l-[24px] border-l-transparent border-r-[20px] sm:border-r-[24px] border-r-transparent border-t-[16px] border-t-[#d92121] group-hover:border-t-[#b91515] transition-colors" />
          </div>

          <div id="flipbook" ref={flipbookRef} className="turnjs-flipbook">
            {pages.map((page, index) => (
              <div key={`${page.id}-${index}`} className="turn-page relative border-r border-l border-[#dcdad3]/30">
                {renderPageContent(page, index)}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Bottom Navigation & Scrubber Bar matching spec */}
      <nav className="relative z-30 w-full h-18 sm:h-20 flex justify-between items-center px-4 sm:px-12 bg-[#fcf9f2]/95 backdrop-blur-md border-t border-[#c2c7cc]/50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-[#002434]">
        {/* Previous Button */}
        <button
          id="btn-prev"
          onClick={goToPrev}
          disabled={currentPage === 1}
          className="flex flex-col items-center justify-center w-20 h-full text-[#42474b] hover:text-[#002434] disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 mb-0.5" />
          <span className="font-sans-ui text-xs font-semibold tracking-wider uppercase">Previous</span>
        </button>

        {/* Center Progress Indicator & Interactive Scrubber */}
        <div className="flex flex-col items-center justify-center flex-grow max-w-xl px-4 sm:px-8">
          <div
            onClick={handleScrubberClick}
            className="w-full h-5 flex items-center cursor-pointer group relative"
          >
            {/* Scrubber Track */}
            <div className="w-full h-[3px] bg-[#c2c7cc]/50 rounded-full relative overflow-visible group-hover:h-[5px] transition-all">
              {/* Active Fill */}
              <div
                id="progress-bar"
                className="h-full bg-[#cba72f] rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Scrubber Gold Diamond Handle */}
              <div
                id="progress-handle"
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#cba72f] border border-[#735c00] rotate-45 transform origin-center shadow-md -ml-2 group-hover:scale-125 transition-transform"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Page Numbers */}
          <div className="font-sans-ui text-xs text-[#42474b] mt-1 tracking-widest flex items-center gap-1.5 font-medium">
            <span id="page-num" className="text-[#002434] font-bold">
              {currentPage}
            </span>
            <span>/</span>
            <span id="total-pages">
              {totalPages}
            </span>
          </div>
        </div>

        {/* Next Button */}
        <button
          id="btn-next"
          onClick={goToNext}
          disabled={currentPage >= totalPages}
          className="flex flex-col items-center justify-center w-20 h-full text-[#42474b] hover:text-[#002434] disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 mb-0.5" />
          <span className="font-sans-ui text-xs font-semibold tracking-wider uppercase">Next</span>
        </button>
      </nav>
    </div>
  );
};

