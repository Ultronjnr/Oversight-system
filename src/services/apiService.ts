/**
 * API Service for Oversight Procurement Management System
 * Production-ready API integration with backend database
 */

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Purchase Requisition Types
export interface PurchaseRequisition {
  id: string;
  transactionId: string;
  type: 'PURCHASE_REQUISITION';
  requestDate: string;
  dueDate: string;
  paymentDueDate: string;
  items: PurchaseRequisitionItem[];
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  department: string;
  budgetCode?: string;
  projectCode?: string;
  supplierPreference?: string;
  deliveryLocation?: string;
  specialInstructions?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedByDepartment: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  status: string;
  totalAmount: number;
  currency: string;
  history: HistoryEntry[];
  sourceDocument?: string; // URL to uploaded document
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
  isSplit?: boolean;
  originalTransactionId?: string;
  splitReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  vatClassification: 'VAT_APPLICABLE' | 'NO_VAT';
  technicalSpecs?: string;
  businessJustification?: string;
}

export interface HistoryEntry {
  id: string;
  status: string;
  date: string;
  by: string;
  transactionId?: string;
  action: string;
  comments?: string;
  riskAssessment?: string;
  complianceNotes?: string;
  alternativeOptions?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  department: string;
  createdAt: string;
  updatedAt: string;
}

// HTTP Client with error handling
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint: string, formData: FormData): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Upload Error (${endpoint}):`, error);
      throw error;
    }
  }
}

// API Service
export class ApiService {
  private static client = new ApiClient();

  // Authentication
  static async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.client.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    await this.client.post('/auth/logout', {});
  }

  static async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Purchase Requisitions
  static async getPurchaseRequisitions(filters?: {
    status?: string;
    department?: string;
    requestedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PurchaseRequisition[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const endpoint = `/purchase-requisitions${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.client.get<PurchaseRequisition[]>(endpoint);
    return response.data;
  }

  static async getPurchaseRequisition(id: string): Promise<PurchaseRequisition> {
    const response = await this.client.get<PurchaseRequisition>(`/purchase-requisitions/${id}`);
    return response.data;
  }

  static async createPurchaseRequisition(pr: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseRequisition> {
    const response = await this.client.post<PurchaseRequisition>('/purchase-requisitions', pr);
    return response.data;
  }

  static async updatePurchaseRequisition(id: string, updates: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> {
    const response = await this.client.put<PurchaseRequisition>(`/purchase-requisitions/${id}`, updates);
    return response.data;
  }

  static async approvePurchaseRequisition(id: string, data: {
    decision: 'approve' | 'decline';
    comments: string;
    actionRole: 'HOD' | 'Finance';
    [key: string]: any;
  }): Promise<PurchaseRequisition> {
    const response = await this.client.post<PurchaseRequisition>(`/purchase-requisitions/${id}/approve`, data);
    return response.data;
  }

  static async splitPurchaseRequisition(id: string, splitData: {
    splitItems: any[];
    splitReason: string;
    originalUpdate: any;
  }): Promise<{ splitPRs: PurchaseRequisition[]; originalUpdate: PurchaseRequisition }> {
    const response = await this.client.post<any>(`/purchase-requisitions/${id}/split`, splitData);
    return response.data;
  }

  // File Upload
  static async uploadDocument(file: File, prId?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (prId) formData.append('prId', prId);

    const response = await this.client.upload('/documents/upload', formData);
    return response.data;
  }

  // Analytics
  static async getAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const endpoint = `/analytics${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.client.get<any>(endpoint);
    return response.data;
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  static async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await this.client.post<User>('/users', user);
    return response.data;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, updates);
    return response.data;
  }

  static async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}

// Environment Configuration for Production
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    apiUrl: process.env.REACT_APP_API_URL || (isDevelopment ? 'http://localhost:8000/api' : '/api'),
    isDevelopment,
    isProduction: process.env.NODE_ENV === 'production',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  };
};

// Fallback to localStorage for development/demo
export const useLocalStorageFallback = () => {
  const config = getEnvironmentConfig();
  return config.isDevelopment && !process.env.REACT_APP_API_URL;
};

export default ApiService;
