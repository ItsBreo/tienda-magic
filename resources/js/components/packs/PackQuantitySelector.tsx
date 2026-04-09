import React from 'react';
import SimpleCounter from '@/components/ui/SimpleCounter';

interface Pack {
  id: number;
  type: string;
  stock?: number;
}

interface PackQuantitySelectorProps {
  pack: Pack;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

export default function PackQuantitySelector({
  pack,
  quantity,
  onQuantityChange,
  className = '',
}: PackQuantitySelectorProps) {
  // Solo mostrar selector para cartas sueltas
  if (pack.type !== 'Singles') {
    return null;
  }

  return (
    <SimpleCounter
      value={quantity}
      onChange={onQuantityChange}
      min={1}
      max={99}
      stock={pack.stock}
      className={className}
    />
  );
}
