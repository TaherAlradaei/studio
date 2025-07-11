
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    if (name.trim() && phone.trim()) {
      login({ name, phone });
      router.push('/booking');
    }
  };

  return (
    <Card className="max-w-md w-full bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-4 mb-2">
            <KeyRound className="w-12 h-12 text-primary"/>
        </div>
        <CardTitle className="text-3xl font-bold font-headline text-primary">{t.auth.createAccountTitle}</CardTitle>
        <CardDescription>{t.auth.createAccountDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t.bookingForm.nameLabel}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t.bookingForm.namePlaceholder} 
            />
          </div>
          <div>
            <Label htmlFor="phone">{t.bookingForm.phoneLabel}</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder={t.bookingForm.phonePlaceholder} 
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            {t.auth.continue}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
