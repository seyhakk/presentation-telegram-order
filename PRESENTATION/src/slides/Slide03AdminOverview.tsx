import { motion } from 'framer-motion';
import { BarChart3, ShoppingBag, DollarSign, Users } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide03AdminOverview() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left content */}
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <BarChart3 size={14} />
                Admin App
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                The Control<br />
                <span className="text-gradient-blue">Center</span>
              </h2>
              <p className="text-white/40 text-lg mb-8 max-w-md">
                Complete dashboard for managing your entire restaurant operation from a single interface.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { icon: ShoppingBag, label: 'Central Order View', desc: 'Monitor dine-in and delivery orders in real-time', color: 'text-blue-400' },
                { icon: DollarSign, label: 'Sales & Reporting', desc: 'Track revenue, performance, and key metrics', color: 'text-emerald-400' },
                { icon: Users, label: 'Menu Management', desc: 'Update menus, prices, and item availability', color: 'text-purple-400' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-white/40 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right - Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex-1 max-w-lg"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl" />
              <div className="relative desktop-frame">
                <img
                  src="/images/admin-dashboard.png"
                  alt="Admin Dashboard"
                  className="w-full h-auto"
                />
              </div>
              {/* Live URL badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-600/90 backdrop-blur text-white text-xs font-medium shadow-lg"
              >
                admin-app-zeta-pink.vercel.app
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">03</div>
    </SlideWrapper>
  );
}
