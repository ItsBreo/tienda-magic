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
    // Show selector for all pack types now

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
