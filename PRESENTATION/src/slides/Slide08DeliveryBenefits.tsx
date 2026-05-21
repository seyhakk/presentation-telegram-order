import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Globe, Send, Shield } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide08DeliveryBenefits() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <MessageCircle size={14} />
            Delivery App
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Telegram‑Native<br /><span className="text-gradient-green">Delivery</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 mt-10">
          {/* Left - Benefits */}
          <div className="space-y-5">
            {[
              { icon: MessageCircle, title: 'Telegram for everything', desc: 'Chat, status updates, and order confirmations — all through Telegram', color: 'bg-emerald-500/10 text-emerald-400' },
              { icon: MapPin, title: 'Location sharing', desc: 'Order details and delivery location shared directly via Telegram', color: 'bg-teal-500/10 text-teal-400' },
              { icon: Globe, title: 'Perfect for Telegram markets', desc: 'Ideal for regions with strong Telegram adoption and usage', color: 'bg-cyan-500/10 text-cyan-400' },
              { icon: Shield, title: 'No third-party fees', desc: 'Direct customer-restaurant channel without marketplace commissions', color: 'bg-blue-500/10 text-blue-400' },
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

          {/* Right - Telegram Chat Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-4 bg-gradient-to-b from-emerald-500/15 to-blue-500/15 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-gray-900 overflow-hidden">
                {/* Telegram Header */}
                <div className="bg-sky-600 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Send size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Restaurant Bot</p>
                    <p className="text-white/70 text-xs">online</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 min-h-[300px]">
                  {/* Bot message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-2"
                  >
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[260px]">
                      <p className="text-white/80 text-sm">🛒 New order received!</p>
                      <p className="text-white/50 text-xs mt-1">
                        2x Burger, 1x Pizza<br />
                        📍 Location shared<br />
                        💰 Total: $35.50
                      </p>
                      <p className="text-white/30 text-xs mt-2 text-right">14:32</p>
                    </div>
                  </motion.div>

                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex justify-end"
                  >
                    <div className="bg-sky-600/50 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[260px]">
                      <p className="text-white/90 text-sm">✅ Order confirmed! Preparing now.</p>
                      <p className="text-white/30 text-xs mt-2 text-right">14:33</p>
                    </div>
                  </motion.div>

                  {/* Bot message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex gap-2"
                  >
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[260px]">
                      <p className="text-white/80 text-sm">🚗 Out for delivery!</p>
                      <p className="text-white/50 text-xs mt-1">Estimated: 25 mins</p>
                      <p className="text-white/30 text-xs mt-2 text-right">14:50</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">08</div>
    </SlideWrapper>
  );
}
