
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { KeyRound } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleGoogleLogin = () => {
    // This is a simulated login.
    // In a real app, you would integrate with a Google Sign-In library.
    const simulatedUser = {
      name: "Guest User", // This is a temporary name
      phone: null, // Phone is unknown at this point
    };
    login(simulatedUser);
    router.push('/register-details');
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
        <Button onClick={handleGoogleLogin} className="w-full" variant="outline">
          <FcGoogle className="mr-2 h-5 w-5" />
          {t.auth.continueWithGoogle}
        </Button>
      </CardContent>
    </Card>
  );
}
