
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthRequest } from '@/features/prior-auth/contexts/AuthRequestContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertCircle, ChevronLeft, Check, X, FileText } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';

export function AuthRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRequestById, updateStatus, generateAppeal } = useAuthRequest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  
  const request = id ? getRequestById(id) : undefined;
  
  if (!request) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Request Not Found</h3>
        <p className="mt-1 text-gray-500">The authorization request you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitToPayer = async () => {
    if (request.status !== 'draft') {
      toast.error('Only draft requests can be submitted');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateStatus(request.id, 'submitted');
      toast.success('Request submitted to payer successfully');
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAppeal = async () => {
    if (request.status !== 'denied') {
      toast.error('Appeals can only be generated for denied requests');
      return;
    }
    
    setIsGeneratingAppeal(true);
    try {
      const appeal = await generateAppeal(request.id);
      if (appeal) {
        setAppealText(appeal);
        setIsAppealDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to generate appeal:', error);
    } finally {
      setIsGeneratingAppeal(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <div className="flex space-x-2">
          {request.status === 'draft' && (
            <Button 
              onClick={handleSubmitToPayer}
              className="bg-authblue-500 hover:bg-authblue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit to Payer'}
            </Button>
          )}
          {request.status === 'denied' && (
            <Button 
              onClick={handleGenerateAppeal}
              variant="outline"
              disabled={isGeneratingAppeal}
            >
              {isGeneratingAppeal ? 'Generating...' : 'Generate Appeal'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{request.patientName}</CardTitle>
                <CardDescription>Patient ID: {request.patientId}</CardDescription>
              </div>
              <span className={`status-badge ${getStatusClass(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="justification">Medical Justification</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Procedure</h4>
                    <p className="font-medium">{request.procedureDescription}</p>
                    <p className="text-sm text-gray-500">Code: {request.procedureCode}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Diagnosis</h4>
                    <p className="font-medium">{request.diagnosisDescription}</p>
                    <p className="text-sm text-gray-500">Code: {request.diagnosisCode}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Urgency</h4>
                    <p className="font-medium capitalize">{request.urgency}</p>
                  </div>
                  {request.payerName && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-500">Insurance</h4>
                      <p className="font-medium">{request.payerName}</p>
                      {request.payerId && <p className="text-sm text-gray-500">ID: {request.payerId}</p>}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="justification" className="pt-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Medical Justification</h4>
                  <p className="whitespace-pre-wrap text-gray-700">{request.justification}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Request Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString()} by {request.creatorName}
                      </p>
                    </div>
                  </div>
                  
                  {request.submittedDate && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Request Submitted</p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.submittedDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {request.responseDate && (
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full ${request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                        {request.status === 'approved' ? 
                          <Check className="h-5 w-5 text-green-600" /> : 
                          <X className="h-5 w-5 text-red-600" />
                        }
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">
                          Request {request.status === 'approved' ? 'Approved' : 'Denied'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.responseDate).toLocaleString()}
                        </p>
                        {request.responseNotes && (
                          <p className="mt-1 text-sm text-gray-700">{request.responseNotes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Created By</p>
              <p>{request.creatorName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Created On</p>
              <p>{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p>{new Date(request.updatedAt).toLocaleDateString()}</p>
            </div>
            {request.submittedDate && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Submitted On</p>
                <p>{new Date(request.submittedDate).toLocaleDateString()}</p>
              </div>
            )}
            {request.payerName && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Insurance</p>
                <p>{request.payerName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generated Appeal Letter</DialogTitle>
            <DialogDescription>
              This is an AI-generated appeal letter based on the request details. 
              You can copy and use this as a starting point.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Textarea 
              value={appealText} 
              onChange={(e) => setAppealText(e.target.value)}
              className="font-mono h-[400px]"
            />
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(appealText);
                toast.success('Appeal copied to clipboard');
              }}
            >
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
