import React, { useEffect } from 'react';
import { useDeploymentVersion } from '../../hooks/useDeploymentVersion';
import { appState } from '../../lib/appState';

export function DeploymentUpdateBanner() {
  const { isNewVersionAvailable, performUpdate } = useDeploymentVersion();

  useEffect(() => {
    if (isNewVersionAvailable) {
      // Using an interval to constantly check if the app becomes safe to update
      const checkSafeInterval = setInterval(() => {
        if (appState.isSafeToUpdate()) {
          clearInterval(checkSafeInterval);
          performUpdate();
        }
      }, 1000);
      
      return () => clearInterval(checkSafeInterval);
    }
  }, [isNewVersionAvailable, performUpdate]);

  const handleManualUpdate = () => {
    if (!appState.isSafeToUpdate()) {
      alert("You have unsaved changes. Please save them before updating.");
      return;
    }
    performUpdate();
  };

  if (!isNewVersionAvailable) return null;
  if (appState.isSafeToUpdate()) return null; // It's reloading

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-indigo-600 text-white px-4 py-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top">
      <div className="flex items-center gap-2">
        <span className="font-bold">🚀 New version available!</span>
        <span className="text-sm opacity-90">Please save your changes before updating.</span>
      </div>
      <button 
        onClick={handleManualUpdate}
        className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
      >
        Update Now
      </button>
    </div>
  );
}
