import { motion } from 'framer-motion';
import { Settings, ShieldCheck, RefreshCw, Layout, UserCog, Zap } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide04AdminCapabilities() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Settings size={14} />
            Admin App
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-10">Key Capabilities</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Operations Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layout size={20} />
                </div>
                <h3 className="text-white font-bold text-lg">Operations</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Menu and item management',
                  'Order approval, cancellation & adjustments',
                  'Table layout & delivery zone configuration',
                  'Real-time order tracking',
                  'Staff role management',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                    <span className="text-white/70 text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Technical Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Zap size={20} />
                </div>
                <h3 className="text-white font-bold text-lg">Technical</h3>
              </div>
              <div className="space-y-4">
                {[
                  { icon: RefreshCw, text: 'Responsive web app (desktop, tablet, mobile)' },
                  { icon: ShieldCheck, text: 'Role-based access and secure login' },
                  { icon: Zap, text: 'Real-time sync with dine-in & delivery apps' },
                  { icon: UserCog, text: 'RESTful API integration' },
                  { icon: Settings, text: 'Customizable dashboard views' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                      <item.icon size={12} />
                    </div>
                    <span className="text-white/70 text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex justify-center"
        >
          <div className="relative max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
            <div className="relative desktop-frame">
              <img
                src="/images/admin-menu-mgmt.png"
                alt="Admin Menu Management"
                className="w-full h-auto"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">04</div>
    </SlideWrapper>
  );
}
