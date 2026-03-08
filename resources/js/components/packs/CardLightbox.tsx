import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Card {
  id: number;
  name: string;
  image_url?: string;
  rarity: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
}

interface CardLightboxProps {
  card: Card | null;
  onClose: () => void;
}

const CardLightbox = ({ card, onClose }: CardLightboxProps) => {
  if (card === null) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ pointerEvents: 'auto' }} // <--- ESTA ES LA MAGIA
    >
      <button
        onClick={onClose}
        className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
      >
        <X size={48} />
      </button>
      <img
        src={card.image_url}
        alt={card.name}
        className="max-h-[85vh] object-contain shadow-2xl"
      />
    </div>,
    document.body
  );
};

export default CardLightbox;
