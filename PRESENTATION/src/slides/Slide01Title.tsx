import { motion } from 'framer-motion';
import { Monitor, Smartphone, Truck } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide01Title() {
  return (
    <SlideWrapper bg="bg-gray-950">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      
      {/* Background image */}
      <div className="absolute inset-0 opacity-10">
        <img src="/images/hero-restaurant.png" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />

      <div className="relative z-10 max-w-6xl mx-auto px-8 flex flex-col lg:flex-row items-center gap-12">
        {/* Left content */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Full-Stack Restaurant Solution
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
          >
            End‑to‑End<br />
            <span className="text-gradient">Restaurant Platform</span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-white/60 font-light mb-8"
          >
            Admin, Dine‑In & Delivery via Telegram
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/40 max-w-lg mx-auto lg:mx-0"
          >
            From table order to delivery — one integrated system
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-start"
          >
            {['Unified platform', 'Three apps', 'Real-time sync'].map((tag, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right side - 3 boxes diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex-shrink-0"
        >
          <div className="flex flex-col gap-4 items-center">
            {[
              { icon: Monitor, label: 'Admin App', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
              { icon: Smartphone, label: 'Dine‑In App', color: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/20' },
              { icon: Truck, label: 'Delivery App', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15 }}
                className="relative"
              >
                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-r ${item.color} shadow-xl ${item.glow} min-w-[220px]`}>
                  <item.icon size={24} className="text-white" />
                  <span className="text-white font-semibold text-lg">{item.label}</span>
                </div>
                {i < 2 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-4 bg-white/20" />
                    <svg className="absolute -bottom-2 left-1/2 -translate-x-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M6 8L0 0H12L6 8Z" fill="rgba(255,255,255,0.2)" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">01</div>
    </SlideWrapper>
  );
}
