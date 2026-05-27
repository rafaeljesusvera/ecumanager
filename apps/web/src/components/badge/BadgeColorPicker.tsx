'use client';

import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr';

const PRESETS = [
  { name: 'Verde', value: '#3f8649' },
  { name: 'Esmeralda', value: '#2c8a6e' },
  { name: 'Turquesa', value: '#1f9aa8' },
  { name: 'Azul', value: '#2f6fd0' },
  { name: 'Índigo', value: '#5b4ed1' },
  { name: 'Violeta', value: '#8a3fd1' },
  { name: 'Rosa', value: '#d93b85' },
  { name: 'Rojo', value: '#d93b3b' },
  { name: 'Naranja', value: '#dd8410' },
  { name: 'Ámbar', value: '#c89010' },
  { name: 'Carbón', value: '#1f2937' },
];

export function BadgeColorPicker({
  name = 'color',
  defaultValue = '#3f8649',
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  function pick(color: string) {
    setValue(color);
    onChange?.(color);
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600">
        Color de la carta
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => pick(p.value)}
            title={p.name}
            className="relative h-9 w-9 rounded-full ring-2 ring-stone-200 transition hover:scale-110"
            style={{ backgroundColor: p.value }}
          >
            {value === p.value && (
              <span className="absolute inset-0 flex items-center justify-center text-white">
                <CheckIcon size={14} weight="bold" />
              </span>
            )}
          </button>
        ))}
        <label
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ring-2 ring-dashed ring-stone-300 text-[10px] font-bold text-stone-600 hover:ring-brand-400"
          title="Color libre"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => pick(e.target.value)}
            className="sr-only"
          />
          +
        </label>
      </div>
    </div>
  );
}
