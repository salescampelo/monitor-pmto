import { useEffect, useRef, useState } from 'react';

export function useAutoRefresh(callback, intervalMinutes = 30) {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefresh');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('autoRefresh', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const doRefresh = async () => {
      console.log('[AutoRefresh] Atualizando dados...');
      await callback();
      setLastRefresh(new Date());
    };

    // Refresh inicial após 1 minuto (dar tempo do carregamento inicial)
    const initialTimeout = setTimeout(() => {
      doRefresh();
      // Depois, a cada intervalMinutes
      intervalRef.current = setInterval(doRefresh, intervalMinutes * 60 * 1000);
    }, 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, callback, intervalMinutes]);

  return { enabled, setEnabled, lastRefresh };
}
