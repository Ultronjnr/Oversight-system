
// API service for backend integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Quote {
  id: string;
  date: string;
  item: string;
  amount: string;
  description: string;
  comment: string;
  sourceDocument?: File | null;
  requestedBy: string;
  requestedByName?: string;
  requestedByRole?: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  history: Array<{
    status: string;
    date: Date;
    by: string;
  }>;
  createdAt: Date;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
}

interface SageEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getFormDataHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  // Quotes
  async createQuote(quoteData: FormData): Promise<Quote> {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: this.getFormDataHeaders(),
      body: quoteData,
    });
    return response.json();
  }

  async getQuotes(filters?: { role?: string; status?: string }): Promise<Quote[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/quotes?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async updateQuoteStatus(quoteId: string, status: 'Approved' | 'Declined', role: 'HOD' | 'Finance') {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/${role.toLowerCase()}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return response.json();
  }

  async downloadDocument(quoteId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/document/download`, {
      headers: this.getAuthHeaders(),
    });
    return response.blob();
  }

  // Sage API integration
  async getSageEmployees(): Promise<SageEmployee[]> {
    const response = await fetch(`${API_BASE_URL}/sage/employees`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async getSageEmployee(employeeId: string): Promise<SageEmployee> {
    const response = await fetch(`${API_BASE_URL}/sage/employees/${employeeId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Financial Manager - All quotes access
  async getAllQuotesHistory(): Promise<Quote[]> {
    const response = await fetch(`${API_BASE_URL}/quotes/history/all`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }
}

export const apiService = new ApiService();
export type { Quote, SageEmployee };
