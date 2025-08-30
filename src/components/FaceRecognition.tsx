import React, { useEffect, useState, useRef } from 'react';
import { Video, X, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FaceRecognitionProps {
  onFaceRecognized: (userId: string, userType: 'student' | 'employee', confidence?: number) => void;
  onClose: () => void;
  isEnrollmentMode?: boolean;
  userId?: string;
  userType?: 'student' | 'employee';
  onEnrollmentComplete?: (success: boolean) => void;
}

export const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  onFaceRecognized,
  onClose,
  isEnrollmentMode = false,
  userId,
  userType = 'employee',
  onEnrollmentComplete,
}) => {
  const {
    videoRef,
    isInitialized,
    isCameraActive,
    isLoading,
    error: faceRecognitionError,
    detectedFaces,
    isEnrolling,
    enrollmentProgress,
    startCamera,
    stopCamera,
    startRecognition,
    stopRecognition,
    enrollFace,
  } = useFaceRecognition();

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Ref to track camera initialization to prevent re-renders during the process
  const isInitializingRef = useRef(false);

  // Handle face recognition
  useEffect(() => {
    if (!isInitialized || !isCameraActive) return;

    if (isRecognizing && !isEnrolling) {
      const cleanup = startRecognition((userId, userType, confidence) => {
        onFaceRecognized(userId, userType, confidence);
        stopRecognition();
        setIsRecognizing(false);
      });

      return () => {
        cleanup();
        stopRecognition();
      };
    }
  }, [isInitialized, isCameraActive, isRecognizing, isEnrolling, onFaceRecognized]); // Remove function dependencies to prevent infinite loops

  // Handle enrollment
  const handleEnroll = async () => {
    if (!userId) return;

    setEnrollmentStatus(null);
    const result = await enrollFace(userId, userType);
    
    setEnrollmentStatus({
      success: result.success,
      message: result.success 
        ? 'Face enrollment successful!' 
        : result.error || 'Failed to enroll face. Please try again.',
    });

    if (onEnrollmentComplete) {
      onEnrollmentComplete(result.success);
    }
  };

  // Start/stop recognition
  const toggleRecognition = () => {
    if (isRecognizing) {
      stopRecognition();
      setIsRecognizing(false);
    } else {
      setIsRecognizing(true);
    }
  };

  // Auto-start recognition when camera is active and not in enrollment mode
  // Removed to prevent infinite re-renders - recognition will be started manually

  // Start camera when component mounts or when initialization state changes
  useEffect(() => {
    let isMounted = true;
    
    console.log('FaceRecognition: useEffect triggered', { isInitialized, isCameraActive, isMounted });
    
    const initializeCamera = async () => {
      if (!isInitialized || isCameraActive || !isMounted || isInitializingRef.current) {
        console.log('FaceRecognition: Skipping camera initialization', { 
          isInitialized, 
          isCameraActive, 
          isMounted, 
          isInitializing: isInitializingRef.current 
        });
        return;
      }
      
      console.log('FaceRecognition: Starting camera initialization');
      isInitializingRef.current = true;
      
      // Add a longer delay to ensure the component is fully rendered and video element is available
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
      
      if (!isMounted) {
        console.log('FaceRecognition: Component unmounted during delay');
        isInitializingRef.current = false;
        return;
      }
      
      try {
        console.log('FaceRecognition: Calling startCamera');
        const success = await startCamera();
        if (!success && isMounted) {
          console.error('Failed to start camera');
        }
      } catch (err) {
        console.error('Error initializing camera:', err);
      } finally {
        isInitializingRef.current = false;
      }
    };
    
    // Only initialize camera if we're initialized and not already active
    if (isInitialized && !isCameraActive) {
      // Use a timeout to ensure the component is stable
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          initializeCamera();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }

    return () => {
      console.log('FaceRecognition: Cleanup function called');
      isMounted = false;
      isInitializingRef.current = false;
      stopCamera();
      stopRecognition();
    };
  }, [isInitialized, isCameraActive]); // Remove function dependencies to prevent infinite loops

  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Initializing face recognition...</p>
      </div>
    );
  }

  if (faceRecognitionError) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error</h3>
        </div>
        <p className="text-sm text-muted-foreground">{faceRecognitionError}</p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {isEnrollmentMode ? 'Enroll Face' : 'Face Recognition'}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                opacity: isCameraActive ? 1 : 0.1,
                transition: 'opacity 0.3s ease-in-out',
                visibility: 'visible',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: isCameraActive ? 2 : 0 // Higher z-index when camera is active
              }}
            />
            {!isCameraActive && !faceRecognitionError && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center p-4 bg-black/50 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                  <p className="text-white">Initializing camera...</p>
                </div>
              </div>
            )}
            {!isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center space-y-2 p-4">
                  <Video className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Camera is starting...
                  </p>
                </div>
              </div>
            )}
          </div>

          {detectedFaces.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              {detectedFaces[0].userId ? (
                <>
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    {detectedFaces[0].userType === 'employee' ? 'Employee' : 'Student'} ID: {detectedFaces[0].userId}
                  </span>
                  {detectedFaces[0].confidence !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({(detectedFaces[0].confidence * 100).toFixed(1)}%)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 text-yellow-500" />
                  <span>No match found</span>
                </>
              )}
            </div>
          )}
        </div>

        {isEnrolling && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Capturing samples...</span>
              <span>{enrollmentProgress}%</span>
            </div>
            <Progress value={enrollmentProgress} className="h-2" />
          </div>
        )}

        {enrollmentStatus && (
          <div
            className={cn(
              'p-3 rounded-md text-sm',
              enrollmentStatus.success
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            {enrollmentStatus.message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {isEnrollmentMode ? (
            <Button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="w-full sm:w-auto"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Enroll Face'
              )}
            </Button>
          ) : (
            <Button
              onClick={toggleRecognition}
              variant={isRecognizing ? 'destructive' : 'default'}
              className="w-full sm:w-auto"
            >
              {isRecognizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stop Recognition
                </>
              ) : (
                'Start Recognition'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
