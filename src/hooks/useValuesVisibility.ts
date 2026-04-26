import { useEffect, useState, useCallback } from 'react';
import { getStoredValuesVisible, setStoredValuesVisible } from '@/components/dashboard/FinancialCards';

/**
 * Evento global disparado sempre que a visibilidade de valores monetarios muda
 * (acionado pelo botao olhinho do appbar ou por qualquer pagina). Permite que
 * todas as paginas/components que mostram valores reajam imediatamente sem
 * recarregar a tela.
 */
export const VALUES_VISIBILITY_EVENT = 'ativa:values-visibility-changed';

export function dispatchValuesVisibilityEvent(visible: boolean) {
  try {
    window.dispatchEvent(new CustomEvent(VALUES_VISIBILITY_EVENT, { detail: { visible } }));
  } catch {}
}

/**
 * Hook compartilhado para visibilidade de valores monetarios.
 * Usar em todas as paginas/componentes que precisam ocultar/exibir R$.
 *
 * Estado e persistencia:
 *  - Lido do localStorage em FinancialCards (chave 'primecamp_dashboard_values_visible').
 *  - Sincronizado entre abas via 'storage' event.
 *  - Sincronizado dentro da mesma aba via CustomEvent VALUES_VISIBILITY_EVENT.
 */
export function useValuesVisibility(): [boolean, (v: boolean) => void] {
  const [visible, setVisibleState] = useState<boolean>(() => getStoredValuesVisible());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ visible: boolean }>;
      const v = ce?.detail?.visible;
      if (typeof v === 'boolean') {
        setVisibleState(v);
      } else {
        setVisibleState(getStoredValuesVisible());
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'primecamp_dashboard_values_visible') {
        setVisibleState(getStoredValuesVisible());
      }
    };
    window.addEventListener(VALUES_VISIBILITY_EVENT, onCustom as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(VALUES_VISIBILITY_EVENT, onCustom as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setVisible = useCallback((v: boolean) => {
    // setStoredValuesVisible ja dispara o evento global (em FinancialCards.tsx),
    // que sera capturado pelo listener acima e atualizara setVisibleState em todas
    // as instancias do hook (inclusive nesta).
    setStoredValuesVisible(v);
  }, []);

  return [visible, setVisible];
}
