import { motion } from 'framer-motion';
import { Code2, Server, Database, MessageCircle, Globe, Zap, Shield, Layers } from 'lucide-react';
import SlideWrapper from '../components/SlideWrapper';

export default function Slide10TechStack() {
  const stack = [
    {
      icon: Code2,
      title: 'Frontend',
      color: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-500/30',
      items: ['React / Next.js', 'Tailwind CSS', 'TypeScript', 'Deployed on Vercel'],
    },
    {
      icon: Server,
      title: 'Backend',
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      items: ['API Layer', 'Serverless Functions', 'Business Logic', 'Telegram Integration'],
    },
    {
      icon: Database,
      title: 'Database',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      items: ['Relational DB', 'Menus & Orders', 'Tables & Customers', 'Analytics Data'],
    },
    {
      icon: MessageCircle,
      title: 'Integrations',
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      items: ['Telegram Bot API', 'Webhooks', 'Real-time Messaging', 'Location Services'],
    },
  ];

  return (
    <SlideWrapper bg="bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Code pattern background */}
      <div className="absolute inset-0 opacity-3 font-mono text-white/5 text-xs overflow-hidden leading-relaxed p-8 select-none">
        {`const app = createApp();\napp.use(telegram);\napp.use(database);\napp.listen(3000);\n`.repeat(30)}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers size={14} />
            Technology
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Modern, Scalable<br /><span className="text-gradient-blue">Tech Stack</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stack.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="group"
            >
              <div className={`relative h-full rounded-2xl border ${item.borderColor} bg-white/5 p-6 hover:bg-white/8 transition-all`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <item.icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-4">{item.title}</h3>
                <ul className="space-y-2.5">
                  {item.items.map((text, j) => (
                    <li key={j} className="flex items-center gap-2 text-white/50 text-sm">
                      <div className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-3 mt-10"
        >
          {[
            { icon: Globe, label: 'PWA Ready' },
            { icon: Zap, label: 'Edge Deployed' },
            { icon: Shield, label: 'SSL Secured' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium">
              <badge.icon size={12} />
              {badge.label}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-8 text-white/20 text-sm font-mono">10</div>
    </SlideWrapper>
  );
}
