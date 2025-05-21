import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priorAuthService } from '../api/prior-auth.service';
import type { NewPriorAuthRequest, PriorAuthRequest } from '../types';

export const usePriorAuthRequests = () => {
  return useQuery({
    queryKey: ['prior-auth-requests'],
    queryFn: () => priorAuthService.getRequests(),
  });
};

export const usePriorAuthRequest = (id: string) => {
  return useQuery({
    queryKey: ['prior-auth-request', id],
    queryFn: () => priorAuthService.getRequestById(id),
    enabled: !!id,
  });
};

export const useCreatePriorAuth = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: NewPriorAuthRequest) => priorAuthService.createRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prior-auth-requests'] });
    },
  });
};

export const useUpdatePriorAuth = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PriorAuthRequest> }) => 
      priorAuthService.updateRequest(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prior-auth-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prior-auth-request', data.id] });
    },
  });
};

export const useSubmitAppeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, appealData }: { id: string; appealData: { reason: string; documents?: File[] } }) =>
      priorAuthService.submitAppeal(id, appealData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prior-auth-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prior-auth-request', data.id] });
    },
  });
}; 