'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Mascot, { type MascotColor, type MascotShape } from '@/components/Mascot';
import { TEAMS, type TeamSpec } from '@/lib/teams';

interface TeamPickerModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (team: TeamSpec) => Promise<string | null>;
  takenNames?: string[];
}

export default function TeamPickerModal({ open, onClose, onImport, takenNames = [] }: TeamPickerModalProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setError(null);
      setSaving(null);
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const importTeam = async (team: TeamSpec) => {
    if (saving) return;
    // Skip teams whose lead name is already taken — keeps @mentions unambiguous.
    const clash = team.members.find((m) => takenNames.some((t) => t.toLowerCase() === m.name.toLowerCase()));
    if (clash) {
      setError(`"${clash.name}" is already one of your bots — rename it first, then import.`);
      return;
    }
    setSaving(team.id);
    setError(null);
    const err = await onImport(team);
    setSaving(null);
    if (err) setError(err);
    else onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Start a team"
          >
            <div className="p-5">
              <h3 className="font-brico text-lg font-bold text-navy">Start a team</h3>
              <p className="mt-1 text-sm text-heroslate">
                Hire a whole crew in one click. Every team arrives with its own lead.
              </p>
              <div className="mt-4 space-y-2.5">
                {TEAMS.map((team) => (
                  <div key={team.id} className="rounded-2xl border border-navy/10 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-navy">{team.name}</p>
                        <p className="text-xs text-heroslate">{team.blurb}</p>
                      </div>
                      <button
                        onClick={() => void importTeam(team)}
                        disabled={saving !== null}
                        className="shrink-0 rounded-full bg-cta px-4 py-2 text-xs font-bold text-white hover:bg-ctahover disabled:opacity-50"
                      >
                        {saving === team.id ? 'Hiring…' : 'Hire team'}
                      </button>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {team.members.map((m) => (
                        <div key={m.name} className="flex items-center gap-2.5">
                          <Mascot color={m.color as MascotColor} shape={m.shape as MascotShape} size="xs" motion="none" className="shrink-0" />
                          <p className="min-w-0 flex-1 truncate text-sm text-navy">
                            <span className="font-bold">{m.name}</span>
                            <span className="text-heroslate"> · {m.role}</span>
                          </p>
                          {m.lead && (
                            <span title="Team lead" className="grid shrink-0 place-items-center">
                              <Star className="h-3.5 w-3.5 fill-bamber text-bamber" strokeWidth={2} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {error && (
                <p className="mt-3 text-sm font-medium text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-heroslate hover:bg-ice"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      );
}
