export interface AuthRequest {
  id: string;
  patientName: string;
  patientId: string;
  procedureCode: string;
  procedureDescription: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  justification: string;
  status: 'draft' | 'submitted' | 'approved' | 'denied';
  urgency: 'standard' | 'urgent' | 'emergency';
  payerName?: string;
  payerId?: string;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  submittedDate?: string;
  responseDate?: string;
  responseNotes?: string;
} 