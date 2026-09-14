import { MemoryPage } from '../types';

export const INITIAL_PAGES: MemoryPage[] = [
  // Page 1: Front Cover
  {
    id: 'cover',
    type: 'cover',
    title: 'Álbum de\nNuestras Citas\ny Momentos Juntos.',
    subtitle: 'Julio y Linda.',
    dateRange: '2023 – Hasta la tumba',
  },
  // Page 2: Blank page right after the cover
  {
    id: 'inside-cover-blank',
    type: 'inside_blank',
  },
  // Page 3: Dedication page
  {
    id: 'inside-cover-dedication',
    type: 'inside_blank',
    title: 'Guardemos nuestra historia para siempre.',
    narrative:
      'Hola mi amor\n\n' +
      'Esta es la sorpresa que te había dicho que tenía. Realmente me sorprendió que igual un día dijiste que tenías ' +
      'ganas de tener un álbum para guardar las cosas, porque ya andaba haciendo esto. Si bien no es lo mismo, quería ' +
      'que al menos tengamos algo en donde guardar nuestros recuerdos, y que perduren. Traté de hacer algo distinto y ' +
      'por eso pensé en hacerlo así. Espero que te guste mucho. Aunque no puedo decir que lo hice yo, porque todavía ' +
      'no tengo las habilidades al 100, traté de dejarlo lo mejor posible. Te amo.\n\n' +
      'Julio.',
  },
  // Page 4: Add chapter / new memories
  {
    id: 'page-7',
    type: 'add_chapter',
    handwrittenNote: 'Guardemos un recuerdo más <3',
  },
  // Page 5: Back Cover
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
