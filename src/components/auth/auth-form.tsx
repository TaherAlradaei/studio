"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      router.push("/");
    } catch (error: any) {
      let errorMessage = error.message;
      const firebaseErrorKey = error.code as keyof typeof t.auth.firebaseErrors;
      if (error.code && t.auth.firebaseErrors[firebaseErrorKey]) {
        errorMessage = t.auth.firebaseErrors[firebaseErrorKey];
      }
      
      toast({
        title: t.auth.errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
        <Button onClick={handleAnonymousLogin} className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.auth.continueAsGuest}
        </Button>
    </div>
  );
}
