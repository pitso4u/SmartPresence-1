// Utility to handle photo paths and provide fallback images
export const getPhotoUrl = (photoPath: string | null | undefined): string => {
  if (!photoPath) {
    return '/api/v1/assets/default-avatar.png'; // Fallback to API endpoint
  }
  
  // If it's already a full URL, return as is
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // If it's a local file path, try to serve it through the API
  if (photoPath.startsWith('C:\\') || photoPath.startsWith('/')) {
    // Extract filename from path
    const filename = photoPath.split('\\').pop()?.split('/').pop();
    if (filename) {
      return `/api/v1/photos/${filename}`;
    }
  }
  
  // If it's just a filename (from our upload system)
  if (!photoPath.includes('\\') && !photoPath.includes('/') && !photoPath.includes(':')) {
    return `/api/v1/photos/${photoPath}`;
  }
  
  // Default fallback
  return '/api/v1/assets/default-avatar.png';
};

// Fallback image for when photos fail to load
export const getFallbackImage = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEMyMi43NjE0IDIwIDI1IDE3Ljc2MTQgMjUgMTVDMjUgMTIuMjM4NiAyMi43NjE0IDEwIDIwIDEwQzE3LjIzODYgMTAgMTUgMTIuMjM4NiAxNSAxNUMxNSAxNy43NjE0IDE3LjIzODYgMjAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxNi42ODYzIDIyIDE0IDI0LjY4NjMgMTQgMjhIMjZDMjYgMjQuNjg2MyAyMy4zMTM3IDIyIDIwIDIyWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
}; 