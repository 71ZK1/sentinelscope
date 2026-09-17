// src/lib/api.ts
// Frontend API Client for SentinelScope

import {
  Target,
  Scan,
  Asset,
  Finding,
  DashboardStats,
  AttackSurfaceGraphData,
  HistoricalChange,
  Notification,
  User,
} from '../types';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sentinelscope_token') : null;
      const authHeaders: Record<string, string> = {};
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        let errMsg = `Request failed with status ${res.status}`;
        try {
          const errorJson = await res.json();
          if (errorJson.error) errMsg = errorJson.error;
        } catch {
          // use default
        }

        if (res.status === 401 && endpoint !== '/auth/login') {
          // Session expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sentinelscope_token');
          }
        }

        throw new Error(errMsg);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network'))) {
        // Wait 300ms and retry once for transient server restart/reload
        await new Promise((resolve) => setTimeout(resolve, 300));
        return this.request<T>(endpoint, options, retries - 1);
      }
      throw err;
    }
  }

  // Auth
  async login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string; redirect?: string; message?: string }> {
    const res = await this.request<{ user: User; token: string; redirect?: string; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('sentinelscope_token', res.token);
    }
    return res;
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      await this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sentinelscope_token');
    }
    return { success: true };
  }

  async register(email: string, name: string, password: string): Promise<{ user: User; token: string; redirect?: string; message?: string }> {
    const res = await this.request<{ user: User; token: string; redirect?: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('sentinelscope_token', res.token);
    }
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Admin Management & Security Audit Logs
  async getAdminUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/admin/users');
  }

  async getAdminAuditLogs(): Promise<{ logs: import('../types').UserAuditLog[] }> {
    return this.request<{ logs: import('../types').UserAuditLog[] }>('/admin/audit-logs');
  }

  async deleteAuditLog(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/audit-logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async clearAllAuditLogs(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/audit-logs', {
      method: 'DELETE',
    });
  }

  async getSecurityPerimeterStatus(): Promise<{
    status: string;
    lockoutThreshold: number;
    lockoutDurationMinutes: number;
    activeLockouts: Array<{ target: string; type: 'IP' | 'ACCOUNT'; remainingSeconds: number; failureCount: number }>;
    totalTrackedEntities: number;
    protectionFeatures: string[];
  }> {
    return this.request<any>('/admin/security-perimeter');
  }

  async unlockSecurityPerimeter(target: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/security-perimeter/unlock', {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  }

  // HTTP Security Repeater & Probe
  async sendRepeaterProbe(params: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{
    success: boolean;
    url: string;
    method: string;
    statusCode?: number;
    statusText?: string;
    latencyMs: number;
    headers?: Record<string, string>;
    body?: string;
    bodySize?: number;
    securityAudit?: {
      hasHsts: boolean;
      hstsValue: string;
      hasCsp: boolean;
      cspValue: string;
      hasXContentTypeOptions: boolean;
      hasXFrameOptions: boolean;
      xFrameOptionsValue: string;
      hasReferrerPolicy: boolean;
      referrerPolicyValue: string;
      hasPermissionsPolicy: boolean;
      corsHeader: string;
      serverBanner: string | null;
      xPoweredBy: string | null;
      cookies: string | null;
    };
    error?: string;
  }> {
    return this.request('/probe/repeater', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Dashboard Stats
  async getStats(targetId?: string): Promise<DashboardStats> {
    const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<DashboardStats>(`/stats${query}`);
  }

  // Targets
  async getTargets(): Promise<Target[]> {
    return this.request<Target[]>('/targets');
  }

  async getTarget(id: string): Promise<Target> {
    return this.request<Target>(`/targets/${encodeURIComponent(id)}`);
  }

  async addTarget(data: {
    domain: string;
    authorizedBy: string;
    isConfirmed: boolean;
    tags?: string[];
    notes?: string;
  }): Promise<{ target: Target; scan: Scan }> {
    return this.request<{ target: Target; scan: Scan }>('/targets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTarget(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/targets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async purgeAllTargets(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/targets/purge-all', {
      method: 'POST',
    });
  }

  // Scans
  async getScans(targetId?: string): Promise<Scan[]> {
    const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<Scan[]>(`/scans${query}`);
  }

  async getScan(id: string): Promise<Scan> {
    return this.request<Scan>(`/scans/${encodeURIComponent(id)}`);
  }

  async triggerScan(targetId: string, scanType = 'FULL_RECON'): Promise<Scan> {
    return this.request<Scan>(`/targets/${encodeURIComponent(targetId)}/scans`, {
      method: 'POST',
      body: JSON.stringify({ scanType }),
    });
  }

  // Assets
  async getAssets(targetId?: string): Promise<Asset[]> {
    const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<Asset[]>(`/assets${query}`);
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${encodeURIComponent(id)}`);
  }

  // Findings
  async getFindings(filters?: { targetId?: string; assetId?: string; severity?: string; status?: string }): Promise<Finding[]> {
    const params = new URLSearchParams();
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.assetId) params.append('assetId', filters.assetId);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Finding[]>(`/findings${q}`);
  }

  async updateFindingStatus(id: string, status: Finding['status']): Promise<Finding> {
    return this.request<Finding>(`/findings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Graph
  async getGraph(targetId?: string): Promise<AttackSurfaceGraphData> {
    const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<AttackSurfaceGraphData>(`/graph${query}`);
  }

  // Changes
  async getChanges(targetId?: string): Promise<HistoricalChange[]> {
    const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<HistoricalChange[]>(`/changes${query}`);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Demo Reset
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/demo/reset', {
      method: 'POST',
    });
  }

  // Reports
  async getReport(targetId: string): Promise<any> {
    return this.request<any>(`/reports/${encodeURIComponent(targetId)}`);
  }

  // Endpoints & Parameter Discovery
  async getEndpoints(filters?: { targetId?: string; isApi?: boolean; hasParameters?: boolean }): Promise<import('../types').DiscoveredEndpoint[]> {
    const params = new URLSearchParams();
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.isApi !== undefined) params.append('isApi', String(filters.isApi));
    if (filters?.hasParameters !== undefined) params.append('hasParameters', String(filters.hasParameters));
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<import('../types').DiscoveredEndpoint[]>(`/endpoints${q}`);
  }

  // HTTP Traffic History & Proxy Logs
  async getTraffic(targetId?: string): Promise<import('../types').HttpTrafficItem[]> {
    const q = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    return this.request<import('../types').HttpTrafficItem[]>(`/traffic${q}`);
  }

  async addTraffic(item: Partial<import('../types').HttpTrafficItem>): Promise<import('../types').HttpTrafficItem> {
    return this.request<import('../types').HttpTrafficItem>('/traffic', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async clearTraffic(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/traffic', {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
