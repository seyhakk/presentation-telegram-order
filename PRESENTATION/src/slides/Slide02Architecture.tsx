import { motion } from 'framer-motion';
import { Cloud, Database, Monitor, Smartphone, Truck, MessageCircle, ArrowDown } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide02Architecture() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-2">System Overview</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">System Architecture</h2>
          <p className="text-white/40 text-lg mb-12">at a Glance</p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="flex flex-col items-center gap-6">
          {/* Top Row - Client Apps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 lg:gap-10"
          >
            {[
              { icon: Smartphone, label: 'Dine‑In App', sub: 'QR Menu & Orders', color: 'border-orange-500/30 bg-orange-500/5', iconColor: 'text-orange-400' },
              { icon: Truck, label: 'Delivery App', sub: 'Location & Telegram', color: 'border-emerald-500/30 bg-emerald-500/5', iconColor: 'text-emerald-400' },
              { icon: Monitor, label: 'Admin App', sub: 'Dashboard & Control', color: 'border-blue-500/30 bg-blue-500/5', iconColor: 'text-blue-400' },
            ].map((app, i) => (
              <div key={i} className={`flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border ${app.color} min-w-[160px]`}>
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${app.iconColor}`}>
                  <app.icon size={24} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{app.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{app.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Arrows down */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-white/20"
          >
            <ArrowDown size={20} />
            <span className="text-xs uppercase tracking-wider">REST APIs & WebSockets</span>
            <ArrowDown size={20} />
          </motion.div>

          {/* Middle - Backend */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-2xl"
          >
            <div className="relative rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 rounded-full text-white text-xs font-semibold">
                Cloud Backend
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-2">
                <div className="flex items-center gap-3">
                  <Cloud size={20} className="text-indigo-400" />
                  <div>
                    <p className="text-white text-sm font-medium">API Layer</p>
                    <p className="text-white/40 text-xs">Serverless Functions</p>
                  </div>
                </div>
                <div className="w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-indigo-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Database</p>
                    <p className="text-white/40 text-xs">Menus, Orders, Customers</p>
                  </div>
                </div>
                <div className="w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-indigo-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Telegram Bot</p>
                    <p className="text-white/40 text-xs">Notifications & Chat</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Connection lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-2 text-white/20"
          >
            <ArrowDown size={20} />
            <span className="text-xs uppercase tracking-wider">Real-time Sync</span>
            <ArrowDown size={20} />
          </motion.div>

          {/* Bottom - Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {[
              { label: 'Kitchen Display', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
              { label: 'Telegram Notifications', color: 'border-sky-500/30 bg-sky-500/5 text-sky-400' },
              { label: 'Analytics & Reports', color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
            ].map((item, i) => (
              <div key={i} className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${item.color}`}>
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Key points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-6 mt-10"
        >
          {[
            'Cloud-hosted web apps',
            'Shared backend & database',
            'Telegram real-time notifications',
          ].map((point, i) => (
            <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {point}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">02</div>
    </SlideWrapper>
  );
}
