import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Type, 
  Image as ImageIcon, 
  Video,
  Sparkles, 
  Star, 
  Upload, 
  Trash2, 
  Plus,
  Palette,
  RotateCw,
  Check,
  GripHorizontal
} from 'lucide-react';
import { MemoryPage, ScrapbookItem } from '../types';
import { PRESET_STICKERS } from '../data/initialMemories';

interface EditorScreenProps {
  onCancel: () => void;
  onSave: (newPage: MemoryPage) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  onCancel,
  onSave,
}) => {
  // Page state
  const [pageTitle, setPageTitle] = useState('Summer in Florence');
  const [narrativeText, setNarrativeText] = useState(
    'The cobblestone streets felt warm beneath our feet, a lingering heat from the afternoon sun. We walked for hours, collecting small treasures—a pressed leaf here, a sketch there.'
  );
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [fontFamily, setFontFamily] = useState<'serif' | 'handwriting' | 'sans'>('serif');

  // Scrapbook items inside this memory
  const [items, setItems] = useState<ScrapbookItem[]>([
    {
      id: 'item-florence-1',
      type: 'flower',
      imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
      title: 'Geranium pratense (Meadow Cranesbill)',
      caption: 'Found near the Duomo',
      rotation: -1.5,
      pinPosition: 'top',
      tapePosition: 'none',
      x: 60,
      y: 50,
    },
    {
      id: 'item-florence-2',
      type: 'photo',
      imageUrl: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80',
      title: 'Via de\' Tornabuoni',
      caption: 'Via de\' Tornabuoni',
      rotation: 2.5,
      tapePosition: 'top',
      pinPosition: 'none',
      x: 160,
      y: 260,
    },
  ]);

  // Positioning and Dragging State
  const [textPosition, setTextPosition] = useState({ x: 40, y: 150 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const leftPageRef = useRef<HTMLDivElement>(null);
  const rightPageRef = useRef<HTMLDivElement>(null);

  // Active modal/drawer in toolbar
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<'text' | 'image' | 'sticker' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Handlers
  const handleItemPointerDown = (e: React.PointerEvent, id: string, currentX: number, currentY: number) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
      return;
    }
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
    setDraggingId(id);
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    });
    
    // Bring to front
    setItems(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const newItems = [...prev];
      const [item] = newItems.splice(idx, 1);
      newItems.push(item);
      return newItems;
    });
  };

  const handleTextPointerDown = (e: React.PointerEvent, currentX: number, currentY: number) => {
    e.preventDefault();
    setDraggingId('narrative-text');
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    });
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingId) return;
    
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    if (draggingId === 'narrative-text') {
      if (rightPageRef.current) {
        newX = Math.max(10, Math.min(newX, rightPageRef.current.clientWidth - 200));
        newY = Math.max(10, Math.min(newY, rightPageRef.current.clientHeight - 150));
      }
      setTextPosition({ x: newX, y: newY });
    } else {
      if (leftPageRef.current) {
        newX = Math.max(-100, Math.min(newX, leftPageRef.current.clientWidth - 150));
        newY = Math.max(-100, Math.min(newY, leftPageRef.current.clientHeight - 150));
      }
      setItems(prev => prev.map(item => {
        if (item.id === draggingId) {
          return { ...item, x: newX, y: newY };
        }
        return item;
      }));
    }
  };

  const handlePointerUp = () => {
    if (draggingId) {
      setDraggingId(null);
    }
  };

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, dragOffset]);


  // Add a preset photo/sticker
  const handleAddPreset = (preset: typeof PRESET_STICKERS[0]) => {
    const newItem: ScrapbookItem = {
      id: `item-${Date.now()}`,
      type: preset.type as any,
      imageUrl: preset.url,
      caption: preset.name,
      rotation: (Math.random() * 6) - 3,
      tapePosition: 'right',
      pinPosition: 'none',
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
    };
    setItems((prev) => [...prev, newItem]);
    setActiveToolbarMenu(null);
  };

  // Upload user image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        const newItem: ScrapbookItem = {
          id: `item-${Date.now()}`,
          type: 'photo',
          imageUrl: url,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          rotation: (Math.random() * 6) - 3,
          tapePosition: 'top',
          pinPosition: 'none',
          x: 100 + Math.random() * 150,
          y: 100 + Math.random() * 150,
        };
        setItems((prev) => [...prev, newItem]);
        setActiveToolbarMenu(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload user video
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItem: ScrapbookItem = {
        id: `item-${Date.now()}`,
        type: 'video',
        videoUrl: url,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        rotation: (Math.random() * 6) - 3,
        tapePosition: 'top',
        pinPosition: 'none',
        x: 100 + Math.random() * 150,
        y: 100 + Math.random() * 150,
      };
      setItems((prev) => [...prev, newItem]);
      setActiveToolbarMenu(null);
    }
  };

  // Update item properties
  const updateItemCaption = (id: string, newCaption: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: newCaption } : item))
    );
  };

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newRot = ((item.rotation || 0) + 3) % 15;
          return { ...item, rotation: newRot > 7 ? -5 : newRot };
        }
        return item;
      })
    );
  };

  const togglePinTape = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.pinPosition === 'top') {
            return { ...item, pinPosition: 'none', tapePosition: 'top' };
          } else if (item.tapePosition === 'top') {
            return { ...item, tapePosition: 'right', pinPosition: 'none' };
          } else if (item.tapePosition === 'right') {
            return { ...item, tapePosition: 'none', pinPosition: 'none' };
          } else {
            return { ...item, pinPosition: 'top', tapePosition: 'none' };
          }
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save handler
  const handleSave = () => {
    const newPage: MemoryPage = {
      id: `page-${Date.now()}`,
      type: 'story',
      title: pageTitle.trim() || 'Recuerdo Sin Título',
      narrative: narrativeText,
      items: items,
      pageIndexDisplay: undefined,
      fontFamily: fontFamily,
    };
    onSave(newPage);
  };

  return (
    <div className="min-h-screen bg-[#ebe8e1] flex flex-col justify-between relative selection:bg-[#cba72f]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#fcf9f2]/95 backdrop-blur-md border-b border-[#c2c7cc]/60 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Left: Close icon + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            title="Cancelar y volver"
            className="w-9 h-9 rounded-full hover:bg-[#e5e2db] flex items-center justify-center text-[#1c1c18] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold italic text-[#002434] tracking-tight">
            New Page
          </h1>
        </div>

        {/* Center: Floating Pill Toolbar */}
        <div className="flex items-center bg-[#ebe8e1] border border-[#c2c7cc]/70 rounded-xl px-2 py-1 shadow-xs gap-1">
          {/* Typography Tool */}
          <button
            onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'text' ? null : 'text')}
            title="Ajustar estilo de tipografía"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeToolbarMenu === 'text' ? 'bg-[#fcf9f2] text-[#002434] shadow-xs' : 'text-[#42474b] hover:text-[#002434]'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Image Upload / Library */}
          <button
            onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'image' ? null : 'image')}
            title="Añadir foto o recuerdo"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeToolbarMenu === 'image' ? 'bg-[#fcf9f2] text-[#002434] shadow-xs' : 'text-[#42474b] hover:text-[#002434]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Stickers / Tape / Botanical */}
          <button
            onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'sticker' ? null : 'sticker')}
            title="Añadir adhesivos y flores prensadas"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeToolbarMenu === 'sticker' ? 'bg-[#fcf9f2] text-[#002434] shadow-xs' : 'text-[#42474b] hover:text-[#002434]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#c2c7cc] mx-1"></div>

          {/* Star / Bookmark Toggle */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            title="Marcar página"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isBookmarked ? 'text-[#cba72f]' : 'text-[#42474b] hover:text-[#002434]'
            }`}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-[#cba72f]' : ''}`} />
          </button>
        </div>

        {/* Right: Cancel & Save Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 sm:px-5 py-2 rounded-md font-sans-ui text-sm font-medium text-[#1c1c18] bg-transparent border border-[#72787c]/50 hover:bg-[#e5e2db] hover:border-[#1c1c18] active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 sm:px-6 py-2 rounded-md font-sans-ui text-sm font-medium text-white bg-[#002434] hover:bg-[#1a3a4a] shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-[#ffe088]" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Hidden File Input for Custom Image Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoUpload}
        accept="video/*"
        className="hidden"
      />

      {/* Popover Toolbar Panels */}
      {activeToolbarMenu === 'text' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#fcf9f2] border border-[#c2c7cc] rounded-xl p-4 shadow-xl flex gap-3 items-center">
          <span className="text-xs font-sans-ui text-[#42474b] font-medium">Estilo del texto:</span>
          <button
            onClick={() => setFontFamily('serif')}
            className={`px-3 py-1 text-xs rounded border cursor-pointer font-serif-display ${
              fontFamily === 'serif' ? 'bg-[#002434] text-white' : 'bg-[#ebe8e1] text-[#1c1c18]'
            }`}
          >
            Literata Serif
          </button>
          <button
            onClick={() => setFontFamily('handwriting')}
            className={`px-3 py-1 text-xs rounded border cursor-pointer font-handwriting text-sm ${
              fontFamily === 'handwriting' ? 'bg-[#002434] text-white' : 'bg-[#ebe8e1] text-[#1c1c18]'
            }`}
          >
            Manuscrito
          </button>
          <button
            onClick={() => setFontFamily('sans')}
            className={`px-3 py-1 text-xs rounded border cursor-pointer font-sans-ui ${
              fontFamily === 'sans' ? 'bg-[#002434] text-white' : 'bg-[#ebe8e1] text-[#1c1c18]'
            }`}
          >
            Moderno
          </button>
        </div>
      )}

      {activeToolbarMenu === 'image' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#fcf9f2] border border-[#c2c7cc] rounded-xl p-4 shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-sans-ui font-semibold text-[#002434] uppercase tracking-wider">Añadir Media</span>
            <div className="flex gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="text-xs font-sans-ui text-[#002434] font-medium flex items-center gap-1 hover:underline cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Subir Imagen
              </button>
              <button onClick={() => videoInputRef.current?.click()} className="text-xs font-sans-ui text-[#002434] font-medium flex items-center gap-1 hover:underline cursor-pointer">
                <Video className="w-3.5 h-3.5" /> Subir Video
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_STICKERS.filter(s => s.type === 'photo').map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleAddPreset(preset)}
                className="aspect-square rounded-lg overflow-hidden border border-[#c2c7cc] hover:border-[#002434] cursor-pointer relative group"
              >
                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] p-1 text-center font-sans-ui transition-opacity">
                  {preset.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeToolbarMenu === 'sticker' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#fcf9f2] border border-[#c2c7cc] rounded-xl p-4 shadow-xl max-w-md w-full">
          <span className="text-xs font-sans-ui font-semibold text-[#002434] uppercase tracking-wider block mb-3">
            Elementos Botánicos y Adhesivos
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_STICKERS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleAddPreset(preset)}
                className="aspect-square rounded-lg overflow-hidden border border-[#c2c7cc] hover:border-[#002434] cursor-pointer relative group bg-[#f4ecd8] p-1 flex items-center justify-center"
              >
                <img src={preset.url} alt={preset.name} className="max-h-full max-w-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] p-1 text-center font-sans-ui transition-opacity">
                  {preset.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Page Spread */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden">
        <div className="w-full max-w-[1200px] h-[750px] flex shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-sm border border-[#e5e2db] relative">
          
          {/* Left Page (Items Canvas) */}
          <div 
            ref={leftPageRef}
            className="flex-1 bg-[#fcf9f2] paper-texture paper-grain botanical-corner-tl relative overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.04)_inset]"
          >
            {/* Free-form Draggable Items */}
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`absolute group/card ${draggingId === item.id ? 'scale-105 z-50 shadow-2xl cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                  left: item.x ?? 100, 
                  top: item.y ?? 100,
                  transition: draggingId === item.id ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s',
                  touchAction: 'none'
                }}
                onPointerDown={(e) => handleItemPointerDown(e, item.id, item.x ?? 100, item.y ?? 100)}
              >
                {/* Floating Action Controls */}
                <div className="absolute -top-3 -right-2 z-30 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white rounded-full shadow-md border border-stone-200 flex items-center p-1 gap-1">
                  <button
                    onClick={() => rotateItem(item.id)}
                    title="Rotar polaroid"
                    className="p-1 hover:bg-stone-100 rounded text-stone-600 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => togglePinTape(item.id)}
                    title="Cambiar fijación (chincheta / cinta)"
                    className="p-1 hover:bg-stone-100 rounded text-stone-600 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    title="Eliminar elemento"
                    className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* The Polaroid Card */}
                <div
                  className="relative inline-block polaroid bg-white text-stone-800 max-w-[260px]"
                  style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                >
                  {/* Push Pin */}
                  {item.pinPosition === 'top' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#1a3a4a] border-2 border-stone-300 shadow-md"></div>
                    </div>
                  )}

                  {/* Washi tape */}
                  {item.tapePosition === 'right' && (
                    <div className="washi-tape -top-3 -right-3 rotate-12" />
                  )}
                  {item.tapePosition === 'left' && (
                    <div className="washi-tape -top-3 -left-3 -rotate-12" />
                  )}
                  {item.tapePosition === 'top' && (
                    <div className="washi-tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
                  )}

                  {/* Image or Video */}
                  <div className="relative overflow-hidden bg-[#e8e4dc] border border-stone-200 aspect-[4/3] flex items-center justify-center w-full h-full pointer-events-none">
                    <div className="absolute inset-0 paper-grain z-10 opacity-30 mix-blend-overlay"></div>
                    {item.type === 'video' && item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover select-none filter sepia-[0.35] contrast-[0.95] brightness-[1.05] saturate-[0.8]"
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.caption || 'Memory Photo'}
                        className="w-full h-full object-cover select-none filter sepia-[0.35] contrast-[0.95] brightness-[1.05] saturate-[0.8]"
                        draggable={false}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Editable caption */}
                  <div className="mt-2 text-center pb-2">
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => updateItemCaption(item.id, e.target.value)}
                      placeholder="Pie de foto manuscrito..."
                      className="w-full font-handwriting text-xl text-stone-800 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-600 outline-none text-center cursor-text"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add item button placed discreetly inside left page */}
            <div className="absolute bottom-6 right-6 z-40">
              <button
                onClick={() => setActiveToolbarMenu('image')}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/70 backdrop-blur-md border border-dashed border-[#72787c]/60 rounded-full font-sans-ui text-xs text-[#42474b] hover:border-[#002434] hover:text-[#002434] hover:bg-white transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir recuerdo</span>
              </button>
            </div>
          </div>

          {/* Book Spine Shadow / Crease */}
          <div className="w-[8px] h-full bg-gradient-to-r from-[#e5e2db] via-[#ccc8bf] to-[#e5e2db] z-10 shadow-[inset_3px_0_8px_rgba(0,0,0,0.06),inset_-3px_0_8px_rgba(0,0,0,0.06)] border-x border-[#c2c7cc]/40"></div>

          {/* Right Page (Narrative Canvas) */}
          <div 
            ref={rightPageRef}
            className="flex-1 bg-[#fcf9f2] paper-texture paper-grain botanical-corner-br relative overflow-hidden shadow-[4px_0_15px_rgba(0,0,0,0.04)_inset] p-10"
          >
            {/* Title - Static at the top of the right page */}
            <div className="mb-8 relative z-20">
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Título de la Página..."
                className="w-full font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold italic text-[#002434] tracking-tight bg-transparent border-b-2 border-[#d4af37]/60 pb-2 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Draggable Narrative Text Block */}
            <div 
              className={`absolute group bg-white/40 backdrop-blur-sm border border-transparent hover:border-[#d1ccc0] rounded-lg p-1 ${draggingId === 'narrative-text' ? 'scale-[1.02] z-50 shadow-xl' : 'shadow-sm hover:shadow-md'}`}
              style={{ 
                left: textPosition.x, 
                top: textPosition.y,
                width: 'calc(100% - 80px)',
                transition: draggingId === 'narrative-text' ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s',
                touchAction: 'none'
              }}
            >
              {/* Drag Handle */}
              <div 
                className="h-6 w-full flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => handleTextPointerDown(e, textPosition.x, textPosition.y)}
              >
                <div className="w-12 h-1.5 bg-stone-300 rounded-full flex items-center justify-center">
                  <GripHorizontal className="w-4 h-4 text-stone-500" />
                </div>
              </div>
              
              <textarea
                rows={10}
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                placeholder="Escribe la historia de este recuerdo..."
                className={`w-full bg-transparent resize-none outline-none leading-relaxed text-stone-800 text-lg px-3 pb-3 ${
                  fontFamily === 'serif' ? 'font-serif' : fontFamily === 'handwriting' ? 'font-handwriting text-2xl' : 'font-sans-ui text-base'
                }`}
              />
              <span className="text-[11px] font-sans-ui text-stone-400 block ml-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                💡 Arrastra el tirador superior para mover el texto.
              </span>
            </div>

            {/* Footer note on the page */}
            <div className="absolute bottom-8 left-10 right-10 pt-4 border-t border-[#e5e2db] flex items-center justify-between text-xs text-stone-400 font-sans-ui z-10 pointer-events-none">
              <span>Editor de Recuerdos Libres • Lumina Scholastica</span>
              <span>Álbum de Recuerdos</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
