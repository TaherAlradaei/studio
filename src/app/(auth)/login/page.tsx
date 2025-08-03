
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { KeyRound } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, isUserRegistered, isLoading } = useAuth();
  const { t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Only redirect if login process is complete and user object is available
    if (!isLoggingIn && user) {
      if (isUserRegistered) {
        router.push('/booking');
      } else {
        router.push('/register-details');
      }
    }
  }, [user, isUserRegistered, isLoggingIn, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      // The useEffect will handle redirection once user state is updated.
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
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
        <Button onClick={handleGoogleLogin} className="w-full" variant="outline" disabled={isLoading || isLoggingIn}>
          <FcGoogle className="mr-2 h-5 w-5" />
          {isLoading || isLoggingIn ? t.adminPage.analyzingButton : t.auth.continueWithGoogle}
        </Button>
      </CardContent>
    </Card>
  );
}
