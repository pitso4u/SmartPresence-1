import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface SimpleQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  isModalOpen?: boolean;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  onScanSuccess,
  onError,
  onClose,
  isModalOpen = true,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      // Add a longer delay to ensure DOM is ready and container is properly rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isModalOpen]);

  const startScanner = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Starting QR scanner...');
      console.log('Modal open state:', isModalOpen);
      console.log('Container element:', document.getElementById('qr-scanner-container'));
      
      // Check if container exists
      const container = document.getElementById('qr-scanner-container');
      if (!container) {
        throw new Error('QR scanner container not found');
      }
      
      // Clean up previous scanner if exists
      if (scannerRef.current) {
        console.log('Cleaning up previous scanner...');
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Test camera permissions first
      console.log('Testing camera permissions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera permission granted, stream:', stream);
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('Camera permission denied:', permError);
        throw new Error('Camera access denied. Please allow camera permissions and try again.');
      }

      // Create new scanner with better configuration
      console.log('Creating new Html5QrcodeScanner...');
      const scanner = new Html5QrcodeScanner(
        'qr-scanner-container',
        {
          qrbox: { width: 200, height: 200 },
          fps: 5,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], // QR_CODE only
          disableFlip: false,
        },
        false // verbose
      );

      console.log('Rendering scanner...');
      scanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          onScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore not found errors as they're common during scanning
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No QR code found')) {
            console.warn('QR Scanner error:', errorMessage);
            const err = new Error(errorMessage);
            setError(errorMessage);
            onError?.(err);
          }
        }
      );

      scannerRef.current = scanner;
      console.log('QR scanner started successfully');
      setCameraStarted(true);
      
      // Check if scanner elements were created
      setTimeout(() => {
        const scannerElements = document.querySelectorAll('[id*="html5-qrcode"]');
        console.log('Scanner elements found:', scannerElements.length);
        scannerElements.forEach((el, index) => {
          console.log(`Scanner element ${index}:`, el.id, el.className);
        });
      }, 1000);
      
    } catch (err) {
      const error = err as Error;
      console.error('Failed to start QR scanner:', error);
      setError(`Scanner failed: ${error.message}`);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setCameraStarted(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="relative w-full h-full">
      {/* Scanner container */}
      <div id="qr-scanner-container" className="w-full h-full min-h-[350px]" />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Camera not started overlay */}
      {!isLoading && !cameraStarted && !error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold">Camera Not Started</h3>
            </div>
            <p className="text-gray-600 mb-4">
              The camera hasn't started automatically. Click the button below to start the camera manually.
            </p>
            <div className="flex space-x-3">
              <Button onClick={startScanner}>
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              <Button variant="outline" onClick={() => setShowManualInput(true)}>
                Enter Manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">Scanner Error</h3>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button onClick={() => {
                setError('');
                setCameraStarted(false);
                startScanner();
              }}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => setShowManualInput(true)}>
                Enter Manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual input modal */}
      {showManualInput && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter QR Code Manually</h3>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR code content here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
              >
                Submit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowManualInput(false);
                  setManualInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

