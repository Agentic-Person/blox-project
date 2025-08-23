// Framer Motion animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" }
}

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
}

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
}

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
}

export const slideLeft = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
}

export const slideRight = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
}

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
}

export const scale = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
}

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(54, 176, 217, 0.5)",
      "0 0 40px rgba(54, 176, 217, 0.8)",
      "0 0 20px rgba(54, 176, 217, 0.5)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const tealGlow = {
  initial: { filter: "drop-shadow(0 0 10px rgba(54, 176, 217, 0.3))" },
  animate: { 
    filter: [
      "drop-shadow(0 0 10px rgba(54, 176, 217, 0.3))",
      "drop-shadow(0 0 20px rgba(54, 176, 217, 0.6))",
      "drop-shadow(0 0 10px rgba(54, 176, 217, 0.3))"
    ]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

export const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
}

export const buttonTap = {
  scale: 0.98,
}