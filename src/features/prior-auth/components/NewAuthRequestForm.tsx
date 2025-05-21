import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRequest } from '@/features/prior-auth/contexts/AuthRequestContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ChevronLeft, Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/integrations/supabase/client';
import { FileUploadDialog } from './FileUploadDialog';
import { extractFormData } from '../api/formExtraction';
import { cn } from '@/shared/lib/utils';

export function NewAuthRequestForm() {
  const navigate = useNavigate();
  const { createRequest } = useAuthRequest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingJustification, setIsGeneratingJustification] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    procedureCode: '',
    procedureDescription: '',
    diagnosisCode: '',
    diagnosisDescription: '',
    justification: '',
    urgency: 'standard' as 'standard' | 'urgent' | 'emergency',
    payerName: '',
    payerId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    // Remove field from missing fields when user enters data
    if (value.trim() && missingFields.has(name)) {
      const newMissingFields = new Set(missingFields);
      newMissingFields.delete(name);
      setMissingFields(newMissingFields);
    }
  };

  const handleRadioChange = (value: string) => {
    setFormData(prevData => ({ ...prevData, urgency: value as 'standard' | 'urgent' | 'emergency' }));
  };

  const handleUploadAndExtract = async (files: File[]) => {
    setIsExtracting(true);
    const loadingToast = toast.loading('Extracting information from documents...');
    const newMissingFields = new Set<string>();

    try {
      const extractedData = await extractFormData(files);
      
      // Check each field and track missing ones
      if (!extractedData.patient_info.name.value || extractedData.patient_info.name.is_missing) {
        newMissingFields.add('patientName');
      }
      if (!extractedData.patient_info.id.value || extractedData.patient_info.id.is_missing) {
        newMissingFields.add('patientId');
      }
      if (!extractedData.procedure_info.code.value || extractedData.procedure_info.code.is_missing) {
        newMissingFields.add('procedureCode');
      }
      if (!extractedData.procedure_info.description.value || extractedData.procedure_info.description.is_missing) {
        newMissingFields.add('procedureDescription');
      }
      if (!extractedData.diagnosis_info.primary_diagnosis.value || extractedData.diagnosis_info.primary_diagnosis.is_missing) {
        newMissingFields.add('diagnosisCode');
      }
      if (!extractedData.diagnosis_info.symptoms.value || extractedData.diagnosis_info.symptoms.is_missing) {
        newMissingFields.add('diagnosisDescription');
      }
      if (!extractedData.medical_justification.value || extractedData.medical_justification.is_missing) {
        newMissingFields.add('justification');
      }

      setMissingFields(newMissingFields);
      
      // Update form data with extracted information
      setFormData(prevData => ({
        ...prevData,
        patientName: extractedData.patient_info.name.value || prevData.patientName,
        patientId: extractedData.patient_info.id.value || prevData.patientId,
        procedureCode: extractedData.procedure_info.code.value || prevData.procedureCode,
        procedureDescription: extractedData.procedure_info.description.value || prevData.procedureDescription,
        diagnosisCode: extractedData.diagnosis_info.primary_diagnosis.value || prevData.diagnosisCode,
        diagnosisDescription: extractedData.diagnosis_info.symptoms.value || prevData.diagnosisDescription,
        justification: extractedData.medical_justification.value || prevData.justification,
      }));

      toast.dismiss(loadingToast);
      if (newMissingFields.size > 0) {
        toast.warning(`Some information could not be extracted. Please fill in the highlighted fields manually.`);
      } else {
        toast.success('Information extracted successfully');
      }
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Failed to extract information:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to extract information from documents');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateJustification = async () => {
    const { procedureDescription, diagnosisDescription } = formData;
    
    if (!procedureDescription || !diagnosisDescription) {
      toast.error('Please enter procedure and diagnosis information to generate a justification');
      return;
    }
    
    setIsGeneratingJustification(true);
    toast.loading('Generating medical justification...');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-justification', {
        body: {
          procedureDescription,
          diagnosisDescription
        }
      });
      
      if (error) {
        console.error('Error invoking generate-justification function:', error);
        toast.error('Failed to generate justification');
        return;
      }
      
      if (!data || !data.justification) {
        toast.error('Failed to generate justification');
        return;
      }
      
      setFormData(prevData => ({ ...prevData, justification: data.justification }));
      toast.success('Justification generated successfully');
    } catch (err) {
      console.error('Failed to generate justification:', err);
      toast.error('Failed to generate justification');
    } finally {
      setIsGeneratingJustification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    const requiredFields = ['patientName', 'patientId', 'procedureCode', 'procedureDescription', 'diagnosisCode', 'diagnosisDescription', 'justification'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please complete the following fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Convert urgency to proper priority format
      const priorityMap = {
        'standard': 'Standard',
        'urgent': 'Urgent',
        'emergency': 'Emergency'
      } as const;

      const requestData = {
        patient_name: formData.patientName,
        patient_id: formData.patientId,
        procedure_code: formData.procedureCode,
        procedure_description: formData.procedureDescription,
        diagnosis_code: formData.diagnosisCode,
        diagnosis_description: formData.diagnosisDescription,
        medical_justification: formData.justification,
        priority: priorityMap[formData.urgency],
        payer_name: formData.payerName || undefined,
        payer_id: formData.payerId || undefined,
      };

      await createRequest(requestData);
      // Navigate to the main authorizations page
      navigate('/');
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('Failed to create authorization request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <h2 className="text-2xl font-semibold text-gray-800">New Prior Authorization Request</h2>
        <div className="w-[100px]"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Complete the form below to create a new prior authorization request
          </CardDescription>
          {missingFields.size > 0 && (
            <div className="mt-2 flex items-center text-yellow-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              Some fields could not be extracted from the documents. Please fill them in manually.
            </div>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Pre-Fill with AI
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName" className={cn(missingFields.has('patientName') && "text-yellow-600")}>
                    Patient Name {missingFields.has('patientName') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    placeholder="Full patient name"
                    className={cn(missingFields.has('patientName') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId" className={cn(missingFields.has('patientId') && "text-yellow-600")}>
                    Patient ID {missingFields.has('patientId') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="patientId"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    placeholder="Patient identifier"
                    className={cn(missingFields.has('patientId') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Procedure Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="procedureCode" className={cn(missingFields.has('procedureCode') && "text-yellow-600")}>
                    Procedure Code {missingFields.has('procedureCode') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="procedureCode"
                    name="procedureCode"
                    value={formData.procedureCode}
                    onChange={handleChange}
                    placeholder="CPT or HCPCS code"
                    className={cn(missingFields.has('procedureCode') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="procedureDescription" className={cn(missingFields.has('procedureDescription') && "text-yellow-600")}>
                    Procedure Description {missingFields.has('procedureDescription') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="procedureDescription"
                    name="procedureDescription"
                    value={formData.procedureDescription}
                    onChange={handleChange}
                    placeholder="Name of procedure"
                    className={cn(missingFields.has('procedureDescription') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Diagnosis Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosisCode" className={cn(missingFields.has('diagnosisCode') && "text-yellow-600")}>
                    Diagnosis Code {missingFields.has('diagnosisCode') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="diagnosisCode"
                    name="diagnosisCode"
                    value={formData.diagnosisCode}
                    onChange={handleChange}
                    placeholder="ICD-10 code"
                    className={cn(missingFields.has('diagnosisCode') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosisDescription" className={cn(missingFields.has('diagnosisDescription') && "text-yellow-600")}>
                    Diagnosis Description {missingFields.has('diagnosisDescription') && <span className="text-sm">(not found)</span>}
                  </Label>
                  <Input
                    id="diagnosisDescription"
                    name="diagnosisDescription"
                    value={formData.diagnosisDescription}
                    onChange={handleChange}
                    placeholder="Description of diagnosis"
                    className={cn(missingFields.has('diagnosisDescription') && "border-yellow-500 focus:ring-yellow-500")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Medical Justification</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateJustification}
                  disabled={isGeneratingJustification}
                >
                  {isGeneratingJustification ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate with AI'
                  )}
                </Button>
              </div>
              <Textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Provide clinical rationale for why this procedure is medically necessary"
                rows={5}
                className={cn(missingFields.has('justification') && "border-yellow-500 focus:ring-yellow-500")}
              />
              {missingFields.has('justification') && (
                <p className="text-sm text-yellow-600">Medical justification was not found in the documents</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Request Priority</h3>
              <RadioGroup 
                value={formData.urgency} 
                onValueChange={handleRadioChange}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent">Urgent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" />
                  <Label htmlFor="emergency">Emergency</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Insurance Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payerName">Payer Name</Label>
                  <Input
                    id="payerName"
                    name="payerName"
                    value={formData.payerName}
                    onChange={handleChange}
                    placeholder="Insurance company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payerId">Payer ID</Label>
                  <Input
                    id="payerId"
                    name="payerId"
                    value={formData.payerId}
                    onChange={handleChange}
                    placeholder="Insurance identifier"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-authblue-500 hover:bg-authblue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUploadAndExtract}
      />
    </div>
  );
}
