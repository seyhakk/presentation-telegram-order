import { motion } from 'framer-motion';
import { Database, BarChart3, UtensilsCrossed, Truck, ArrowDown, TrendingUp, Users, PieChart } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide09UnifiedData() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Database size={14} />
            Data & Analytics
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            One Database,<br /><span className="text-gradient">Complete Insight</span>
          </h2>
        </motion.div>

        {/* Flow Diagram */}
        <div className="flex flex-col items-center gap-6">
          {/* Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
              <UtensilsCrossed size={20} className="text-orange-400" />
              <div>
                <p className="text-white font-semibold text-sm">Dine‑In Orders</p>
                <p className="text-white/40 text-xs">Table orders via QR</p>
              </div>
            </div>
            <div className="text-white/20 flex items-center text-2xl font-light">+</div>
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <Truck size={20} className="text-emerald-400" />
              <div>
                <p className="text-white font-semibold text-sm">Delivery Orders</p>
                <p className="text-white/40 text-xs">Telegram delivery flow</p>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <ArrowDown size={24} className="text-white/20" />
          </motion.div>

          {/* Central Database */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
            <div className="relative px-10 py-6 rounded-2xl border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-center gap-3">
                <Database size={28} className="text-purple-400" />
                <div>
                  <p className="text-white font-bold text-lg">Central Database</p>
                  <p className="text-white/40 text-sm">Menus • Orders • Customers • Analytics</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <ArrowDown size={24} className="text-white/20" />
          </motion.div>

          {/* Outputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {[
              { icon: BarChart3, label: 'Analytics & Reports', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
              { icon: TrendingUp, label: 'Revenue Tracking', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
              { icon: Users, label: 'CRM & History', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
              { icon: PieChart, label: 'Promotions', color: 'border-pink-500/30 bg-pink-500/5 text-pink-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${item.color}`}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Key points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap justify-center gap-8 mt-12"
        >
          {[
            'Unified reporting across all channels',
            'Foundation for CRM & customer history',
            'Data-driven promotion strategies',
          ].map((point, i) => (
            <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {point}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">09</div>
    </SlideWrapper>
  );
}
