import apiClient from '../config/api';

export interface PhotoUploadResponse {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export const photoService = {
  async uploadPhoto(file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await apiClient.post('/photos/upload', formData);

    return response.data as PhotoUploadResponse;
  },

  async getPhotoUrl(filename: string): Promise<string> {
    return `/api/v1/photos/${filename}`;
  }
}; 