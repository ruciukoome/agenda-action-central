
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ToastSettingsContextType {
  toastsEnabled: boolean;
  toggleToasts: () => void;
  setToastsEnabled: (enabled: boolean) => void;
}

const ToastSettingsContext = createContext<ToastSettingsContextType | undefined>(undefined);

export function ToastSettingsProvider({ children }: { children: React.ReactNode }) {
  const [toastsEnabled, setToastsEnabled] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('toastsEnabled');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  });

  useEffect(() => {
    // Save to localStorage whenever the setting changes
    localStorage.setItem('toastsEnabled', JSON.stringify(toastsEnabled));
  }, [toastsEnabled]);

  const toggleToasts = () => {
    setToastsEnabled(prev => !prev);
  };

  return (
    <ToastSettingsContext.Provider value={{
      toastsEnabled,
      toggleToasts,
      setToastsEnabled
    }}>
      {children}
    </ToastSettingsContext.Provider>
  );
}

export function useToastSettings() {
  const context = useContext(ToastSettingsContext);
  if (context === undefined) {
    throw new Error('useToastSettings must be used within a ToastSettingsProvider');
  }
  return context;
}
