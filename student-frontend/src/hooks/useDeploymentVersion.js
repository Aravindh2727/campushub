import { useEffect, useState, useCallback, useRef } from 'react';

export function useDeploymentVersion() {
  const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(false);
  const currentVersionRef = useRef(null);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV) return;

    try {
      const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      
      if (!currentVersionRef.current) {
        currentVersionRef.current = data.version;
      } else if (currentVersionRef.current !== data.version) {
        const lastReload = sessionStorage.getItem('versionReloadAttempted');
        if (lastReload !== data.version) {
          setIsNewVersionAvailable(true);
          sessionStorage.setItem('targetReloadVersion', data.version);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkVersion]);

  const performUpdate = useCallback(() => {
    const target = sessionStorage.getItem('targetReloadVersion');
    if (target) {
      sessionStorage.setItem('versionReloadAttempted', target);
    }
    window.location.reload();
  }, []);

  return { isNewVersionAvailable, performUpdate };
}
