export type ScreenType = 'album' | 'editor';

export interface ScrapbookItem {
  id: string;
  type: 'photo' | 'flower' | 'note' | 'tape' | 'stamp' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  title?: string;
  caption?: string;
  rotation?: number;
  tapePosition?: 'left' | 'right' | 'top' | 'none';
  pinPosition?: 'top' | 'none';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface MemoryPage {
  id: string;
  pageNumber?: number;
  type: 'cover' | 'inside_blank' | 'photo_caption' | 'story' | 'spread' | 'add_chapter' | 'back_cover';
  title?: string;
  subtitle?: string;
  dateRange?: string;
  narrative?: string;
  handwrittenNote?: string;
  items?: ScrapbookItem[];
  pageIndexDisplay?: number;
  fontFamily?: 'serif' | 'handwriting' | 'sans';
}
