import { API_BASE_URL } from '@/shared/config';

export interface ExtractedFormData {
  patient_info: {
    name: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
    id: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
  };
  procedure_info: {
    code: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
    description: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
  };
  diagnosis_info: {
    primary_diagnosis: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
    symptoms: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
    affected_area: {
      value: string | null;
      confidence: number;
      is_missing: boolean;
      source_file: string;
    };
  };
  medical_justification: {
    value: string | null;
    confidence: number;
    is_missing: boolean;
    source_file: string;
  };
  processing_metadata: {
    model: string;
    total_tokens: string;
    completion_tokens: string;
    prompt_tokens: string;
  };
}

export async function extractFormData(files: File[]): Promise<ExtractedFormData> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/extract-form-data`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to extract form data');
  }

  return response.json();
} 