
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Using a simple SVG for the Google icon to avoid extra dependencies
const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.55 1.9-3.64 0-6.5-3-6.5-6.6s2.86-6.6 6.5-6.6c2.05 0 3.33.83 4.13 1.62l2.43-2.38C18.04 2.87 15.65 2 12.48 2c-5.64 0-10.2 4.5-10.2 10.1s4.56 10.1 10.2 10.1c5.96 0 9.84-4.14 9.84-9.94 0-.68-.05-1.3-.16-1.9H12.48z" fill="#4285F4"/>
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, isUserRegistered, isLoading } = useAuth();
  const { t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Only redirect when auth state is no longer loading
    if (!isLoading && user) {
        if (isUserRegistered) {
            router.push('/booking');
        } else {
            router.push('/register-details');
        }
    }
  }, [user, isLoading, isUserRegistered, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      // The onAuthStateChanged listener and the useEffect will handle redirection.
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
    }
  };
  
  // If we are loading auth state from server, or if the login button has been clicked,
  // show a full page loader.
  if (isLoading || isLoggingIn) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
       </div>
    );
  }
  
  // If user is already logged in, the useEffect will handle redirection,
  // so we can render nothing to prevent a flash of the login page.
  if (user) {
    return null;
  }

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
        <Button onClick={handleGoogleLogin} className="w-full" variant="outline" disabled={isLoggingIn}>
           {isLoggingIn ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
           ) : (
            <GoogleIcon />
           )}
          {isLoggingIn ? t.adminPage.analyzingButton : t.auth.continueWithGoogle}
        </Button>
      </CardContent>
    </Card>
  );
}
