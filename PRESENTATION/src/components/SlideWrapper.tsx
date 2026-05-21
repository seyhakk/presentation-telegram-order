import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SlideWrapperProps {
  children: ReactNode;
  className?: string;
  bg?: string;
}

export default function SlideWrapper({ children, className = '', bg = 'bg-gray-950' }: SlideWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full h-screen flex items-center justify-center ${bg} overflow-hidden relative ${className}`}
    >
      {children}
    </motion.div>
  );
}
