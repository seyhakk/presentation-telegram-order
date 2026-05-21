import { motion } from 'framer-motion';
import { Smartphone, QrCode, ChefHat, Receipt, Zap, Globe, RefreshCw, Clock } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide06DineInTechnical() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap size={14} />
            Dine-In App
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Built for Speed<br /><span className="text-gradient-orange">& Accuracy</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 mt-10">
          {/* Left - Benefits */}
          <div className="space-y-5">
            {[
              { icon: Globe, title: 'No installation needed', desc: 'Runs entirely in the browser — zero friction for customers', color: 'bg-orange-500/10 text-orange-400' },
              { icon: QrCode, title: 'QR-encoded table ID', desc: 'Each QR code carries the table identifier for accurate order routing', color: 'bg-amber-500/10 text-amber-400' },
              { icon: RefreshCw, title: 'Instant menu updates', desc: 'Changes in admin reflect instantly across all tables', color: 'bg-red-500/10 text-red-400' },
              { icon: Clock, title: 'Reduced wait times', desc: 'Eliminates order errors and speeds up the entire process', color: 'bg-pink-500/10 text-pink-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/40 text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right - Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              {/* Flow graphic: QR → Phone → Kitchen → Bill */}
              <div className="flex flex-col items-center gap-3">
                {[
                  { icon: QrCode, label: 'QR Code', color: 'from-orange-500 to-amber-500' },
                  { icon: Smartphone, label: 'Customer Phone', color: 'from-red-500 to-orange-500' },
                  { icon: ChefHat, label: 'Kitchen', color: 'from-pink-500 to-red-500' },
                  { icon: Receipt, label: 'Bill', color: 'from-purple-500 to-pink-500' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center shadow-xl`}>
                      <item.icon size={32} className="text-white" />
                    </div>
                    <p className="text-white/60 text-sm font-medium mt-2">{item.label}</p>
                    {i < 3 && (
                      <div className="flex flex-col items-center py-1">
                        <div className="w-0.5 h-4 bg-white/20" />
                        <div className="w-2 h-2 border-b border-r border-white/20 rotate-45 -mt-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Glow */}
              <div className="absolute -inset-8 bg-gradient-to-b from-orange-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">06</div>
    </SlideWrapper>
  );
}
