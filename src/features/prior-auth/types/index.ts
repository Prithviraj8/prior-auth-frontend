export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  insuranceInfo: InsuranceInfo;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface PriorAuthRequest {
  id: string;
  patient: Patient;
  serviceType: string;
  status: 'pending' | 'approved' | 'denied' | 'appealing';
  clinicalInfo: {
    diagnosis: string;
    justification: string;
    attachments?: string[];
  };
  submittedAt: string;
  updatedAt: string;
}

export interface NewPriorAuthRequest {
  patientId: string;
  serviceType: string;
  clinicalInfo: {
    diagnosis: string;
    justification: string;
    attachments?: string[];
  };
} 