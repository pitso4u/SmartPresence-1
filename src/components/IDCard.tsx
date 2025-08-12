import { User, Check, Mail, Phone } from 'lucide-react';
import { Card } from '../types';
import React from 'react';

interface UserInfo {
  name: string;
  identifier?: string;
  grade?: string;
  dob?: string;
  photo?: string;
  job_title?: string;
  email?: string;
  phone?: string;
}

interface IDCardProps {
  card: Card;
  userInfo: UserInfo | null;
  className?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const IDCard: React.FC<IDCardProps> = ({
  card,
  userInfo,
  className = '',
  isSelected = false,
  onToggleSelect,
}) => {
  if (!userInfo) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    // Use a data URL for a simple placeholder to avoid external requests
    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlNWU1ZTUiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGhvdG8gTm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800'
  };

  // Ensure status is one of the valid values, default to 'inactive' if not
  const status = ['active', 'expired', 'suspended'].includes(card.status) 
    ? card.status 
    : 'inactive';
  const statusColor = statusColors[status] || statusColors.default;
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      } ${className}`}
    >
      {/* Card Header */}
      <div className="bg-blue-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{userInfo.name}</h3>
          <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full">
            {card.user_type === 'student' ? 'Student' : 'Employee'}
          </span>
        </div>
        {userInfo.identifier && (
          <p className="text-sm opacity-80">{userInfo.identifier}</p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
            {userInfo.photo ? (
              <img
                src={userInfo.photo}
                alt={userInfo.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">
                {userInfo.grade || userInfo.job_title || 'N/A'}
              </p>
            </div>
            {userInfo.dob && (
              <div className="mb-2">
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{userInfo.dob}</p>
              </div>
            )}
            {userInfo.email && (
              <div className="mb-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{userInfo.email}</span>
                </div>
              </div>
            )}
            {userInfo.phone && (
              <div className="mb-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{userInfo.phone}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Issued: {card.issue_date ? new Date(card.issue_date).toLocaleDateString() : 'N/A'}</span>
          <span>Expires: {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => onToggleSelect(card.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white border-gray-300 text-transparent hover:border-blue-400'
            }`}
            aria-label={isSelected ? 'Deselect card' : 'Select card'}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default IDCard;