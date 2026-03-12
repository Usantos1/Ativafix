import { motion } from 'framer-motion';
import { Play, FlaskConical } from 'lucide-react';
import { HeroVisualProof } from './HeroVisualProof';

const VALUE_LINE = 'OS • PDV • Estoque • Financeiro • Relatórios • Alertas';

interface LandingHeroProps {
  onOpenDemo?: () => void;
}

export function LandingHero({ onOpenDemo }: LandingHeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 px-4 pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 landing-bg-base landing-bg-grid landing-hero-noise" />
      <div className="absolute inset-0 landing-glow-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,247,165,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07110D]" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center lg:items-start text-center lg:text-left">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#F5F7F6] mb-6"
        >
          A maioria das assistências trabalha no improviso.
          <br />
          <span className="text-[#00F7A5]">As que crescem trabalham com sistema.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-lg sm:text-xl text-[#9AA4A0] mb-4"
        >
          Ordens de serviço organizadas. Estoque controlado. Financeiro claro. Alertas automáticos no WhatsApp.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="text-sm font-medium text-[#6D7873] mb-8"
        >
          {VALUE_LINE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-wrap"
        >
          {onOpenDemo && (
            <motion.button
              type="button"
              onClick={onOpenDemo}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0,247,165,0.35)' }}
              whileTap={{ scale: 0.98 }}
              className="landing-btn landing-btn-primary inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-base border border-[#00F7A5]/40 w-full sm:w-auto"
            >
              <FlaskConical className="w-5 h-5 shrink-0" />
              Experimentar o sistema
            </motion.button>
          )}
          <motion.a
            href="#como-funciona"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="landing-btn landing-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-4 font-semibold text-base text-[#F5F7F6] border border-[#00F7A5]/20 bg-[#0B0F0D]/80 hover:border-[#00F7A5]/40 hover:bg-[#0B0F0D] transition-all duration-300 w-full sm:w-auto"
          >
            <Play className="w-4 h-4 shrink-0" />
            Ver como funciona
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative z-10 w-full max-w-[620px] flex justify-center lg:justify-end"
      >
        <HeroVisualProof />
      </motion.div>
    </section>
  );
}
