import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar o estado do Modo William
 * O Modo William ativa efeitos de confetti e som quando cards são concluídos
 */
export function useWilliamMode() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('williamModeEnabled');
    if (saved !== null) {
      setIsEnabled(saved === 'true');
    }
  }, []);

  const toggle = useCallback(() => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem('williamModeEnabled', String(newValue));
  }, [isEnabled]);

  return {
    isEnabled,
    toggle,
  };
}
