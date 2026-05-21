import { motion } from 'framer-motion';
import { QrCode, UtensilsCrossed, ShoppingCart, ArrowRight } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide05DineInFlow() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <UtensilsCrossed size={14} />
            Dine-In App
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Scan, Order, <span className="text-gradient-orange">Relax</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Customer scans QR code on the table, opens live menu, and places order instantly
          </p>
        </motion.div>

        {/* Flow Steps */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-4 mb-10">
          {[
            { icon: QrCode, step: '1', title: 'Scan QR', desc: 'Customer scans table QR code', color: 'from-orange-500 to-amber-500' },
            { icon: UtensilsCrossed, step: '2', title: 'Browse Menu', desc: 'View items & customizations', color: 'from-red-500 to-orange-500' },
            { icon: ShoppingCart, step: '3', title: 'Place Order', desc: 'Confirm & send to kitchen', color: 'from-pink-500 to-red-500' },
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
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />
            <div className="relative phone-frame w-[220px] sm:w-[260px]">
              <img
                src="/images/dinein-app.png"
                alt="Dine-In App"
                className="w-full h-auto"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-orange-600/90 backdrop-blur text-white text-xs font-medium shadow-lg whitespace-nowrap"
            >
              mini-app-plum-ten.vercel.app
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">05</div>
    </SlideWrapper>
  );
}
