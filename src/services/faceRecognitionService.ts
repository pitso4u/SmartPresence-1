import * as faceapi from 'face-api.js';

// Threshold for face recognition (lower is more strict)
const FACE_MATCH_THRESHOLD = 0.6;

export interface FaceDescriptorWithId {
  id: string;
  userId: string;
  userType: 'student' | 'employee';
  descriptor: Float32Array;
  timestamp: number;
}

class FaceRecognitionService {
  private _isInitialized = false;
  private modelsLoaded = false;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'faceRecognitionDB';
  private readonly STORE_NAME = 'faceDescriptors';

  // Public getter for initialization status
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  // Initialize the service and load models
  async initialize(): Promise<boolean> {
    if (this._isInitialized) {
      console.log('Face recognition service already initialized');
      return true;
    }

    try {
      console.log('Starting face recognition service initialization...');
      
      // Define model paths - use backend server URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
      const modelPaths = [
        `${baseUrl}/models/tiny_face_detector_model-weights_manifest.json`,
        `${baseUrl}/models/face_landmark_68_model-weights_manifest.json`,
        `${baseUrl}/models/face_recognition_model-weights_manifest.json`
      ];

      console.log('Checking model manifests...');
      // Check if model manifests exist
      for (const path of modelPaths) {
        try {
          console.log(`Checking manifest: ${path}`);
          const response = await fetch(path, { 
            method: 'GET',
            cache: 'no-cache' // Prevent caching issues
          });
          
          console.log(`Response status: ${response.status}`);
          console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            console.warn(`Model manifest not available at ${path}: ${response.status}`);
            return false;
          }
          
          // Check if response is actually JSON (not HTML)
          const contentType = response.headers.get('content-type');
          console.log(`Content-Type: ${contentType}`);
          
          if (contentType && contentType.includes('text/html')) {
            console.warn(`Model manifest at ${path} returned HTML instead of JSON`);
            // Let's see what the actual response is
            const responseText = await response.text();
            console.log(`Response text (first 200 chars): ${responseText.substring(0, 200)}`);
            return false;
          }
          
          console.log(`✅ Manifest ${path} is accessible`);
        } catch (error) {
          console.warn(`Failed to check model manifest at ${path}:`, error);
          return false;
        }
      }

      console.log('All manifests are accessible, loading models...');
      // Load face detection and recognition models
      // The face-api.js library will automatically find the manifest files and load the corresponding binary files
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${baseUrl}/models`),
          faceapi.nets.faceLandmark68Net.loadFromUri(`${baseUrl}/models`),
          faceapi.nets.faceRecognitionNet.loadFromUri(`${baseUrl}/models`),
        ]);
        console.log('✅ All models loaded successfully');
      } catch (modelError) {
        console.error('❌ Failed to load models:', modelError);
        throw modelError;
      }
      
      this.modelsLoaded = true;
      console.log('Initializing IndexedDB...');
      await this.initDB();
      this._isInitialized = true;
      console.log('✅ Face recognition service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize FaceRecognitionService:', error);
      this.modelsLoaded = false;
      return false;
    }
  }

  // Initialize IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('employeeId', 'employeeId', { unique: false });
        }
      };
    });
  }

  // Add face descriptor for a user
  async addFaceDescriptor(userId: string, userType: 'student' | 'employee', descriptor: Float32Array): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const faceDescriptor: FaceDescriptorWithId = {
        id: `${userId}-${Date.now()}`,
        userId,
        userType,
        descriptor,
        timestamp: Date.now(),
      };

      const request = store.add(faceDescriptor);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add face descriptor'));
    });
  }

  // Get all face descriptors for a user
  async getFaceDescriptors(userId: string, userType: 'student' | 'employee'): Promise<FaceDescriptorWithId[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allDescriptors = request.result || [];
        // Filter by userId and userType
        const userDescriptors = allDescriptors.filter(
          desc => desc.userId === userId && desc.userType === userType
        );
        resolve(userDescriptors);
      };

      request.onerror = () => {
        console.error('Error getting face descriptors');
        resolve([]);
      };
    });
  }

  // Remove all face descriptors for a user
  async removeFaceDescriptors(userId: string, userType: 'student' | 'employee'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const descriptor = cursor.value as FaceDescriptorWithId;
          if (descriptor.userId === userId && descriptor.userType === userType) {
            store.delete(cursor.primaryKey);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to remove face descriptors'));
      };
    });
  }

  // Detect faces in an image and return descriptors
  async detectFaces(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    if (!this.modelsLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    // Detect all faces in the image
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  }

  // Recognize a face by comparing with stored descriptors
  async recognizeFace(descriptor: Float32Array): Promise<{ userId: string; userType: 'student' | 'employee'; distance: number } | null> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all stored face descriptors
    const allDescriptors = await new Promise<FaceDescriptorWithId[]>((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Error getting all face descriptors');
        resolve([]);
      };
    });

    console.log(`Found ${allDescriptors.length} enrolled face descriptors`);

    if (allDescriptors.length === 0) {
      console.log('No enrolled faces found in database');
      return null;
    }

    // Find the best match
    let bestMatch = { userId: '', userType: 'employee' as 'student' | 'employee', distance: Number.MAX_VALUE };

    for (const stored of allDescriptors) {
      const distance = faceapi.euclideanDistance(descriptor, stored.descriptor);
      if (distance < bestMatch.distance) {
        bestMatch = { userId: stored.userId, userType: stored.userType, distance };
      }
    }

    console.log('Best match found:', {
      userId: bestMatch.userId,
      userType: bestMatch.userType,
      distance: bestMatch.distance,
      threshold: FACE_MATCH_THRESHOLD,
      isMatch: bestMatch.distance <= FACE_MATCH_THRESHOLD
    });

    // Return match if it's below threshold
    return bestMatch.distance <= FACE_MATCH_THRESHOLD ? bestMatch : null;
  }

  // Enroll a new face for a user
  async enrollUserFace(userId: string, userType: 'student' | 'employee', image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<boolean> {
    try {
      const detections = await this.detectFaces(image);
      
      if (detections.length === 0) {
        throw new Error('No faces detected in the image');
      }

      // Add all detected faces (in case multiple faces are in the image)
      for (const detection of detections) {
        await this.addFaceDescriptor(userId, userType, detection.descriptor);
      }

      return true;
    } catch (error) {
      console.error('Error enrolling user face:', error);
      return false;
    }
  }

  // Recognize a face from an image
  async recognizeFaceFromImage(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    try {
      const detections = await this.detectFaces(image);
      
      if (detections.length === 0) {
        console.log('No faces detected in image');
        return { recognized: false };
      }

      console.log(`Detected ${detections.length} face(s) in image`);

      // For now, just process the first detected face
      const detection = detections[0];
      const recognition = await this.recognizeFace(detection.descriptor);

      console.log('Face recognition result:', {
        recognized: !!recognition,
        userId: recognition?.userId,
        userType: recognition?.userType,
        distance: recognition?.distance,
        hasDetection: !!detection
      });

      return {
        recognized: !!recognition,
        userId: recognition?.userId,
        userType: recognition?.userType,
        distance: recognition?.distance,
        detection
      };
    } catch (error) {
      console.error('Error recognizing face:', error);
      return { recognized: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
