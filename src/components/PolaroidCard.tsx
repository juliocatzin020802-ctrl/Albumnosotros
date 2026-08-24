import React from 'react';
import { ScrapbookItem } from '../types';

interface PolaroidCardProps {
  item: ScrapbookItem;
  className?: string;
  onEditCaption?: (newCaption: string) => void;
  isEditable?: boolean;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({
  item,
  className = '',
  onEditCaption,
  isEditable = false,
}) => {
  const rotationStyle = item.rotation ? { transform: `rotate(${item.rotation}deg)` } : {};

  return (
    <div
      className={`relative inline-block polaroid bg-white text-stone-800 ${
        item.rotation && item.rotation > 0 ? 'right-tilt' : ''
      } ${className}`}
      style={rotationStyle}
    >
      {/* Push Pin */}
      {item.pinPosition === 'top' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-[#1a3a4a] border-2 border-stone-300 shadow-md"></div>
          <div className="w-1 h-2 bg-stone-400"></div>
        </div>
      )}

      {/* Washi tape on top / corners */}
      {item.tapePosition === 'right' && (
        <div className="washi-tape -top-3 -right-3 rotate-12" />
      )}
      {item.tapePosition === 'left' && (
        <div className="washi-tape -top-3 -left-3 -rotate-12" />
      )}
      {item.tapePosition === 'top' && (
        <div className="washi-tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
      )}

      {/* Image or Video container */}
      <div className="relative overflow-hidden bg-[#e8e4dc] border border-stone-200 aspect-[4/3] flex items-center justify-center w-full h-full">
        {/* Grain overlay for vintage photo feel */}
        <div className="absolute inset-0 paper-grain pointer-events-none z-10 opacity-30 mix-blend-overlay"></div>
        
        {item.type === 'video' && item.videoUrl ? (
          <video
            src={item.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover select-none filter sepia-[0.35] contrast-[0.95] brightness-[1.05] saturate-[0.8]"
          />
        ) : item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.caption || item.title || 'Memory Polaroid'}
            className="w-full h-full object-cover select-none filter sepia-[0.35] contrast-[0.95] brightness-[1.05] saturate-[0.8]"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="text-stone-400 font-sans-ui text-xs p-4 text-center">
            No image or video selected
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-3 text-center px-1">
        {isEditable ? (
          <input
            type="text"
            value={item.caption || ''}
            onChange={(e) => onEditCaption?.(e.target.value)}
            placeholder="Escribe un pie de foto..."
            className="w-full font-handwriting text-xl text-stone-800 bg-transparent border-b border-stone-300 focus:border-stone-600 outline-none text-center"
          />
        ) : (
          <p className="font-handwriting text-xl text-stone-800 tracking-wide">
            {item.caption || item.title}
          </p>
        )}
      </div>
    </div>
  );
};
