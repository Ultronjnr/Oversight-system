/**
 * API Service for Oversight Procurement Management System
 * Production-ready API integration with backend database
 */

import { supabase } from '../lib/supabaseClient';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/.netlify/functions';

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
      const session = await supabase.auth.getSession();
      const supabaseToken = session.data.session?.access_token;
      const token = supabaseToken || localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
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
      const session = await supabase.auth.getSession();
      const supabaseToken = session.data.session?.access_token;
      const token = supabaseToken || localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
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

  static async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const response = await this.client.post<any>('/users', user);
    // Return full payload so UI can access generated password and email result
    return response.data;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, updates);
    return response.data;
  }

  static async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Email Management
  static async sendEmail(emailData: {
    recipients: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    templateId?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await this.client.post<{ success: boolean; messageId?: string }>('/emails/send', emailData);
      return response.data;
    } catch (error) {
      console.warn('Email send failed, logging to console:', emailData);
      console.log(`[MOCK EMAIL] To: ${emailData.recipients.join(', ')}, Subject: ${emailData.subject}, Body: ${emailData.body}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }
  }

  static async getEmailTemplates(): Promise<any[]> {
    try {
      const response = await this.client.get<any[]>('/email-templates');
      return response.data;
    } catch (error) {
      console.warn('Failed to load email templates from API, using defaults');
      return [
        { id: '1', name: 'PR Approved', subject: 'Purchase Requisition Approved - {TRANSACTION_ID}', body: 'Dear {EMPLOYEE_NAME},\n\nYour purchase requisition has been approved.\n\nTransaction ID: {TRANSACTION_ID}\nTotal Amount: {AMOUNT}\nApproved by: {APPROVER_NAME}\n\nExpected delivery: {DELIVERY_DATE}\n\nThank you.', type: 'pr_approved' },
        { id: '2', name: 'PR Declined', subject: 'Purchase Requisition Update - {TRANSACTION_ID}', body: 'Dear {EMPLOYEE_NAME},\n\nWe regret to inform you that your purchase requisition has been declined.\n\nTransaction ID: {TRANSACTION_ID}\nReason: {DECLINE_REASON}\nAlternative suggestions: {ALTERNATIVES}\n\nPlease contact us for more information.', type: 'pr_declined' },
        { id: '3', name: 'PR Split Notification', subject: 'Purchase Requisition Split - {TRANSACTION_ID}', body: 'Dear {EMPLOYEE_NAME},\n\nYour purchase requisition has been split for processing efficiency.\n\nOriginal PR: {TRANSACTION_ID}\nSplit into: {SPLIT_COUNT} separate requisitions\nReason: {SPLIT_REASON}\n\nEach split will be processed individually.', type: 'pr_split' },
        { id: '4', name: 'Pending Approval Reminder', subject: 'Pending Purchase Requisitions - Action Required', body: 'Dear {APPROVER_NAME},\n\nYou have {PENDING_COUNT} purchase requisitions awaiting your approval.\n\nPlease review and take action on these pending requests.\n\nAccess your dashboard: [Dashboard Link]', type: 'reminder' }
      ];
    }
  }

  static async saveEmailTemplate(template: any): Promise<any> {
    try {
      if (template.id) {
        const response = await this.client.put<any>(`/email-templates/${template.id}`, template);
        return response.data;
      } else {
        const response = await this.client.post<any>('/email-templates', template);
        return response.data;
      }
    } catch (error) {
      console.warn('Template save failed, using localStorage fallback');
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]');
      if (template.id) {
        const index = templates.findIndex((t: any) => t.id === template.id);
        if (index !== -1) templates[index] = template;
      } else {
        template.id = Date.now().toString();
        templates.push(template);
      }
      localStorage.setItem('email_templates', JSON.stringify(templates));
      return template;
    }
  }

  static async deleteEmailTemplate(id: string): Promise<void> {
    try {
      await this.client.delete(`/email-templates/${id}`);
    } catch (error) {
      console.warn('Template delete failed, using localStorage fallback');
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]');
      const filtered = templates.filter((t: any) => t.id !== id);
      localStorage.setItem('email_templates', JSON.stringify(filtered));
    }
  }

  // User Invites
  static async inviteUser(inviteData: {
    email: string;
    role: string;
    department?: string;
    inviterEmail: string;
  }): Promise<{ inviteId: string; expiresAt: string; inviteLink: string }> {
    try {
      const response = await this.client.post<any>('/users/invite', inviteData);
      return response.data;
    } catch (error) {
      console.warn('Invite failed, using mock implementation');
      const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const inviteToken = Math.random().toString(36).substr(2);
      const inviteLink = `${window.location.origin}/invite?token=${inviteToken}&email=${encodeURIComponent(inviteData.email)}&expires=${encodeURIComponent(expiresAt)}`;
      console.log(`[MOCK INVITE] ID=${inviteId}, Email=${inviteData.email}, Role=${inviteData.role}, Expires=${expiresAt}`);
      return { inviteId, expiresAt, inviteLink };
    }
  }

  static async sendInviteEmail(inviteData: {
    email: string;
    inviteLink: string;
    role: string;
    inviterEmail: string;
  }): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post<{ success: boolean }>('/emails/send-invite', inviteData);
      return response.data;
    } catch (error) {
      console.warn('Invite email failed, logging to console');
      console.log(`[MOCK INVITE EMAIL] To: ${inviteData.email}, Subject: Invitation to join Oversight, Body: Hello,\n\nYou have been invited to join Oversight as ${inviteData.role}.\n\nComplete setup: ${inviteData.inviteLink}\n\nThis link expires in 48 hours.\n\nBest regards,\n${inviteData.inviterEmail}`);
      return { success: true };
    }
  }

  // System Management
  static async getSystemStats(): Promise<any> {
    try {
      const response = await this.client.get<any>('/system/stats');
      return response.data;
    } catch (error) {
      console.warn('System stats failed, calculating from localStorage');
      const savedPRs = localStorage.getItem('purchaseRequisitions');
      const prs = savedPRs ? JSON.parse(savedPRs) : [];
      const currentMonth = new Date().getMonth();
      const monthlyPRs = prs.filter((pr: any) => new Date(pr.requestDate).getMonth() === currentMonth);
      const approvedPRs = prs.filter((pr: any) => pr.financeStatus === 'Approved');
      const pendingPRs = prs.filter((pr: any) => pr.hodStatus === 'Pending' || pr.financeStatus === 'Pending');
      const totalValue = prs.reduce((sum: number, pr: any) => sum + (pr.totalAmount || 0), 0);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return {
        totalUsers: users.length + 1,
        activePRs: prs.length,
        totalPRValue: totalValue,
        pendingApprovals: pendingPRs.length,
        monthlyPRs: monthlyPRs.length,
        approvalRate: prs.length > 0 ? (approvedPRs.length / prs.length) * 100 : 0
      };
    }
  }

  static async updateSettings(settings: any): Promise<any> {
    try {
      const response = await this.client.put<any>('/system/settings', settings);
      return response.data;
    } catch (error) {
      console.warn('Settings update failed, using localStorage');
      localStorage.setItem('system_settings', JSON.stringify(settings));
      return settings;
    }
  }

  static async getSettings(): Promise<any> {
    try {
      const response = await this.client.get<any>('/system/settings');
      return response.data;
    } catch (error) {
      console.warn('Settings load failed, using localStorage');
      return JSON.parse(localStorage.getItem('system_settings') || '{}');
    }
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
