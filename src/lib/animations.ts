import { Variants } from 'framer-motion';

// Animation duration constants
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// Animation easing functions
export const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  sharp: [0.4, 0.0, 0.6, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

export const pageTransition = {
  type: 'tween' as const,
  ease: EASING.easeInOut,
  duration: ANIMATION_DURATION.normal,
};

// Card animations
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
};

// Button animations
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
};

// Modal animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
    },
  },
};

// Bottom sheet animations
export const bottomSheetVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
};

// List animations
export const listVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

// Swipe animations for decision interface
export const swipeVariants: Variants = {
  rest: {
    x: 0,
    rotate: 0,
  },
  swipeLeft: {
    x: -300,
    rotate: -10,
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
  swipeRight: {
    x: 300,
    rotate: 10,
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
  swipeUp: {
    y: -200,
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
};

// Loading animations
export const loadingVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: EASING.easeInOut,
    },
  },
};

// Skeleton loading animations
export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: EASING.easeInOut,
    },
  },
};

// Notification animations
export const notificationVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
};

// Progress bar animations
export const progressVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: {
    width: '100%',
    transition: {
      duration: ANIMATION_DURATION.slow,
      ease: EASING.easeOut,
    },
  },
};

// Floating action button animations
export const fabVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
};

// Search interface animations
export const searchVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

// Filter chip animations
export const filterChipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeIn,
    },
  },
};

// Stagger animation utilities
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

// Utility functions for common animations
export const createSlideInAnimation = (
  direction: 'left' | 'right' | 'up' | 'down'
) => {
  const directions = {
    left: { x: -100, opacity: 0 },
    right: { x: 100, opacity: 0 },
    up: { y: -100, opacity: 0 },
    down: { y: 100, opacity: 0 },
  };

  return {
    initial: directions[direction],
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.easeOut,
      },
    },
    exit: {
      ...directions[direction],
      transition: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.easeIn,
      },
    },
  };
};

export const createFadeInAnimation = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      delay,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeIn,
    },
  },
});

export const createScaleAnimation = (scale = 1.05) => ({
  hover: {
    scale,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut,
    },
  },
});

// Animation presets for common components
export const ANIMATION_PRESETS = {
  page: {
    variants: pageVariants,
    transition: pageTransition,
  },
  card: {
    variants: cardVariants,
    initial: 'hidden',
    animate: 'visible',
    whileHover: 'hover',
    whileTap: 'tap',
  },
  button: {
    variants: buttonVariants,
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
  },
  modal: {
    variants: modalVariants,
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
  },
  bottomSheet: {
    variants: bottomSheetVariants,
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
  },
  list: {
    container: listVariants,
    item: listItemVariants,
  },
  swipe: {
    variants: swipeVariants,
    initial: 'rest',
    animate: 'rest',
  },
  loading: {
    variants: loadingVariants,
    animate: 'animate',
  },
  skeleton: {
    variants: skeletonVariants,
    animate: 'animate',
  },
} as const;
