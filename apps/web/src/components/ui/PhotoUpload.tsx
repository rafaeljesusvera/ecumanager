'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';
import {
  CameraIcon,
  XIcon,
  SpinnerIcon,
} from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@equmanager/auth/client';

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'equmanager';

export function PhotoUpload({
  name = 'photoUrl',
  defaultValue,
  folder,
  label = 'Foto',
  aspect = 'square',
}: {
  name?: string;
  defaultValue?: string | null;
  /** Carpeta dentro del bucket: ej. "horses", "riders". */
  folder: string;
  label?: string;
  aspect?: 'square' | 'wide';
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(defaultValue ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${folder}/${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url ?? ''} />
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600">
        {label}
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 transition hover:border-brand-400 ${
          aspect === 'wide' ? 'aspect-[16/9]' : 'aspect-square'
        }`}
      >
        {url ? (
          <>
            <Image
              src={url}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setUrl(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-red-600"
              aria-label="Quitar foto"
            >
              <XIcon size={14} weight="bold" />
            </button>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 text-stone-500 hover:text-brand-700"
          >
            {busy ? (
              <>
                <SpinnerIcon
                  size={26}
                  weight="bold"
                  className="animate-spin text-brand-600"
                />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Subiendo…
                </span>
              </>
            ) : (
              <>
                <CameraIcon size={26} weight="duotone" />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Toca para subir
                </span>
                <span className="text-[10px] font-medium text-stone-400">
                  PNG · JPG · WEBP · max 10 MB
                </span>
              </>
            )}
          </label>
        )}
      </div>

      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
        disabled={busy}
      />

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
