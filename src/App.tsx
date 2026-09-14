import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, MemoryPage } from './types';
import { INITIAL_PAGES } from './data/initialMemories';
import { AlbumScreen } from './components/AlbumScreen';
import { EditorScreen } from './components/EditorScreen';

const STORAGE_KEY = 'album-de-recuerdos:pages';

function loadSavedPages(): MemoryPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MemoryPage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Album] No se pudieron restaurar las páginas guardadas:', err);
  }
  return INITIAL_PAGES;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('album');
  const [transitionDirection, setTransitionDirection] = useState<'slide_up' | 'push_back'>('slide_up');
  const [pages, setPages] = useState<MemoryPage[]>(() => loadSavedPages());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load pages from localStorage / Supabase on mount
  useEffect(() => {
    async function loadPages() {
      // If we already restored from localStorage, skip the remote fetch
      if (localStorage.getItem(STORAGE_KEY)) {
        setIsLoading(false);
        return;
      }

      try {
        // We use a default user ID for the prototype since auth isn't implemented yet
        const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';
        const { data, error } = await import('./lib/memoriesService').then(m => m.fetchPages(DEFAULT_USER_ID));
        
        if (error) {
          console.error('Error loading pages from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map DB pages to MemoryPage format
          const dbPages: MemoryPage[] = data.map((p, index) => ({
            id: p.id,
            type: 'story',
            title: p.title || undefined,
            narrative: p.narrative || undefined,
            fontFamily: p.font_family as any || 'serif',
            pageIndexDisplay: index + 1,
            items: p.scrapbook_items.map(item => ({
              id: item.id,
              type: item.type as any,
              url: item.url || undefined,
              caption: item.caption || undefined,
              rotation: item.rotation || 0,
              x: item.x || 0,
              y: item.y || 0,
              ...(item.properties as Record<string, unknown>)
            }))
          }));

          // Insert fetched pages between dedication and add chapter
          setPages([
            INITIAL_PAGES[0], // Cover
            INITIAL_PAGES[1], // Inside blank
            INITIAL_PAGES[2], // Dedication
            ...dbPages,
            INITIAL_PAGES[3], // Add chapter
            INITIAL_PAGES[4], // Back cover
          ]);
        }
      } catch (err) {
        console.error('Failed to load pages:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPages();
  }, []);

  // Persist pages locally so saved memories survive page reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (err) {
      console.warn('[Album] No se pudo guardar localmente (¿almacenamiento lleno?):', err);
    }
  }, [pages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Navigation handlers
  const handleOpenEditor = () => {
    setTransitionDirection('slide_up');
    setCurrentScreen('editor');
  };

  const handleCancelEditor = () => {
    setTransitionDirection('push_back');
    setCurrentScreen('album');
  };

  const handleSaveEditor = (newPage: MemoryPage) => {
    // Split the editor page into two album leaves, keeping the editor format:
    // left = image collage, right = title + narrative + spotify track
    setPages((prevPages) => {
      const insertIndex = Math.max(0, prevPages.length - 2);
      const updated = [...prevPages];

      if (newPage.items && newPage.items.length > 0) {
        updated.splice(insertIndex, 0, {
          ...newPage,
          id: `${newPage.id}-collage`,
          type: 'photo_caption',
          title: undefined,
          narrative: undefined,
          spotifyEmbedUrl: undefined,
        });
      }

      updated.splice(insertIndex + (newPage.items && newPage.items.length > 0 ? 1 : 0), 0, {
        ...newPage,
        id: `${newPage.id}-text`,
        type: 'story',
        items: [],
      });

      return updated;
    });

    setTransitionDirection('push_back');
    setCurrentScreen('album');
    showToast('¡Páginas guardadas con éxito en el álbum!');
  };

  // Motion variants for slide_up & push_back
  const screenVariants = {
    initial: (direction: 'slide_up' | 'push_back') => {
      if (direction === 'slide_up') {
        return { y: '100%', opacity: 0.8, scale: 0.98 };
      } else {
        return { scale: 0.92, opacity: 0.4, y: 0 };
      }
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (direction: 'slide_up' | 'push_back') => {
      if (direction === 'slide_up') {
        // Album going back / scaling down
        return {
          scale: 0.94,
          opacity: 0.6,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        };
      } else {
        // Editor sliding down / popping back
        return {
          y: '100%',
          opacity: 0.8,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        };
      }
    },
  };

  return (
    <div className="w-full min-h-screen bg-[#4a3b2c] overflow-hidden relative font-serif">
      {/* Loading State */}
      {isLoading && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-[#d4af37]">
          <div className="w-12 h-12 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
          <p className="font-serif-display text-lg tracking-widest">Cargando álbum...</p>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#002434] text-[#fcf9f2] px-6 py-3 rounded-full shadow-2xl border border-[#cba72f]/40 flex items-center gap-3 font-sans-ui text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-[#cba72f] animate-pulse"></div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <AnimatePresence mode="wait" custom={transitionDirection}>
          {currentScreen === 'album' ? (
            <motion.div
              key="album-screen"
              custom={transitionDirection}
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full min-h-screen"
            >
              <AlbumScreen
                pages={pages}
                onNavigateToEditor={handleOpenEditor}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor-screen"
              custom={transitionDirection}
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full min-h-screen"
            >
              <EditorScreen
                onCancel={handleCancelEditor}
                onSave={handleSaveEditor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
