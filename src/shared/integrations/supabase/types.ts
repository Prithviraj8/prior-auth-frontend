export type Database = {
  public: {
    Tables: {
      auth_requests: {
        Row: {
          id: string;
          patient_name: string;
          patient_id: string;
          procedure_code: string;
          procedure_description: string;
          diagnosis_code: string;
          diagnosis_description: string;
          medical_justification: string;
          priority: string;
          payer_name: string | null;
          payer_id: string | null;
          status: string;
          submitted_at: string;
          updated_at: string;
          provider_id: string;
        };
        Insert: Omit<Database['public']['Tables']['auth_requests']['Row'], 'id' | 'submitted_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['auth_requests']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'doctor';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
    };
  };
}; 