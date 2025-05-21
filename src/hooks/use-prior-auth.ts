import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PriorAuthService } from '@/services/prior-auth.service';
import type { CreateAuthRequestDTO, UpdateAuthRequestDTO } from '@/types/prior-auth';

export const useAuthRequests = () => {
  return useQuery({
    queryKey: ['auth-requests'],
    queryFn: () => PriorAuthService.getAll(),
  });
};

export const useAuthRequest = (id: string) => {
  return useQuery({
    queryKey: ['auth-request', id],
    queryFn: () => PriorAuthService.getById(id),
  });
};

export const useCreateAuthRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAuthRequestDTO) => PriorAuthService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-requests'] });
    },
  });
};

export const useUpdateAuthRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateAuthRequestDTO & { id: string }) =>
      PriorAuthService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auth-requests'] });
      queryClient.invalidateQueries({ queryKey: ['auth-request', variables.id] });
    },
  });
}; 