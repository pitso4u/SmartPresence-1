import { useState } from 'react';

type Toast = {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
} | null;

const useToast = () => {
  const [toast, setToast] = useState<Toast>(null);

  const open = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    
    // Clear timeout if component unmounts
    return () => clearTimeout(timer);
  };

  const close = () => setToast(null);

  return { toast, open, close };
};

export default useToast;