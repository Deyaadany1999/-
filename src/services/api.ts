function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hse_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP error ${res.status}`;
    const err = new Error(errorMsg) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const api = {
  // Dashboard
  getDashboardStats: () => request<any>('/api/dashboard/stats'),

  // Equipment
  getEquipment: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/equipment${query ? `?${query}` : ''}`);
  },
  getEquipmentByCode: (code: string) => request<any>(`/api/equipment/${encodeURIComponent(code)}`),
  addEquipment: (data: any) =>
    request<any>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipment: (id: string, data: any) =>
    request<any>(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEquipment: (id: string, force = false) =>
    request<any>(`/api/equipment/${id}?force=${force}`, {
      method: 'DELETE',
    }),

  // Problems
  getProblems: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/problems${query ? `?${query}` : ''}`);
  },
  getProblemById: (id: string) => request<any>(`/api/problems/${id}`),
  addProblem: (data: any) =>
    request<any>('/api/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProblem: (id: string, data: any) =>
    request<any>(`/api/problems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  closeProblem: (id: string, data: { closedDate?: string; closeNotes?: string }) =>
    request<any>(`/api/problems/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reopenProblem: (id: string) =>
    request<any>(`/api/problems/${id}/reopen`, {
      method: 'POST',
    }),
  deleteProblem: (id: string) =>
    request<any>(`/api/problems/${id}`, {
      method: 'DELETE',
    }),
  uploadProblemImage: (id: string, data: { dataUrl: string; fileName: string; fileSize?: number }) =>
    request<any>(`/api/problems/${id}/images`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteProblemImage: (problemId: string, imageId: string) =>
    request<any>(`/api/problems/${problemId}/images/${imageId}`, {
      method: 'DELETE',
    }),

  // Employees
  getEmployees: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/employees${query ? `?${query}` : ''}`);
  },
  addEmployee: (data: any) =>
    request<any>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: string, data: any) =>
    request<any>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: string) =>
    request<any>(`/api/employees/${id}`, {
      method: 'DELETE',
    }),

  // Contractors
  getContractors: () => request<any[]>('/api/contractors'),
  addContractor: (data: any) =>
    request<any>('/api/contractors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContractor: (id: string, data: any) =>
    request<any>(`/api/contractors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteContractor: (id: string) =>
    request<any>(`/api/contractors/${id}`, {
      method: 'DELETE',
    }),

  // Equipment Types
  getEquipmentTypes: () => request<any[]>('/api/equipment-types'),
  addEquipmentType: (data: any) =>
    request<any>('/api/equipment-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users (Admin)
  getUsers: () => request<any[]>('/api/users'),
  addUser: (data: any) =>
    request<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<any>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetUserPassword: (id: string, newPassword: string) =>
    request<any>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  deleteUser: (id: string) =>
    request<any>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Roles & Permissions
  getRoles: () => request<any[]>('/api/roles'),
  getPermissions: () => request<any[]>('/api/permissions'),
  addRole: (data: any) =>
    request<any>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRole: (id: string, data: any) =>
    request<any>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRole: (id: string) =>
    request<any>(`/api/roles/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: async () => {
    try {
      return await request<any[]>('/api/notifications');
    } catch (e: any) {
      if (e?.status === 401) {
        return [];
      }
      throw e;
    }
  },
  markNotificationRead: (id: string) =>
    request<any>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    request<any>('/api/notifications/mark-all-read', {
      method: 'POST',
    }),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/api/audit-logs'),

  // Settings
  getSettings: () => request<any>('/api/settings'),
  updateSettings: (data: any) =>
    request<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Reports
  getReportsData: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/reports/data${query ? `?${query}` : ''}`);
  },

  // Global search
  globalSearch: (q: string) => request<any>(`/api/search?q=${encodeURIComponent(q)}`),
};
