'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Pencil, Plug, Receipt, Settings } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { getOrCreateProfile, updateProfileName } from '@/lib/profile';
import SettingsModal from './Settings';
import UsageModal from './UsageModal';

export default function RosterFooter() {
  const { user } = useAuthenticator((c) => [c.user]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchUserAttributes()
      .then((attrs) => {
        if (!alive) return;
        setEmail(attrs?.email ?? user?.signInDetails?.loginId ?? '');
      })
      .catch(() => {
        if (alive) setEmail(user?.signInDetails?.loginId ?? '');
      });
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  // Lazy get-or-create the UserProfile.
  useEffect(() => {
    const ownerId = user?.userId;
    if (!ownerId) return;
    let alive = true;
    void (async () => {
      try {
        const existing = await getOrCreateProfile(ownerId, email).catch(async () => {
          // Email may not have loaded yet — retry once with the login id.
          const fallback = user?.signInDetails?.loginId ?? '';
          return getOrCreateProfile(ownerId, fallback);
        });
        if (!alive) return;
        setProfileId(existing.id);
        setDisplayName(existing.displayName ?? '');
      } catch (err) {
        console.error('[RosterFooter] profile ensure failed:', err);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const saveName = async () => {
    const v = draft.trim();
    setEditing(false);
    if (!v || !profileId || v === displayName) return;
    try {
      await updateProfileName(profileId, v);
      setDisplayName(v);
    } catch (err) {
      console.error('[RosterFooter] name save failed:', err);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const initial = (displayName || email).charAt(0).toUpperCase() || '?';

  return (
    <div className="relative border-t border-navy/10 p-4" ref={menuRef}>
      <p className="mb-2 flex items-center gap-1.5 text-sm text-heroslate">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void saveName()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveName();
              if (e.key === 'Escape') setEditing(false);
            }}
            maxLength={40}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-navy/15 bg-white px-2 py-1 text-sm text-navy outline-none focus:border-cta"
          />
        ) : (
          <>
            {displayName || email || 'Enter your name'}
            <button
              onClick={() => {
                if (!profileId) return;
                setDraft(displayName);
                setEditing(true);
              }}
              aria-label="Set profile name"
              className="hover:text-navy"
            >
              <Pencil className="h-3 w-3" strokeWidth={2} />
            </button>
          </>
        )}
      </p>
      <div className="flex items-center gap-2.5">
        <span className="relative shrink-0">
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                aria-label="Profile menu"
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-1 w-52 overflow-hidden rounded-2xl border border-navy/10 bg-white py-1.5 shadow-xl shadow-navy/10"
              >
                <div className="flex items-center gap-2.5 px-4 pb-2 pt-1.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ice font-bold text-navy">
                    {initial}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-navy">
                      {displayName || email || 'Your profile'}
                    </span>
                    {displayName && email ? (
                      <span className="block truncate text-xs text-heroslate">{email}</span>
                    ) : null}
                  </span>
                </div>
                <div className="mx-4 my-1 border-t border-navy/10" aria-hidden="true" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-navy hover:bg-ice"
                >
                  <Settings className="h-4 w-4" strokeWidth={2.2} />
                  Settings
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setUsageOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-navy hover:bg-ice"
                >
                  <Receipt className="h-4 w-4" strokeWidth={2.2} />
                  Usage
                </button>
                <div className="mx-4 my-1 border-t border-navy/10" aria-hidden="true" />
                <button
                  role="menuitem"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-navy hover:bg-ice"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.2} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Profile menu"
            title={email || 'Profile menu'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white font-bold text-navy shadow-sm hover:bg-slate-50"
          >
            {initial}
          </button>
        </span>
        <button
          disabled
          title="Coming soon"
          className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/60 py-2.5 font-semibold text-navy/50 shadow-sm"
        >
          <Plug className="h-4 w-4" strokeWidth={2.2} />
          Connectors
          <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-ink">Soon</span>
        </button>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UsageModal open={usageOpen} onClose={() => setUsageOpen(false)} ownerId={user?.userId ?? null} />
    </div>
  );
}
