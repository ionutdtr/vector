import { Easing } from 'react-native-reanimated';

/**
 * One motion signature for the whole app — every press, sheet, scrub-snap,
 * count-up and chart draw-in shares these constants, so the interface feels
 * tuned by a single hand ("the feel of the machine").
 */

/** The one press spring. Crisp, slightly stiff — reads as responsive hardware. */
export const springPress = { stiffness: 320, damping: 24, mass: 0.6 } as const;

/** Every pressable scales to exactly this. Never 0.98, never 0.95. */
export const PRESS_SCALE = 0.97;

/** Value settle — hero count-up, number arrivals. */
export const timingValue = { duration: 900, easing: Easing.out(Easing.cubic) } as const;

/** Chart + glidepath draw-in. */
export const timingDraw = { duration: 1000, easing: Easing.out(Easing.cubic) } as const;

/** Scrubber snap-back, quick settles. */
export const timingSnap = { duration: 350, easing: Easing.out(Easing.cubic) } as const;
