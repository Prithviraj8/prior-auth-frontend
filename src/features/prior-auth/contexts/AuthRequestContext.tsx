// Updated AuthRequestContext.tsx with proper refetching after create
import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/integrations/supabase/client';
import { useToast } from '@/shared/components/ui/use-toast';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { API_BASE_URL } from '@/shared/config';

export interface AuthRequest {
  id: string;
  patient_name: string;
  patient_id: string;
  procedure_code: string;
  procedure_description: string;
  diagnosis_code: string;
  diagnosis_description: string;
  medical_justification: string;
  priority: 'Standard' | 'Urgent' | 'Emergency';
  payer_name?: string;
  payer_id?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'ADDITIONAL_INFO_REQUIRED';
  submitted_at: string;
  updated_at: string;
  provider_id: string;
}

export interface CreateAuthRequestData {
  patient_name: string;
  patient_id: string;
  procedure_code: string;
  procedure_description: string;
  diagnosis_code: string;
  diagnosis_description: string;
  medical_justification: string;
  priority: 'Standard' | 'Urgent' | 'Emergency';
  payer_name?: string;
  payer_id?: string;
}

export interface UpdateAuthRequestData {
  status?: AuthRequest['status'];
  medical_justification?: string;
}

interface AuthRequestContextType {
  requests: AuthRequest[];
  isLoading: boolean;
  error: Error | null;
  createRequest: (data: CreateAuthRequestData) => Promise<AuthRequest>;
  updateRequest: (id: string, data: UpdateAuthRequestData) => Promise<AuthRequest>;
  deleteRequest: (id: string) => Promise<void>;
}

const AuthRequestContext = createContext<AuthRequestContextType | undefined>(undefined);

export function AuthRequestProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['authRequests'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError || !profile) return [];
      const { data: providerRequests, error: providerError } = await supabase
        .from('auth_requests')
        .select('*')
        .eq('provider_id', profile.id)
        .order('submitted_at', { ascending: false });
      if (providerError) throw providerError;
      return providerRequests || [];
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAuthRequestData) => {
      const HARDCODED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucG5hdmZydWJtbHh3c3BjdWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc1OTkwNywiZXhwIjoyMDYzMzM1OTA3fQ.RKfHI7e7SnGHXOCAIVJM1FTjfTd0yTip2NTlmpBvJZo';
      const response = await fetch(`${API_BASE_URL}/api/v1/auth-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HARDCODED_TOKEN}`,
        },
        body: JSON.stringify({
          ...data,
          status: 'PENDING',
          provider_id: user?.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
        throw new Error(errorData.detail || 'Failed to create authorization request');
      }
      return await response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['authRequests'] });
      toast({
        title: 'Success',
        description: `Prior authorization request for ${data.patient_name} has been created and is pending review.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAuthRequestData }) => {
      const { data: response, error } = await supabase
        .from('auth_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authRequests'] });
      toast({ title: 'Success', description: 'Prior authorization request updated successfully' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auth_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authRequests'] });
      toast({ title: 'Success', description: 'Prior authorization request deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const createRequest = async (data: CreateAuthRequestData) => {
    const newRequest = await createMutation.mutateAsync(data);
    return newRequest;
  };

  const updateRequest = async (id: string, data: UpdateAuthRequestData) => {
    return await updateMutation.mutateAsync({ id, data });
  };

  const deleteRequest = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <AuthRequestContext.Provider
      value={{
        requests,
        isLoading,
        error,
        createRequest,
        updateRequest,
        deleteRequest,
      }}
    >
      {children}
    </AuthRequestContext.Provider>
  );
}

export function useAuthRequest() {
  const context = useContext(AuthRequestContext);
  if (context === undefined) {
    throw new Error('useAuthRequest must be used within an AuthRequestProvider');
  }
  return context;
}
