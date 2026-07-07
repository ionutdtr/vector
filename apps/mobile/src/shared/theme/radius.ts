/**
 * Corner-radius ladder — the JS mirror of the tailwind `borderRadius` tokens,
 * for inline/native styles that can't reach a className. Keep in sync with
 * tailwind.config.js. `chip` is the one extra step: mini-cards and message
 * bubbles want a radius between md and lg so they read as smaller siblings of
 * the 24px card, never as scaled-down clones.
 */
export const radius = {
  sm: 10,
  md: 16,
  chip: 20,
  lg: 22,
  card: 24,
  pill: 999,
} as const;
