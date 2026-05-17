'use client';

import { motion } from 'framer-motion';

export function AnimatedCard({
  children,
  className = '',
  hoverLift = true,
  onClick,
  as = 'div',
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      whileHover={
        hoverLift
          ? { y: -3, boxShadow: '0 12px 28px -12px rgba(15, 23, 42, 0.18)' }
          : undefined
      }
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
