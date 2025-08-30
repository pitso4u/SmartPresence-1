import { useState, useEffect, useCallback, useRef } from 'react';
import { faceRecognitionService } from '../services/faceRecognitionService';

interface FaceRecognitionState {
  isInitialized: boolean;
  isCameraActive: boolean;
  isLoading: boolean;
  error: string | null;
  detectedFaces: Array<{
    userId?: string;
    userType?: 'student' | 'employee';
    confidence?: number;
    detection: any;
  }>;
  isEnrolling: boolean;
  enrollmentProgress: number;
}

export const useFaceRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null); // Store video element reference
  const [state, setState] = useState<FaceRecognitionState>({
    isInitialized: false,
    isCameraActive: false,
    isLoading: true,
    error: null,
    detectedFaces: [],
    isEnrolling: false,
    enrollmentProgress: 0,
  });
  const recognitionInterval = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize face recognition service
  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const success = await faceRecognitionService.initialize();
        
        if (!success) {
          throw new Error('Failed to initialize face recognition service');
        }
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error initializing face recognition:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize face recognition',
        }));
      }
    };

    initialize();

    return () => {
      stopCamera();
      if (recognitionInterval.current) {
        window.clearInterval(recognitionInterval.current);
      }
    };
  }, []);

  // Start the camera
  const startCamera = useCallback(async () => {
    if (!state.isInitialized) {
      console.error('Face recognition not initialized');
      return false;
    }

    // Helper function to find video element
    const findVideoElement = (): HTMLVideoElement | null => {
      // First try the stored reference
      if (videoElementRef.current && videoElementRef.current.isConnected) {
        return videoElementRef.current;
      }
      
      // Then try the ref
      if (videoRef.current) {
        videoElementRef.current = videoRef.current;
        return videoRef.current;
      }
      
      // Fallback: find video element in DOM
      const videoElements = document.querySelectorAll('video');
      console.log('Found video elements in DOM:', videoElements.length);
      
      if (videoElements.length > 0) {
        const element = videoElements[0] as HTMLVideoElement;
        videoElementRef.current = element;
        return element;
      }
      
      return null;
    };

    // Helper function to create a temporary video element
    const createTemporaryVideoElement = (): HTMLVideoElement => {
      const tempVideo = document.createElement('video');
      tempVideo.autoplay = true;
      tempVideo.playsInline = true;
      tempVideo.muted = true;
      tempVideo.style.position = 'absolute';
      tempVideo.style.top = '0';
      tempVideo.style.left = '0';
      tempVideo.style.width = '100%';
      tempVideo.style.height = '100%';
      tempVideo.style.opacity = '1'; // Make it fully visible
      tempVideo.style.transition = 'opacity 0.3s ease-in-out';
      tempVideo.style.visibility = 'visible';
      tempVideo.style.zIndex = '1'; // Ensure it's above other elements
      tempVideo.style.objectFit = 'cover';
      tempVideo.style.borderRadius = '8px'; // Match the container's border radius
      
      // Try multiple selectors to find the container
      let container = document.querySelector('.aspect-video');
      if (!container) {
        container = document.querySelector('[class*="aspect-video"]');
      }
      if (!container) {
        container = document.querySelector('.relative');
      }
      if (!container) {
        container = document.body; // Fallback to body
      }
      
      if (container) {
        container.appendChild(tempVideo);
        console.log('Temporary video element added to container');
      } else {
        console.error('Container not found for temporary video element');
      }
      
      return tempVideo;
    };

    // Wait for video element to be available
    let attempts = 0;
    const maxAttempts = 20;
    
    console.log('Starting video element check...');
    
    let videoElement = findVideoElement();
    while (!videoElement && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
      console.log(`Attempt ${attempts}: video element =`, videoElement);
      videoElement = findVideoElement();
    }

    if (!videoElement) {
      console.error('Video element not available after waiting');
      return false;
    }
    
    console.log('Video element found after', attempts, 'attempts:', videoElement);

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First check if we have permission to access the camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No video input devices found');
      }

      // Try to get the stream
      const constraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          deviceId: videoDevices[0].deviceId ? { exact: videoDevices[0].deviceId } : undefined
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      streamRef.current = stream;
      
      console.log('After getting stream, video element:', videoElement);
      console.log('Stream tracks:', stream.getTracks().map(t => t.kind));
      
      // Re-find video element after getting stream (in case it was re-rendered)
      videoElement = findVideoElement();
      if (!videoElement || !videoElement.isConnected) {
        console.error('Video element is no longer connected to DOM after getting stream');
        console.log('Attempting to re-find video element...');
        
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        videoElement = findVideoElement();
        
        if (!videoElement || !videoElement.isConnected) {
          console.log('Creating temporary video element...');
          videoElement = createTemporaryVideoElement();
          videoElementRef.current = videoElement;
        }
      }
      
      console.log('Setting srcObject on video element...');
      videoElement.srcObject = stream;
      console.log('srcObject set successfully');
      console.log('Video element styles:', {
        opacity: videoElement.style.opacity,
        visibility: videoElement.style.visibility,
        zIndex: videoElement.style.zIndex,
        display: videoElement.style.display,
        position: videoElement.style.position
      });
      
      // Wait for video to be ready with better error handling
      await new Promise<void>((resolve, reject) => {
        if (!videoElement) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const onLoadedMetadata = () => {
          console.log('Video metadata loaded successfully');
          if (videoElement) {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('error', onError);
          }
          resolve();
        };
        
        const onError = (e: Event) => {
          console.error('Video error event:', e);
          if (videoElement) {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('error', onError);
          }
          const errorMessage = e instanceof ErrorEvent ? e.message : 'Failed to load video stream';
          reject(new Error(errorMessage));
        };
        
        const onCanPlay = () => {
          console.log('Video can play');
        };
        
        if (videoElement) {
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          videoElement.addEventListener('error', onError, { once: true });
          videoElement.addEventListener('canplay', onCanPlay);
        }
        
        // Add a timeout in case the video never loads
        const timeoutId = setTimeout(() => {
          if (videoElement) {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('error', onError);
            videoElement.removeEventListener('canplay', onCanPlay);
          }
          reject(new Error('Camera initialization timed out'));
        }, 10000);
        
        // Clean up timeout when the promise resolves/rejects
        return () => clearTimeout(timeoutId);
      });

      setState(prev => ({
        ...prev,
        isCameraActive: true,
        isLoading: false,
        error: null,
      }));
      
      // Try to transfer stream to original video element if it becomes available
      setTimeout(() => {
        const originalVideo = videoRef.current;
        if (originalVideo && originalVideo.isConnected && streamRef.current) {
          console.log('Transferring stream to original video element');
          originalVideo.srcObject = streamRef.current;
          videoElementRef.current = originalVideo;
          
          // Remove temporary video element if it exists
          const tempVideo = document.querySelector('video[style*="z-index: 1"]');
          if (tempVideo && tempVideo !== originalVideo) {
            tempVideo.remove();
            console.log('Temporary video element removed');
          }
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Could not access camera. Please check permissions and ensure no other application is using the camera.';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCameraActive: false,
        error: errorMessage,
      }));
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      return false;
    }
  }, [state.isInitialized]);

  // Stop the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Helper function to find video element
    const findVideoElement = (): HTMLVideoElement | null => {
      if (videoElementRef.current && videoElementRef.current.isConnected) {
        return videoElementRef.current;
      }
      if (videoRef.current) {
        videoElementRef.current = videoRef.current;
        return videoRef.current;
      }
      const videoElements = document.querySelectorAll('video');
      if (videoElements.length > 0) {
        const element = videoElements[0] as HTMLVideoElement;
        videoElementRef.current = element;
        return element;
      }
      return null;
    };
    
    const videoElement = findVideoElement();
    if (videoElement) {
      videoElement.srcObject = null;
    }
    
    // Clear the stored reference
    videoElementRef.current = null;
    
    setState(prev => ({
      ...prev,
      isCameraActive: false,
      detectedFaces: [],
    }));
  }, []);

  // Start face recognition
  const startRecognition = useCallback((onFaceRecognized?: (userId: string, userType: 'student' | 'employee', confidence?: number) => void) => {
    // Use refs to avoid dependency issues
    const isInitialized = state.isInitialized;
    const isCameraActive = state.isCameraActive;
    
    if (!isInitialized || !isCameraActive) {
      return () => {};
    }

    // Helper function to find video element
    const findVideoElement = (): HTMLVideoElement | null => {
      if (videoElementRef.current && videoElementRef.current.isConnected) {
        return videoElementRef.current;
      }
      if (videoRef.current) {
        videoElementRef.current = videoRef.current;
        return videoRef.current;
      }
      const videoElements = document.querySelectorAll('video');
      if (videoElements.length > 0) {
        const element = videoElements[0] as HTMLVideoElement;
        videoElementRef.current = element;
        return element;
      }
      return null;
    };

    // Clear any existing interval
    if (recognitionInterval.current) {
      window.clearInterval(recognitionInterval.current);
    }

    // Start new recognition loop
    recognitionInterval.current = window.setInterval(async () => {
      const videoElement = findVideoElement();
      if (!videoElement) return;

      try {
        const result = await faceRecognitionService.recognizeFaceFromImage(videoElement);
        
        if (result.recognized && result.userId) {
          // Calculate confidence based on distance (lower distance = higher confidence)
          const confidence = result.distance !== undefined ? Math.max(0, Math.min(1, 1 - (result.distance / 0.6))) : 0.8;
          
          setState(prev => ({
            ...prev,
            detectedFaces: [{
              userId: result.userId,
              userType: result.userType,
              confidence: confidence,
              detection: result.detection,
            }],
          }));
          
          if (onFaceRecognized) {
            onFaceRecognized(result.userId, result.userType || 'employee', confidence);
          }
        } else {
          // Show "No match found" when face is detected but not recognized
          if (result.detection) {
            setState(prev => ({
              ...prev,
              detectedFaces: [{
                userId: undefined,
                userType: undefined,
                confidence: undefined,
                detection: result.detection,
              }],
            }));
          } else {
            setState(prev => ({
              ...prev,
              detectedFaces: [],
            }));
          }
        }
      } catch (error) {
        console.error('Error during face recognition:', error);
      }
    }, 1000); // Process every second

    // Return cleanup function
    return () => {
      if (recognitionInterval.current) {
        window.clearInterval(recognitionInterval.current);
        recognitionInterval.current = null;
      }
    };
  }, []); // Remove dependencies to prevent infinite loop

  // Stop face recognition
  const stopRecognition = useCallback(() => {
    if (recognitionInterval.current) {
      window.clearInterval(recognitionInterval.current);
      recognitionInterval.current = null;
    }
    
    setState(prev => ({
      ...prev,
      detectedFaces: [],
    }));
  }, []);

  // Enroll a new face
  const enrollFace = useCallback(async (userId: string, userType: 'student' | 'employee' = 'employee'): Promise<{ success: boolean; error?: string }> => {
    const isInitialized = state.isInitialized;
    if (!isInitialized) {
      return { success: false, error: 'Face recognition not initialized' };
    }

    // Helper function to find video element
    const findVideoElement = (): HTMLVideoElement | null => {
      if (videoElementRef.current && videoElementRef.current.isConnected) {
        return videoElementRef.current;
      }
      if (videoRef.current) {
        videoElementRef.current = videoRef.current;
        return videoRef.current;
      }
      const videoElements = document.querySelectorAll('video');
      if (videoElements.length > 0) {
        const element = videoElements[0] as HTMLVideoElement;
        videoElementRef.current = element;
        return element;
      }
      return null;
    };

    try {
      setState(prev => ({
        ...prev,
        isEnrolling: true,
        enrollmentProgress: 0,
      }));

      // Take multiple samples for better accuracy
      const samples = 3;
      let successCount = 0;

      for (let i = 0; i < samples; i++) {
        if (i > 0) {
          // Wait a bit between samples
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const videoElement = findVideoElement();
        if (!videoElement) {
          console.error('Video element not available for enrollment');
          continue;
        }

        const success = await faceRecognitionService.enrollUserFace(userId, userType || 'employee', videoElement);
        if (success) {
          successCount++;
        }

        setState(prev => ({
          ...prev,
          enrollmentProgress: Math.round(((i + 1) / samples) * 100),
        }));
      }

      return {
        success: successCount > 0,
        error: successCount === 0 ? 'Failed to capture any face samples' : undefined,
      };
    } catch (error) {
      console.error('Error enrolling face:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enroll face',
      };
    } finally {
      setState(prev => ({
        ...prev,
        isEnrolling: false,
      }));
    }
  }, []); // Remove dependency to prevent infinite loop

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    startRecognition,
    stopRecognition,
    enrollFace,
  };
};
