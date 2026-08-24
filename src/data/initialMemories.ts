import { MemoryPage } from '../types';

export const INITIAL_PAGES: MemoryPage[] = [
  // Page 1: Front Cover
  {
    id: 'cover',
    type: 'cover',
    title: 'NOSTALGIC\nMEMORIES\nALBUM',
    subtitle: 'A Collection of Moments',
    dateRange: '1970 - 1985',
  },
  // Page 2: Inside Cover
  {
    id: 'inside-cover',
    type: 'inside_blank',
  },
  // Page 3: Add chapter / new memories
  {
    id: 'page-7',
    type: 'add_chapter',
    handwrittenNote: 'Start a new chapter...',
  },
  // Page 4: Back Cover
  {
    id: 'page-8',
    type: 'back_cover',
  },
];

export const PRESET_STICKERS = [
  { id: 'flower-geranium', name: 'Pressed Geranium', url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=400&q=80', type: 'flower' },
  { id: 'florence-street', name: 'Florence Alley', url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=400&q=80', type: 'photo' },
  { id: 'vintage-duomo', name: 'Duomo Vista', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80', type: 'photo' },
  { id: 'autumn-leaves', name: 'Dried Botanical Leaf', url: 'https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=400&q=80', type: 'flower' },
  { id: 'vintage-letter', name: 'Antique Postcard', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80', type: 'stamp' },
];
