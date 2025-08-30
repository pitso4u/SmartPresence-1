import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export interface QRScannerOptions {
  qrbox?: {
    width: number;
    height: number;
  };
  fps?: number;
  aspectRatio?: number;
  showTorchButtonIfSupported?: boolean;
  showZoomSliderIfSupported?: boolean;
  defaultZoomValueIfSupported?: number;
}

export const useQRScanner = (
  containerId: string,
  onScanSuccess: (decodedText: string) => void,
  onError?: (error: Error) => void,
  options: QRScannerOptions = {}
) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const defaultOptions = {
    qrbox: { width: 250, height: 250 },
    fps: 5,
    aspectRatio: 1.0,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    defaultZoomValueIfSupported: 2,
    ...options,
  };

  const checkCameraPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop all tracks to release camera
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      const error = err as Error;
      setError(`Camera access denied: ${error.message}`);
      setHasPermission(false);
      onError?.(error);
      return false;
    }
  }, [onError]);

  const startScanning = useCallback(async () => {
    if (!containerId) {
      const err = new Error('Container ID is required');
      setError(err.message);
      onError?.(err);
      return;
    }

    const hasAccess = await checkCameraPermissions();
    if (!hasAccess) return;

    try {
      setIsScanning(true);
      setError(null);

      // Clean up previous scanner if exists
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      const scanner = new Html5QrcodeScanner(
        containerId,
        {
          ...defaultOptions,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false // verbose
      );

      scanner.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore not found errors as they're common during scanning
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No QR code found')) {
            const err = new Error(errorMessage);
            setError(errorMessage);
            onError?.(err);
          }
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      const error = err as Error;
      setError(`Failed to start scanner: ${error.message}`);
      onError?.(error);
      setIsScanning(false);
    }
  }, [containerId, onScanSuccess, onError, checkCameraPermissions, defaultOptions]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    startScanning,
    stopScanning,
    isScanning,
    error,
    hasPermission,
  };
};
