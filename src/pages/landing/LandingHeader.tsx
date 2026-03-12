import { motion } from 'framer-motion';
import { LogIn, FlaskConical } from 'lucide-react';
import { APP_URL } from './constants';

interface LandingHeaderProps {
  onOpenDemo?: () => void;
}

export function LandingHeader({ onOpenDemo }: LandingHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 md:h-18 flex items-center px-4 md:px-8 border-b border-[#00F7A5]/10 bg-[#030504]/90 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
        <motion.img
          src="/logo-ativafix.png"
          alt="Ativa FIX"
          className="h-8 md:h-9 w-auto object-contain"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        />
        <div className="flex items-center gap-2">
          {onOpenDemo && (
            <motion.button
              type="button"
              onClick={onOpenDemo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="landing-btn landing-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-[#00F7A5]/20 bg-[#0B0F0D]/80 hover:border-[#00F7A5]/40 transition-all duration-300"
            >
              <FlaskConical className="w-4 h-4" />
              Experimentar
            </motion.button>
          )}
          <motion.a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="landing-btn landing-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-[#00F7A5]/40 transition-all duration-300"
          >
            <LogIn className="w-4 h-4" />
            Acessar o sistema
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}
