import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import LoginForm from '@/features/auth/components/LoginForm';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to the attempted URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary text-primary-foreground p-3 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-primary ml-3">AuthPilot</h1>
        </div>
        <p className="text-muted-foreground max-w-md">
          Streamlining prior authorization workflows for healthcare providers
        </p>
      </div>
      <LoginForm />
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Demo Accounts:</p>
        <p>Doctor: doctor@example.com / password</p>
        <p>Admin: admin@example.com / password</p>
      </div>
    </div>
  );
};

export default LoginPage;
