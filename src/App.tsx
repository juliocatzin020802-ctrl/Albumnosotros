import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, MemoryPage, ScrapbookItem } from './types';
import { INITIAL_PAGES } from './data/initialMemories';
import { AlbumScreen } from './components/AlbumScreen';
import { EditorScreen } from './components/EditorScreen';

const STORAGE_KEY = 'album-de-recuerdos:pages';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

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

function toItemInsert(item: ScrapbookItem) {
  return {
    type: item.type as string,
    url: item.imageUrl || item.videoUrl || null,
    caption: item.caption || null,
    rotation: item.rotation ?? 0,
    x: item.x ?? 0,
    y: item.y ?? 0,
    properties: {},
  };
}

// Persist an editor page (collage or text) to Supabase so it's shared across devices
async function persistEditorPageToSupabase(newPage: MemoryPage | null) {
  if (!newPage) return;
  const mem = await import('./lib/memoriesService');
  try {
    if (newPage.type === 'photo_caption') {
      // Collage page: images + their positions
      const items = (newPage.items || []).map(toItemInsert);
      const { error } = await mem.savePageWithItems(
        {
          user_id: DEFAULT_USER_ID,
          page_type: 'photo_caption',
          title: null,
          narrative: null,
          font_family: newPage.fontFamily || 'serif',
          spotify_url: null,
        },
        items,
      );
      if (error) throw error;
    } else {
      // Story/text page: title + narrative + spotify track
      const { error } = await mem.createPage({
        user_id: DEFAULT_USER_ID,
        page_type: 'story',
        title: newPage.title || null,
        narrative: newPage.narrative || null,
        font_family: newPage.fontFamily || 'serif',
        spotify_url: newPage.spotifyEmbedUrl || null,
      });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[Album] No se pudo sincronizar con Supabase:', err);
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('album');
  const [transitionDirection, setTransitionDirection] = useState<'slide_up' | 'push_back'>('slide_up');
  const [pages, setPages] = useState<MemoryPage[]>(() => loadSavedPages());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load pages from Supabase (source of truth). localStorage is the offline fallback.
  useEffect(() => {
    async function loadPages() {
      try {
        const { data, error } = await import('./lib/memoriesService').then(m => m.fetchPages(DEFAULT_USER_ID));

        if (error) {
          console.warn('[Album] Supabase no disponible, usando guardado local:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map DB pages to MemoryPage format
          const dbPages: MemoryPage[] = data.map((p) => ({
            id: p.id,
            type: p.page_type === 'photo_caption' ? 'photo_caption' : 'story',
            title: p.title || undefined,
            narrative: p.narrative || undefined,
            fontFamily: (p.font_family as any) || 'serif',
            spotifyEmbedUrl: p.spotify_url || undefined,
            items: p.scrapbook_items.map(item => ({
              id: item.id,
              type: item.type as any,
              imageUrl: item.url || undefined,
              videoUrl: item.type === 'video' ? item.url || undefined : undefined,
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
        } else {
          // Supabase is empty: keep the local album if it has one
          console.info('[Album] Supabase sin páginas; manteniendo guardado local.');
        }
      } catch (err) {
        console.warn('[Album] Supabase no disponible, usando guardado local:', err);
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
    const hasItems = newPage.items && newPage.items.length > 0;

    const collagePage: MemoryPage | null = hasItems
      ? {
          ...newPage,
          id: `${newPage.id}-collage`,
          type: 'photo_caption',
          title: undefined,
          narrative: undefined,
          spotifyEmbedUrl: undefined,
        }
      : null;

    const textPage: MemoryPage = {
      ...newPage,
      id: `${newPage.id}-text`,
      type: 'story',
      items: [],
    };

    setPages((prevPages) => {
      const insertIndex = Math.max(0, prevPages.length - 2);
      const updated = [...prevPages];

      if (collagePage) {
        updated.splice(insertIndex, 0, collagePage);
      }
      updated.splice(insertIndex + (collagePage ? 1 : 0), 0, textPage);

      return updated;
    });

    // Sync with Supabase so the pages are visible on any device
    void persistEditorPageToSupabase(collagePage);
    void persistEditorPageToSupabase(textPage);

    setTransitionDirection('push_back');
    setCurrentScreen('album');
    showToast('¡Guardado! Ahora se verá en cualquier dispositivo.');
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
