import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, MessageCircle, ArrowRight, Truck } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide07DeliveryFlow() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Truck size={14} />
            Delivery App
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            From Location to <span className="text-gradient-green">Telegram</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Seamless delivery ordering with map-based location and Telegram-powered communication
          </p>
        </motion.div>

        {/* Flow Steps */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-4 mb-10">
          {[
            { icon: ShoppingBag, step: '1', title: 'Browse & Order', desc: 'Open web app, browse menu', color: 'from-emerald-500 to-teal-500' },
            { icon: MapPin, step: '2', title: 'Drop Location', desc: 'Pin location on map', color: 'from-teal-500 to-cyan-500' },
            { icon: MessageCircle, step: '3', title: 'Confirm via Telegram', desc: 'Contact & track via Telegram', color: 'from-cyan-500 to-blue-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-4"
            >
              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.color} rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition`} />
                <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 text-center min-w-[180px]">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <item.icon size={24} className="text-white" />
                  </div>
                  <div className="text-xs text-white/30 font-mono mb-1">Step {item.step}</div>
                  <h3 className="text-white font-bold">{item.title}</h3>
                  <p className="text-white/40 text-xs mt-1">{item.desc}</p>
                </div>
              </div>
              {i < 2 && (
                <ArrowRight size={20} className="text-white/20 hidden lg:block flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
            <div className="relative phone-frame w-[220px] sm:w-[260px]">
              <img
                src="/images/delivery-app.png"
                alt="Delivery App"
                className="w-full h-auto"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur text-white text-xs font-medium shadow-lg whitespace-nowrap"
            >
              deliver-deploy.vercel.app
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">07</div>
    </SlideWrapper>
  );
}
