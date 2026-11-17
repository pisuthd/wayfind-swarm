'use client';

// Site mode: one build serves both hosts. The hostname decides at runtime:
// anything containing "swarm" (swarm.wayfind.click, localhost dev) is SWARM
// mode (brand "Wayfind SWARM", no Docs link); everything else is the main
// site (brand "Wayfind", Docs link shown).
//
// Runs on the client only (window). During SSR/prerender there is no host,
// so callers must tolerate the swarm default until mount.

export type SiteMode = 'main' | 'swarm';

export function siteMode(hostname?: string): SiteMode {
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase();
  return host.includes('swarm') ? 'swarm' : 'main';
}

export function isMainSite(hostname?: string): boolean {
  return siteMode(hostname) === 'main';
}

export function brandName(hostname?: string): string {
  return brandNameFor(siteMode(hostname));
}

export function brandNameFor(mode: SiteMode): string {
  return mode === 'main' ? 'Wayfind' : 'Wayfind SWARM';
}
