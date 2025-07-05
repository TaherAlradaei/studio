import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageProvider, LanguageContext } from "@/context/language-context";
import { Suspense } from "react";
import { arStrings } from "@/lib/dictionaries/ar";
import { enStrings } from "@/lib/dictionaries/en";

function AuthPageContent() {
    return (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle>{enStrings.auth.welcomeTitle}</CardTitle>
            <CardDescription>{enStrings.auth.welcomeDesc}</CardDescription>
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
