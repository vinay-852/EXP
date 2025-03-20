
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { UserRole, useAuth } from '../context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import PageTransition from '@/components/layout/PageTransition';
import BrandLogo from '@/components/ui/brand-logo';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login = () => {
  const { role } = useParams<{ role: string }>();
  const { isAuthenticated, user } = useAuth();
  
  // Validate role
  const validRole = ['user', 'admin', 'delivery'].includes(role || '') 
    ? role as UserRole 
    : null;
  
  // If no valid role is provided, redirect to role selection
  if (!validRole) {
    return <Navigate to="/role" replace />;
  }
  
  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    if (user.role === 'user') return <Navigate to="/user" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-tathkart-800">
        <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
          <div className="text-left mb-6">
            <Link to="/role" className="inline-flex items-center text-white hover:text-tathkart-gold transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Back to roles</span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <BrandLogo className="mx-auto" />
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <LoginForm role={validRole} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
