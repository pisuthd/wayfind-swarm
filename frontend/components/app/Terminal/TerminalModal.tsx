'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TerminalSquare, X } from 'lucide-react';
import { useComputer } from '../Roster/useComputer';
import TerminalView, { type TermMeta } from './TerminalView';

interface TerminalModalProps {
  open: boolean;
  onClose: () => void;
  botName: string;
}

export default function TerminalModal({ open, onClose, botName }: TerminalModalProps) {
  const { computer } = useComputer();
  const [mounted, setMounted] = useState(false);
  const [meta, setMeta] = useState<TermMeta>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-navy shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${botName} terminal`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="font-brico text-sm font-semibold text-white">Computer Terminal</p>
              <button
                onClick={onClose}
                aria-label="Close terminal"
                className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 p-2">
              {computer?.endpoint ? (
                <TerminalView
                  key={computer.endpoint}
                  endpoint={computer.endpoint}
                  onMeta={(m) => setMeta((prev) => ({ ...prev, ...m }))}
                />
              ) : (
                <div className="grid h-full place-items-center px-6">
                  <div className="max-w-sm text-center">
                    <TerminalSquare className="mx-auto h-8 w-8 text-white/40" strokeWidth={1.5} />
                    <p className="mt-4 font-brico text-lg font-bold text-white">Computer not ready</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      Start {botName}&apos;s computer first — the terminal connects once it&apos;s running.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5">
              <p className="font-mono text-[11px] text-white/50">
                {['bash', 'Alpine Linux', meta.cols && meta.rows ? `${meta.cols}×${meta.rows}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="text-[11px] text-white/40">Esc to close · idle-kill 10 min</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
