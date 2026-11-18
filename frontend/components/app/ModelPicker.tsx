'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronUp, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProviders } from '@/lib/agent';
import { friendlyModelName } from '@/lib/models';

interface ModelPickerProps {
  /** Bot.model — null = account default. */
  value: string | null;
  onChange: (model: string | null) => void;
  disabled?: boolean;
  /** Slim variant for the utility row under the composer. */
  compact?: boolean;
}

interface Option {
  value: string | null;
  label: string;
}

/** Model pill for the composer bar. Dropdown opens upward, options from the
 * computer's provider catalog plus an account-default entry. */
/** Catalog default when the computer is unreachable (mirrors providers.json). */
const FALLBACK_DEFAULT = 'zai-org/GLM-5.3-Flash';

export default function ModelPicker({ value, onChange, disabled = false, compact = false }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    getProviders()
      .then((s) => {
        if (!alive) return;
        const def = s.defaults?.model ?? FALLBACK_DEFAULT;
        setDefaultId(def);
        const opts: Option[] = [{ value: null, label: `Default · ${friendlyModelName(def)}` }];
        for (const p of Object.values(s.providers ?? {})) {
          for (const m of p.models ?? []) {
            if (opts.some((o) => o.value === m)) continue;
            opts.push({ value: m, label: friendlyModelName(m) });
          }
        }
        // The bot's saved model may predate the catalog — keep it selectable.
        if (value && !opts.some((o) => o.value === value)) {
          opts.push({ value, label: friendlyModelName(value) });
        }
        setOptions(opts);
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Could not load models');
          setDefaultId(FALLBACK_DEFAULT);
          setOptions([{ value: null, label: `Default · ${friendlyModelName(FALLBACK_DEFAULT)}` }]);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // The bot's saved model may predate the catalog — keep it selectable.
  const merged = useMemo(() => {
    if (!options) return null;
    if (value && !options.some((o) => o.value === value)) {
      return [...options, { value, label: friendlyModelName(value) }];
    }
    return options;
  }, [options, value]);

  const currentLabel = value
    ? friendlyModelName(value)
    : defaultId
      ? `Default · ${friendlyModelName(defaultId)}`
      : 'Default';

  return (
    <div className="relative shrink-0">
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-12 left-0 z-50 max-h-72 w-72 overflow-y-auto rounded-2xl border border-navy/10 bg-white p-1.5 shadow-xl"
              role="menu"
              aria-label="Choose model"
            >
              {!merged && !error && (
                <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-heroslate">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
                </p>
              )}
              {error && <p className="px-3 py-2.5 text-sm font-medium text-red-600">{error}</p>}
              {merged?.map((o) => {
                const active = (o.value ?? null) === (value ?? null);
                return (
                  <button
                    key={o.value ?? 'default'}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    role="menuitemradio"
                    aria-checked={active}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-ice"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center">
                      {active && <Check className="h-4 w-4 text-cta" strokeWidth={2.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy" title={o.value ?? undefined}>
                      {o.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={value ? `Model: ${value} — click to change` : 'Model: account default — click to change'}
        disabled={disabled}
        className={`flex max-w-44 items-center gap-1.5 rounded-full bg-slate-100 text-heroslate hover:bg-slate-200 disabled:opacity-50 ${
          compact ? 'h-7 px-2.5' : 'h-10 px-3'
        }`}
      >
        <span className={`truncate font-bold ${compact ? 'text-[11px]' : 'text-xs'}`}>{currentLabel}</span>
        <ChevronUp className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} shrink-0 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}
