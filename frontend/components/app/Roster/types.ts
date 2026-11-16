'use client';

import type { MascotColor, MascotShape } from '@/components/Mascot';

export interface RosterBot {
  id: string;
  model?: string | null;
  name: string;
  role: string;
  color: MascotColor;
  shape: MascotShape;
  isChiefOfStaff?: boolean;
}

export interface RosterItemType {
  bot: RosterBot;
  index: number;
}
