import type { TgMessage } from '../types/types';

export const getText = (m: TgMessage) => (m.caption ?? m.text ?? '').trim();

const KINDS = [
  'photo', 'video', 'animation', 'document', 'audio', 'voice', 'video_note',
  'sticker', 'poll', 'contact', 'location', 'venue', 'dice', 'game', 'invoice',
];

export function getKind(m: TgMessage): string {
  if (m.story) return 'story';
  for (const k of KINDS) if (m[k]) return k.replace('_', ' ');
  return 'unknown message type';
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
