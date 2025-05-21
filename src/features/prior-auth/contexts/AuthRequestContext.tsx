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

  console.log('AuthRequestProvider - User:', user?.id);

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['authRequests'],
    queryFn: async () => {
      console.log('Starting auth requests query...');
      if (!user?.id) {
        console.error('No user ID available');
        return [];
      }

      try {
        // First get the user's profile to check their role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('User profile:', {
          id: user.id,
          profile,
          error: profileError
        });

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.error('No profile found for user');
          return [];
        }

        // Get the requests for this provider
        const { data: providerRequests, error: providerError } = await supabase
          .from('auth_requests')
          .select('*')
          .eq('provider_id', profile.id)
          .order('submitted_at', { ascending: false });

        console.log('Provider requests:', {
          providerId: profile.id,
          count: providerRequests?.length || 0,
          error: providerError
        });

        if (providerError) {
          console.error('Error fetching provider requests:', providerError);
          throw providerError;
        }

        return providerRequests || [];
      } catch (err) {
        console.error('Error in auth requests query:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch authorization requests',
        });
        throw err;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAuthRequestData) => {
      console.log('Starting createRequest mutation with data:', data);
      
      try {
        const HARDCODED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucG5hdmZydWJtbHh3c3BjdWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc1OTkwNywiZXhwIjoyMDYzMzM1OTA3fQ.RKfHI7e7SnGHXOCAIVJM1FTjfTd0yTip2NTlmpBvJZo';

        console.log('Making API request to:', `${API_BASE_URL}/api/v1/auth-requests/`);
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

        console.log('API Response:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
          console.error('API Error:', errorData);
          throw new Error(errorData.detail || 'Failed to create authorization request');
        }

        const responseData = await response.json();
        console.log('API Success Response:', responseData);
        return responseData;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation succeeded with data:', data);
      queryClient.invalidateQueries({ queryKey: ['authRequests'] });
      toast({
        title: 'Success',
        description: `Prior authorization request for ${data.patient_name} has been created and is pending review.`,
      });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error);
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
      toast({
        title: 'Success',
        description: 'Prior authorization request updated successfully',
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auth_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authRequests'] });
      toast({
        title: 'Success',
        description: 'Prior authorization request deleted successfully',
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

  const createRequest = async (data: CreateAuthRequestData) => {
    const newRequest = await createMutation.mutateAsync(data);
    return newRequest;
  };

  const updateRequest = async (id: string, data: UpdateAuthRequestData) => {
    const updatedRequest = await updateMutation.mutateAsync({ id, data });
    return updatedRequest;
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