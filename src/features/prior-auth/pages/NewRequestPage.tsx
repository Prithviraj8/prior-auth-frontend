import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { AppLayout } from '@/shared/components/AppLayout';
import { NewAuthRequestForm } from '@/features/prior-auth/components/NewAuthRequestForm';

const NewRequestPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <NewAuthRequestForm />
    </AppLayout>
  );
};

export default NewRequestPage;
