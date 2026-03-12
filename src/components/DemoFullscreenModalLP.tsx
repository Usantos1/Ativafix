import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/integrations/auth/api-client';
import { DEMO_SESSION_KEY } from '@/utils/demoMode';
import { APP_URL } from '@/pages/landing/constants';

const DEMO_TIMER_SECONDS = 60;

interface DemoFullscreenModalLPProps {
  open: boolean;
  onClose: () => void;
  onAssinar: () => void;
}

export function DemoFullscreenModalLP({ open, onClose, onAssinar }: DemoFullscreenModalLPProps) {
  const [secondsLeft, setSecondsLeft] = useState(DEMO_TIMER_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(DEMO_TIMER_SECONDS);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [open, secondsLeft]);

  useEffect(() => {
    if (open && secondsLeft <= 0) {
      onClose();
    }
  }, [open, secondsLeft, onClose]);

  const handleEntrarDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await authAPI.loginDemo();
      if (response.error) {
        setError(response.error.message || 'Não foi possível entrar na demonstração.');
        return;
      }
      try {
        sessionStorage.setItem(DEMO_SESSION_KEY, '1');
      } catch {}
      const base =
        window.location.hostname === 'ativafix.com' || window.location.hostname === 'www.ativafix.com'
          ? APP_URL
          : window.location.origin;
      window.location.href = `${base}/pdv`;
    } catch (e: any) {
      setError(e?.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timerText = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#00F7A5]/40 bg-[#0B0F0D] shadow-2xl p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-[#F5F7F6]"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center gap-2 text-[#00F7A5]">
            <Sparkles className="w-8 h-8" />
            <span className="text-lg font-semibold text-[#F5F7F6]">Demonstração</span>
          </div>

          <p className="text-base text-[#9AA4A0] leading-relaxed">
            Você está na <strong className="text-[#F5F7F6]">demonstração</strong>. Os dados são de exemplo.
            Para usar com seus dados, faça cadastro ou login.
          </p>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-[#6D7873] uppercase tracking-wider">Tempo restante</span>
            <div
              className="text-3xl font-mono font-bold tabular-nums text-[#F5F7F6] bg-[#07110D] rounded-xl px-6 py-3 min-w-[120px] border border-[#00F7A5]/20"
              aria-live="polite"
            >
              {timerText}
            </div>
            <p className="text-xs text-[#9AA4A0]">
              Após 1 minuto este modal será fechado.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleEntrarDemo}
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-[#00F7A5] hover:bg-[#00C27F] text-[#030504]"
            >
              {loading ? 'Entrando...' : 'Entrar na demonstração'}
            </Button>
            <Button
              onClick={onAssinar}
              variant="outline"
              className="w-full h-12 text-base font-semibold border-[#00F7A5]/40 text-[#F5F7F6] hover:bg-[#00F7A5]/10"
            >
              Assinar Agora
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-11 text-base text-[#9AA4A0] hover:text-[#F5F7F6] hover:bg-white/5"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
