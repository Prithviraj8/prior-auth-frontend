import { supabase } from '@/shared/integrations/supabase/client';
import type { Database } from '@/shared/integrations/supabase/types';
import { AuthRequest, CreateAuthRequestData, UpdateAuthRequestData } from '@/features/prior-auth/contexts/AuthRequestContext';

const mapToAuthRequest = (row: Database['public']['Tables']['auth_requests']['Row']): AuthRequest => ({
  id: row.id,
  patient_name: row.patient_name,
  patient_id: row.patient_id,
  procedure_code: row.procedure_code,
  procedure_description: row.procedure_description,
  diagnosis_code: row.diagnosis_code,
  diagnosis_description: row.diagnosis_description,
  medical_justification: row.medical_justification,
  priority: row.priority as AuthRequest['priority'],
  payer_name: row.payer_name || undefined,
  payer_id: row.payer_id || undefined,
  status: row.status as AuthRequest['status'],
  submitted_at: row.submitted_at,
  updated_at: row.updated_at,
  provider_id: row.provider_id
});

export const PriorAuthService = {
  async getAll(): Promise<AuthRequest[]> {
    const { data, error } = await supabase
      .from('auth_requests')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data.map(mapToAuthRequest);
  },

  async getById(id: string): Promise<AuthRequest> {
    const { data, error } = await supabase
      .from('auth_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapToAuthRequest(data);
  },

  async create(dto: CreateAuthRequestData): Promise<AuthRequest> {
    const { data, error } = await supabase
      .from('auth_requests')
      .insert({
        patient_name: dto.patient_name,
        patient_id: dto.patient_id,
        procedure_code: dto.procedure_code,
        procedure_description: dto.procedure_description,
        diagnosis_code: dto.diagnosis_code,
        diagnosis_description: dto.diagnosis_description,
        medical_justification: dto.medical_justification,
        priority: dto.priority,
        payer_name: dto.payer_name || null,
        payer_id: dto.payer_id || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;
    return mapToAuthRequest(data);
  },

  async update(id: string, dto: UpdateAuthRequestData): Promise<AuthRequest> {
    const { data, error } = await supabase
      .from('auth_requests')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToAuthRequest(data);
  },
}; 