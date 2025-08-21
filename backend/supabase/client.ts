import { secret } from "encore.dev/config";

const supabaseUrl = secret("SupabaseUrl");
const supabaseServiceKey = secret("SupabaseServiceKey");

interface SupabaseResponse<T = any> {
  data: T | null;
  error: any;
}

class SupabaseClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = supabaseUrl();
    this.apiKey = supabaseServiceKey();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<SupabaseResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "apikey": this.apiKey,
          "Prefer": "return=representation",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: { message: error, status: response.status } };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async select<T>(table: string, query: string = "*", filters?: Record<string, any>): Promise<SupabaseResponse<T[]>> {
    let path = `/${table}?select=${query}`;
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        path += `&${key}=eq.${value}`;
      });
    }

    return this.request<T[]>("GET", path);
  }

  async insert<T>(table: string, data: any): Promise<SupabaseResponse<T>> {
    return this.request<T>("POST", `/${table}`, data);
  }

  async update<T>(table: string, data: any, filters: Record<string, any>): Promise<SupabaseResponse<T>> {
    let path = `/${table}`;
    
    Object.entries(filters).forEach(([key, value], index) => {
      path += `${index === 0 ? '?' : '&'}${key}=eq.${value}`;
    });

    return this.request<T>("PATCH", path, data);
  }

  async delete<T>(table: string, filters: Record<string, any>): Promise<SupabaseResponse<T>> {
    let path = `/${table}`;
    
    Object.entries(filters).forEach(([key, value], index) => {
      path += `${index === 0 ? '?' : '&'}${key}=eq.${value}`;
    });

    return this.request<T>("DELETE", path);
  }

  async rpc<T>(functionName: string, params?: any): Promise<SupabaseResponse<T>> {
    return this.request<T>("POST", `/rpc/${functionName}`, params);
  }
}

export const supabase = new SupabaseClient();
