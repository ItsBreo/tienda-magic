import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface SimpleCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  stock?: number;
  disabled?: boolean;
  className?: string;
}

export default function SimpleCounter({
  value,
  onChange,
  min = 1,
  max = 99,
  stock,
  disabled = false,
  className = '',
}: SimpleCounterProps) {
  const [internalQuantity, setInternalQuantity] = useState<number>(value);
  const maxAllowed = stock !== undefined ? stock : max;

  useEffect(() => {
    if (!disabled) {
      setInternalQuantity(value);
    }
  }, [value, disabled]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (internalQuantity > 1) {
      const newQty = internalQuantity - 1;
      setInternalQuantity(newQty);
      onChange(newQty);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (internalQuantity < maxAllowed) {
      const newQty = internalQuantity + 1;
      setInternalQuantity(newQty);
      onChange(newQty);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);

    if (Number.isNaN(val)) {
       setInternalQuantity(1);
       return;
    }

    if (val < 1) val = 1;
    if (val > maxAllowed) val = maxAllowed;

    setInternalQuantity(val);
  };

  const handleBlur = () => {
    if (!disabled && internalQuantity !== value) {
      onChange(internalQuantity);
    }
  };

  const isInputDisabled = disabled || (stock !== undefined && stock === 0);

  return (
    <div className={`flex items-center gap-3 bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700 ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={disabled || internalQuantity <= 1}
        className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4 text-zinc-300" />
      </button>

      <input
        type="number"
        min={min}
        max={maxAllowed}
        value={internalQuantity}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={isInputDisabled}
        className="text-zinc-100 font-bold text-lg min-w-[3rem] text-center bg-transparent border-none outline-none w-16 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
      />

      <button
        onClick={handleIncrement}
        disabled={disabled || internalQuantity >= maxAllowed}
        className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4 text-zinc-300" />
      </button>
    </div>
  );
}
