import { Variants, Transition } from 'framer-motion';

// Consistent animation durations and easing
export const ANIMATION_DURATIONS = {
  fast: 0.16,
  normal: 0.26,
  slow: 0.42,
  slower: 0.6,
} as const;

export const ANIMATION_EASING = {
  easeOut: [0.22, 1, 0.36, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bouncy: [0.34, 1.56, 0.64, 1],
  smooth: [0.22, 1, 0.36, 1],
} as const;

// Common transitions
export const transitions = {
  default: {
    duration: ANIMATION_DURATIONS.normal,
    ease: ANIMATION_EASING.easeOut,
  },
  fast: {
    duration: ANIMATION_DURATIONS.fast,
    ease: ANIMATION_EASING.easeOut,
  },
  smooth: {
    duration: ANIMATION_DURATIONS.normal,
    ease: ANIMATION_EASING.smooth,
  },
  bouncy: {
    duration: ANIMATION_DURATIONS.slow,
    ease: ANIMATION_EASING.bouncy,
  },
} satisfies Record<string, Transition>;

// Common variants for reusable animations
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.fast,
      ease: ANIMATION_EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.fast,
      ease: ANIMATION_EASING.easeOut,
    }
  },
};

// Button interaction animations
export const buttonTapVariants = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
  rest: { scale: 1 },
};

export const buttonPressVariants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.05 },
  rest: { scale: 1 },
};

// Card hover animations
export const cardHoverVariants = {
  hover: { 
    y: -2,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: transitions.smooth,
  },
  rest: { 
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: transitions.smooth,
  },
};

// Modal animations
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.normal,
      ease: ANIMATION_EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATIONS.fast,
      ease: ANIMATION_EASING.easeInOut,
    }
  },
};

// Page transition animations
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.slow,
      ease: ANIMATION_EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.fast,
      ease: ANIMATION_EASING.easeInOut,
    }
  },
};
