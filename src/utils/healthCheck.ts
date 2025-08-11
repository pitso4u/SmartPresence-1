import apiClient from '../config/api';

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/system/ping');
    return response.status === 'success' || response.message === 'pong';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export const checkServerAvailability = async (): Promise<{ available: boolean; message: string }> => {
  try {
    await apiClient.get('/system/ping');
    return { available: true, message: 'Server is available' };
  } catch (error) {
    return { 
      available: false, 
      message: 'Server is not available. Please check if the API server is running.' 
    };
  }
}; 