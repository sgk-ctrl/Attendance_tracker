import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

export function useNavGuard(shouldBlock) {
  // beforeunload handler
  useEffect(() => {
    function handler(e) {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldBlock]);

  // React Router blocker
  const blocker = useBlocker(
    useCallback(({ currentLocation, nextLocation }) => {
      return shouldBlock && currentLocation.pathname !== nextLocation.pathname;
    }, [shouldBlock])
  );

  return blocker;
}
