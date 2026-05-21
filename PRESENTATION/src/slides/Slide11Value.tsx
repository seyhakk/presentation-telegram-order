import { motion } from 'framer-motion';
import { Clock, ShieldCheck, DollarSign, Heart, TrendingUp, Star } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide11Value() {
  const benefits = [
    {
      icon: Clock,
      title: 'Faster Table Turnover',
      desc: 'Reduced waiting time means more customers served per shift',
      metric: '40%',
      metricLabel: 'faster service',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: ShieldCheck,
      title: 'Fewer Order Errors',
      desc: 'Digital ordering eliminates miscommunication and reduces staff pressure',
      metric: '95%',
      metricLabel: 'accuracy rate',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: DollarSign,
      title: 'No Marketplace Fees',
      desc: 'Direct delivery channel without third-party commissions',
      metric: '0%',
      metricLabel: 'commission',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Heart,
      title: 'Own Your Customers',
      desc: 'First-party data and direct relationship via Telegram',
      metric: '100%',
      metricLabel: 'data ownership',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <SlideWrapper bg="bg-gray-950">
      {/* Faded background image */}
      <div className="absolute inset-0 opacity-5">
        <img src="/images/dinein-app.png" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-950" />

      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Star size={14} />
            Value Proposition
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Why Restaurants Choose<br /><span className="text-gradient">This Platform</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 h-full hover:bg-white/8 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <item.icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className={`font-bold text-xl bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.metric}
                  </span>
                  <span className="text-white/30 text-sm">{item.metricLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">11</div>
    </SlideWrapper>
  );
}
