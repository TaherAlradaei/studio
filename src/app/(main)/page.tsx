
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { useWelcomePage } from "@/context/welcome-page-context";
import { FieldIcon } from "@/components/icons";
import { Shield, User, Loader2, Eye, Target, Heart } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="text-center mb-12">
           <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-4">
              {t.welcomePage.welcomeTitle}
           </h1>
           <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.welcomePage.welcomeMessage}
           </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="relative group overflow-hidden rounded-lg">
            {welcomePageContent?.fieldImageUrl && <Image
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
            {welcomePageContent?.coachImageUrl && <Image
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

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold font-headline text-primary mb-4">
            {t.welcomePage.welcomeTitle}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.welcomePage.welcomeMessage}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-center items-center mb-4">
                  <Heart className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">{t.welcomePage.ourMissionTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.welcomePage.ourMissionText}</p>
            </CardContent>
          </Card>
           <Card className="text-center bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-center items-center mb-4">
                  <Eye className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">{t.welcomePage.ourVisionTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.welcomePage.ourVisionText}</p>
            </CardContent>
          </Card>
           <Card className="text-center bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-center items-center mb-4">
                  <Target className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">{t.welcomePage.ourGoalsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.welcomePage.ourGoalsText}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
            <h2 className="text-4xl font-bold font-headline text-primary text-center mb-8">{t.welcomePage.galleryTitle}</h2>
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {welcomePageContent?.galleryImages?.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                           <Image
                              src={image.url}
                              alt={`Gallery image ${index + 1}`}
                              width={800}
                              height={600}
                              className="w-full h-full object-cover"
                              data-ai-hint="stadium football"
                            />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
        </div>

        <div className="text-center bg-card/50 backdrop-blur-sm p-8 rounded-lg">
           {user ? (
            <>
              <h3 className="text-3xl font-bold font-headline text-primary mb-4">{t.welcomePage.alreadyMember}</h3>
              <p className="text-muted-foreground mb-6 text-lg">{t.welcomePage.alreadyMemberDesc}</p>
              <Button asChild variant="outline" size="lg">
                <Link href="/member-area">{t.welcomePage.memberAreaButton}</Link>
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold font-headline text-primary mb-4">{t.auth.getStartedTitle}</h3>
              <p className="text-muted-foreground mb-6 text-lg">{t.auth.getStartedDesc}</p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/login">{t.auth.createAccountAction}</Link>
                </Button>
                 <Button asChild size="lg" variant="secondary">
                  <Link href="/booking">{t.header.bookField}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
