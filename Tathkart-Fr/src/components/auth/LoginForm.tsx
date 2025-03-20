
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { motion } from 'framer-motion';
import { LucideLoader2, UserCircle, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  role: UserRole;
}

const LoginForm: React.FC<LoginFormProps> = ({ role }) => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Debug logs to verify input values
      console.log("Login attempt:", { phoneOrEmail, password, role });
      
      const success = await login(phoneOrEmail, password, role);
      console.log("Login result:", success);
      
      if (success) {
        toast.success(`Logged in successfully as ${role}`);
        // Redirect based on role
        switch (role) {
          case 'user':
            navigate('/user');
            break;
          case 'admin':
            navigate('/admin');
            break;
          case 'delivery':
            navigate('/delivery');
            break;
        }
      } else {
        toast.error("Invalid credentials. Please check your login details.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Title and description based on role
  const getRoleInfo = () => {
    switch (role) {
      case 'user':
        return {
          title: 'User Login',
          description: 'Login to place orders for your restaurant',
          inputLabel: 'Phone Number',
          inputType: 'tel',
          placeholder: 'Enter your phone number',
          needsPassword: false,
          icon: <UserCircle className="mr-2 h-5 w-5 text-tathkart-gold" />
        };
      case 'admin':
        return {
          title: 'Admin Login',
          description: 'Login to manage orders and users',
          inputLabel: 'Email',
          inputType: 'email',
          placeholder: 'Enter your email',
          needsPassword: true,
          icon: <UserCircle className="mr-2 h-5 w-5 text-tathkart-gold" />
        };
      case 'delivery':
        return {
          title: 'Delivery Login',
          description: 'Login to view and deliver orders',
          inputLabel: 'Email',
          inputType: 'email',
          placeholder: 'Enter your email',
          needsPassword: true,
          icon: <UserCircle className="mr-2 h-5 w-5 text-tathkart-gold" />
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-white border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-tathkart-800 text-white pb-6">
          <CardTitle className="text-xl flex items-center">{roleInfo.icon} {roleInfo.title}</CardTitle>
          <CardDescription className="text-tathkart-100">{roleInfo.description}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="phoneOrEmail" className="text-gray-700">{roleInfo.inputLabel}</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {roleInfo.inputType === 'email' ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <Input
                  id="phoneOrEmail"
                  type={roleInfo.inputType}
                  placeholder={roleInfo.placeholder}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {roleInfo.needsPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            
            {role === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="note" className="text-gray-700">Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Any special instructions"
                  className="min-h-[80px]"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="pb-6">
            <Button 
              type="submit" 
              className="w-full bg-tathkart-gold hover:bg-amber-500 text-tathkart-800 font-medium"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default LoginForm;
