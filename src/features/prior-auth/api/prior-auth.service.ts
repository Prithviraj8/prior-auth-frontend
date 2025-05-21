import { apiClient } from '@/shared/api/client';
import type { PriorAuthRequest, NewPriorAuthRequest } from '../types';

export const priorAuthService = {
  async getRequests(): Promise<PriorAuthRequest[]> {
    const { data } = await apiClient.get('/api/prior-auth');
    return data;
  },

  async getRequestById(id: string): Promise<PriorAuthRequest> {
    const { data } = await apiClient.get(`/api/prior-auth/${id}`);
    return data;
  },

  async createRequest(request: NewPriorAuthRequest): Promise<PriorAuthRequest> {
    const { data } = await apiClient.post('/api/prior-auth', request);
    return data;
  },

  async updateRequest(id: string, updates: Partial<PriorAuthRequest>): Promise<PriorAuthRequest> {
    const { data } = await apiClient.put(`/api/prior-auth/${id}`, updates);
    return data;
  },

  async submitAppeal(id: string, appealData: { reason: string; documents?: File[] }): Promise<PriorAuthRequest> {
    const formData = new FormData();
    formData.append('reason', appealData.reason);
    if (appealData.documents) {
      appealData.documents.forEach((doc) => formData.append('documents', doc));
    }
    const { data } = await apiClient.post(`/api/prior-auth/${id}/appeal`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
}; 