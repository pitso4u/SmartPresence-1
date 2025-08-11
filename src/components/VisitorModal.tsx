import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { Visitor } from '../types';
import { visitorService } from '../services/visitorService';
import { photoService } from '../services/photoService';
import { getPhotoUrl, getFallbackImage } from '../utils/photoUtils';

interface VisitorModalProps {
  visitor: Visitor | null;
  onClose: () => void;
  onSave: () => void;
}

export function VisitorModal({ visitor, onClose, onSave }: VisitorModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    id_number: '',
    purpose: '',
    host: '',
    photo_path: '',
    phone_number: '',
    email: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (visitor) {
      setFormData({
        full_name: visitor.full_name || '',
        id_number: visitor.id_number || '',
        purpose: visitor.purpose || '',
        host: visitor.host || '',
        photo_path: visitor.photo_path || '',
        phone_number: visitor.phone_number || '',
        email: visitor.email || ''
      });
      setPreviewUrl('');
      setSelectedFile(null);
    } else {
      setFormData({
        full_name: '',
        id_number: '',
        purpose: '',
        host: '',
        photo_path: '',
        phone_number: '',
        email: ''
      });
    }
  }, [visitor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      
      let photoPath = formData.photo_path;
      
      if (selectedFile) {
        try {
          const uploadResult = await photoService.uploadPhoto(selectedFile);
          photoPath = uploadResult.filename;
        } catch (error) {
          console.error('Error uploading photo:', error);
          alert('Failed to upload photo. Please try again.');
          setIsUploading(false);
          return;
        }
      }
      
      if (visitor) {
        const visitorData = {
          ...formData,
          photo_path: photoPath,
        };
        await visitorService.update(visitor.id, visitorData);
      } else {
        const visitorData = {
          ...formData,
          photo_path: photoPath,
          entry_time: new Date().toISOString(),
          exit_time: null,
          synced: 0,
        };
        await visitorService.create(visitorData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving visitor:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {visitor ? 'Edit Visitor' : 'Register New Visitor'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="ID Number"
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="Purpose of Visit"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="Host"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            
            {/* Photo Preview */}
            {(previewUrl || formData.photo_path) && (
              <div className="relative inline-block">
                <img
                  src={previewUrl || getPhotoUrl(formData.photo_path)}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setFormData({ ...formData, photo_path: '' });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {/* File Input */}
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 flex items-center space-x-2 transition-colors">
                <Camera className="h-4 w-4" />
                <span>Choose Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <span className="text-sm text-gray-500">
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Saving...' : (visitor ? 'Update' : 'Register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
