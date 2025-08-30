const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: string;
  error?: string;
}

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const apiClient = {
  baseURL: API_BASE_URL,
  
  // Generic request method
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      ...(options.headers || {}),
    };

    // Add auth token if it exists
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      credentials: 'include',
      headers,
      ...options,
    };

    // Only set Content-Type for JSON requests (not FormData)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      console.log(`Making ${options.method || 'GET'} request to:`, url);
      if (options.body) {
        console.log('Request body:', options.body);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response body:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // If token is invalid, clear it
          if (response.status === 401) {
            localStorage.removeItem('token');
            // Optionally redirect to login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          const statusText = await response.text();
          if (statusText) {
            console.error('Error response text:', statusText);
            errorMessage = statusText;
          }
        }
        throw new Error(errorMessage);
      }
      
      // Handle empty responses (like DELETE with 204 status)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log('API response: Empty response (204 No Content)');
        return { data: null, success: true };
      }
      
      const responseData = await response.json();
      
      // If this is a login response, save the token
      if (endpoint === '/users/login' && responseData.data?.token) {
        localStorage.setItem('token', responseData.data.token);
      }
      
      console.log('API response:', { endpoint, response: responseData });
      return responseData;
    } catch (error) {
      console.error('API request failed:', {
        endpoint,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestBody: options.body
      });
      throw error;
    }
  },

  // HTTP methods
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body,
    });
  },

  put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body,
    });
  },

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;