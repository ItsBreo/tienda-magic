import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import TiltWrapper from '../ui/TiltWrapper';

interface Card {
  id: number;
  name: string;
  image_url?: string;
  image_uri?: string; // Bug 2 Fix: Add support for image_uri
  rarity: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
}

interface CardLightboxProps {
  card: Card | null;
  onClose: () => void;
}

function CardLightbox({ card, onClose }: CardLightboxProps) {
  if (card === null) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ pointerEvents: 'auto' }}
    >
      <button
        onClick={onClose}
        className="absolute top-10 left-10 flex items-center gap-3 text-white/70 hover:text-white transition-colors bg-zinc-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-zinc-700"
      >
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Cerrar</span>
      </button>
      <TiltWrapper className="max-h-[85vh]">
        <img
          src={card.image_uri || card.image_url}
          alt={card.name}
          className="max-h-[85vh] object-contain shadow-2xl"
        />
      </TiltWrapper>
    </div>,
    document.body,
  );
}

export default CardLightbox;
