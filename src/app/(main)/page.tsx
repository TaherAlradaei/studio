
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { useWelcomePage } from "@/context/welcome-page-context";
import { FieldIcon } from "@/components/icons";
import { Shield, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function WelcomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { welcomePageContent, isWelcomePageLoading } = useWelcomePage();

  if (isWelcomePageLoading) {
    return (
       <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary mb-4">
          {welcomePageContent.title}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {welcomePageContent.message}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="relative group overflow-hidden rounded-lg">
          {welcomePageContent.fieldImageUrl && <Image
            src={welcomePageContent.fieldImageUrl}
            alt="Football Field"
            width={600}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="football field"
          />}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h2 className="text-2xl font-bold text-white font-headline">{t.welcomePage.fieldTitle}</h2>
            <p className="text-white/90 mt-2">{t.welcomePage.fieldDesc}</p>
            <Button asChild className="mt-4">
              <Link href="/booking">{t.header.bookField}</Link>
            </Button>
          </div>
        </div>
        <div className="relative group overflow-hidden rounded-lg">
          {welcomePageContent.coachImageUrl && <Image
            src={welcomePageContent.coachImageUrl}
            alt="Academy Coach"
            width={600}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="football coach"
          />}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <div className="absolute bottom-0 left-0 p-6">
            <h2 className="text-2xl font-bold text-white font-headline">{t.welcomePage.coachTitle}</h2>
            <p className="text-white/90 mt-2">{t.welcomePage.coachDesc}</p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/academy">{t.header.academy}</Link>
            </Button>
          </div>
        </div>
      </div>

       <div className="text-center">
         {user ? (
          <>
            <h3 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-4">{t.welcomePage.alreadyMember}</h3>
            <p className="text-muted-foreground mb-6">{t.welcomePage.alreadyMemberDesc}</p>
            <Button asChild variant="outline" size="lg">
              <Link href="/member-area">{t.welcomePage.memberAreaButton}</Link>
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-4">{t.auth.getStartedTitle}</h3>
            <p className="text-muted-foreground mb-6">{t.auth.getStartedDesc}</p>
            <Button asChild size="lg">
              <Link href="/login">{t.auth.createAccountAction}</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
