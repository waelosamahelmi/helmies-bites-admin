const API_BASE = '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  async get<T = any>(url: string): Promise<T> {
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  },

  async post<T = any>(url: string, data: any): Promise<T> {
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  },

  async put<T = any>(url: string, data: any): Promise<T> {
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  },

  async delete<T = any>(url: string): Promise<T> {
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  },
};
