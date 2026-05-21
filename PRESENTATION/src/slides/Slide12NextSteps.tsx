import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, ArrowRight, ExternalLink, Monitor, Smartphone, Truck } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide12NextSteps() {
  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 w-full text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Rocket size={14} />
            Next Steps
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to <span className="text-gradient">Get Started?</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
            Three simple steps to transform your restaurant operations
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { step: '01', title: 'Pilot Launch', desc: 'Start with one branch for dine-in and delivery', icon: Rocket },
            { step: '02', title: 'Customize', desc: 'Set up menu, branding, and Telegram bot', icon: CheckCircle2 },
            { step: '03', title: 'Expand', desc: 'Add loyalty, promo codes, and multi-branch', icon: ArrowRight },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-300" />
                <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 h-full hover:border-white/20 transition-all">
                  <div className="text-3xl font-bold text-white/10 font-mono mb-3">{item.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                    <item.icon size={20} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/40 text-sm">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-10"
        >
          <p className="text-white/30 text-sm uppercase tracking-wider mb-4">Live Demo Links</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Monitor, label: 'Admin App', url: 'https://admin-app-zeta-pink.vercel.app/', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' },
              { icon: Smartphone, label: 'Dine-In App', url: 'https://mini-app-plum-ten.vercel.app/', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20' },
              { icon: Truck, label: 'Delivery App', url: 'https://deliver-deploy.vercel.app/', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' },
            ].map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${link.color} text-sm font-medium transition-all`}
              >
                <link.icon size={16} />
                {link.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-8 py-5 shadow-2xl">
              <p className="text-white font-bold text-lg mb-1">📞 Book a Live Demo</p>
              <p className="text-white/70 text-sm">Using your own menu and Telegram account</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">12</div>
    </SlideWrapper>
  );
}
