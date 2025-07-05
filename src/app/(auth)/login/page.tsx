"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";
import { useLanguage } from "@/context/language-context";

function AuthPageContent() {
    const { t } = useLanguage();
    return (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle>{t.auth.welcomeTitle}</CardTitle>
            <CardDescription>{t.auth.welcomeDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm />
          </CardContent>
        </Card>
    )
}

export default function LoginPage() {
  return (
    <Suspense>
        <AuthPageContent />
    </Suspense>
  );
}
