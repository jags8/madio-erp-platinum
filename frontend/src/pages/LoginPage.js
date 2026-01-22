import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(phone, pin);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1615634364452-8daf3851f2f1)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-sm bg-primary flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">
              BizFlow Central
            </h1>
            <p className="text-sm text-muted-foreground">Premium CRM for Luxury Business</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                data-testid="phone-input"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-white/50 border-input focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                PIN
              </Label>
              <Input
                id="pin"
                data-testid="pin-input"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={6}
                className="bg-white/50 border-input focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full rounded-sm uppercase tracking-wider font-medium transition-all duration-300"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            For architect referral based premium business
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
