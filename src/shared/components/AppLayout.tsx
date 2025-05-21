import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { LogOut, FileText, Plus, Shield } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavButton = ({ 
    icon: Icon, 
    children, 
    onClick, 
    isActive 
  }: { 
    icon: typeof FileText; 
    children: React.ReactNode; 
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 w-full px-3 py-2 text-sm rounded-md transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-2 rounded">
              <Shield className="h-5 w-5" />
            </div>
            <h1 
              className="text-xl font-bold text-primary hover:text-primary/90 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              AuthPilot
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm">
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-56 bg-card border-r hidden md:block">
          <nav className="p-4 space-y-1">
            <NavButton 
              icon={FileText}
              onClick={() => navigate('/')}
              isActive={location.pathname === '/'}
            >
              Authorizations
            </NavButton>
            <NavButton 
              icon={Plus}
              onClick={() => navigate('/new-request')}
              isActive={location.pathname === '/new-request'}
            >
              New Request
            </NavButton>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
