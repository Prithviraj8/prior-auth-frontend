export interface AuthRequest {
  id: string;
  patientName: string;
  patientDOB: string;
  insuranceProvider: string;
  procedureCode: string;
  diagnosisCode: string;
  status: AuthRequestStatus;
  submittedAt: string;
  updatedAt: string;
  providerId: string;
  notes?: string;
}

export type AuthRequestStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'ADDITIONAL_INFO_REQUIRED';

export interface CreateAuthRequestDTO {
  patientName: string;
  patientDOB: string;
  insuranceProvider: string;
  procedureCode: string;
  diagnosisCode: string;
  notes?: string;
}

export interface UpdateAuthRequestDTO {
  status?: AuthRequestStatus;
  notes?: string;
} 