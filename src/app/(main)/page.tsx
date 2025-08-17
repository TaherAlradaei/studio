
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { FieldIcon } from "@/components/icons";
import { Shield, User, Loader2, Eye, Target, Heart, Users, Calendar, Award, History, Building } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFindATeam } from "@/context/find-a-team-context";
import { WelcomePageContent, GalleryImage } from "@/lib/types";
import { getWelcomePageContent, getGalleryImages } from "./admin/actions";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";


export default function WelcomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isRegistered } = useFindATeam();
  const { toast } = useToast();
  
  const [welcomePageContent, setWelcomePageContent] = useState<WelcomePageContent | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        setIsLoading(true);
        const [welcomeData, galleryData] = await Promise.all([getWelcomePageContent(), getGalleryImages()]);
        setWelcomePageContent(welcomeData);
        setGalleryImages(galleryData);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load page content", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, [toast]);


  if (isLoading) {
    return (
       <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-black/50 z-10"/>
          <div className="relative z-20 p-4">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white mb-4 drop-shadow-lg">
                  {t.welcomePage.welcomeTitle}
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
                  {t.welcomePage.welcomeMessage}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/booking">
                      <FieldIcon className="mr-2" />
                      {t.header.bookField}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/academy">
                      <Shield className="mr-2" />
                      {t.header.academy}
                    </Link>
                  </Button>
              </div>
          </div>
      </section>

      <div className="container py-8 md:py-16 space-y-16 md:space-y-24">
        {/* Mobile-only Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:hidden">
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-0">
                {welcomePageContent?.fieldImageUrl &&
                    <Image
                      src={welcomePageContent.fieldImageUrl}
                      alt="Football Field"
                      width={600}
                      height={400}
                      className="w-full h-48 object-cover"
                       data-ai-hint="football field players"
                    />
                }
            </CardHeader>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold font-headline mb-2">{t.welcomePage.fieldTitle}</h2>
              <p className="text-muted-foreground mb-4">{t.welcomePage.fieldDesc}</p>
              <Button asChild size="lg">
                <Link href="/booking">
                  <FieldIcon className="mr-2" />
                  {t.header.bookField}
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
             <CardHeader className="p-0">
                {welcomePageContent?.coachImageUrl &&
                    <Image
                      src={welcomePageContent.coachImageUrl}
                      alt="Academy Coach"
                      width={600}
                      height={400}
                      className="w-full h-48 object-cover"
                       data-ai-hint="football coach"
                    />
                }
            </CardHeader>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold font-headline mb-2">{t.welcomePage.coachTitle}</h2>
              <p className="text-muted-foreground mb-4">{t.welcomePage.coachDesc}</p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/academy">
                  <Shield className="mr-2" />
                  {t.header.academy}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* "Find a Team" button only for mobile view */}
        <div className="text-center md:hidden">
            <Button asChild size="lg" variant="outline" className="w-full max-w-sm mx-auto">
              <Link href={isRegistered ? "/find-a-team/players" : "/find-a-team"}>
                <Users className="mr-2"/>
                {t.header.findTeam}
              </Link>
            </Button>
        </div>

        {/* ----- Desktop Content Sections ----- */}
        <div className="space-y-16 md:space-y-24">
            {/* Mission, Vision, Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="text-center bg-card/80 backdrop-blur-sm p-6 hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                      <Heart className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">{t.welcomePage.ourMissionTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{t.welcomePage.ourMissionText}</p>
                </CardContent>
              </Card>
               <Card className="text-center bg-card/80 backdrop-blur-sm p-6 hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                      <Eye className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">{t.welcomePage.ourVisionTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{t.welcomePage.ourVisionText}</p>
                </CardContent>
              </Card>
               <Card className="text-center bg-card/80 backdrop-blur-sm p-6 hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                      <Target className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">{t.welcomePage.ourGoalsTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{t.welcomePage.ourGoalsText}</p>
                </CardContent>
              </Card>
            </div>

            {/* Our History */}
            <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-0 items-center">
                    <div className="p-8 md:p-12">
                        <History className="w-12 h-12 text-primary mb-4" />
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4">{t.welcomePage.ourHistoryTitle}</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">{t.welcomePage.ourHistoryText}</p>
                    </div>
                    <div className="h-64 md:h-full min-h-[300px] relative">
                         <Image
                          src={welcomePageContent?.fieldImageUrl || "https://placehold.co/600x400.png"}
                          alt="Al Maidan Field"
                          layout="fill"
                          className="object-cover"
                          data-ai-hint="football field"
                        />
                    </div>
                </div>
            </Card>

            {/* Manager's Word */}
             <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-0 items-center">
                    <div className="h-64 md:h-full min-h-[300px] relative md:order-2">
                         <Image
                          src={welcomePageContent?.managerImageUrl || "https://placehold.co/600x400.png"}
                          alt="Waheeb Hameed - Manager"
                          layout="fill"
                          className="object-cover"
                          data-ai-hint="portrait man"
                        />
                    </div>
                    <div className="p-8 md:p-12 md:order-1">
                        <User className="w-12 h-12 text-primary mb-4" />
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4">{t.welcomePage.managerWordTitle}</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">{t.welcomePage.managerWordText}</p>
                        <p className="font-semibold text-primary text-lg mt-4">Waheeb Hameed</p>
                    </div>
                </div>
            </Card>

            {/* Captain's Speech */}
             <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
                 <div className="grid md:grid-cols-2 gap-0 items-center">
                    <div className="p-8 md:p-12">
                        <Award className="w-12 h-12 text-primary mb-4" />
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4">{t.welcomePage.captainSpeechTitle}</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">{t.welcomePage.captainSpeechText}</p>
                        <p className="font-semibold text-primary text-lg mt-4">Captain Hafidh</p>
                    </div>
                    <div className="h-64 md:h-full min-h-[300px] relative">
                         <Image
                          src={welcomePageContent?.coachImageUrl || "https://placehold.co/600x400.png"}
                          alt="Captain Hafidh"
                          layout="fill"
                          className="object-cover"
                          data-ai-hint="football coach portrait"
                        />
                    </div>
                </div>
            </Card>
        </div>

        {/* Gallery - visible on all sizes */}
        <div className="my-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary text-center mb-8">{t.welcomePage.galleryTitle}</h2>
            <Carousel className="w-full max-w-5xl mx-auto" opts={{ loop: true }}>
              <CarouselContent>
                {galleryImages?.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden group">
                        <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                           <Image
                              src={image.url}
                              alt={`Gallery image ${index + 1}`}
                              width={800}
                              height={600}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              data-ai-hint="stadium football"
                            />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>

        {/* Sponsors Section - visible on all sizes */}
        <div className="text-center bg-card/80 backdrop-blur-sm p-8 md:p-12 rounded-lg">
            <div className="flex justify-center items-center mb-4">
                <Building className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-3xl font-bold font-headline text-primary mb-4">{t.welcomePage.sponsorsTitle}</h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">{t.welcomePage.sponsorsText}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80">
                {welcomePageContent?.sponsors?.map((sponsor, index) => (
                    sponsor.url && <Image key={index} src={sponsor.url} alt={`Sponsor ${index + 1}`} width={150} height={80} className="object-contain" data-ai-hint="company logo"/>
                ))}
            </div>
        </div>

        {/* Final CTA - visible on all sizes */}
        <div className="text-center bg-card/80 backdrop-blur-sm p-8 md:p-12 rounded-lg">
           {user ? (
            <>
              <h3 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-4">{t.welcomePage.alreadyMember}</h3>
              <p className="text-muted-foreground mb-6 text-lg">{t.welcomePage.alreadyMemberDesc}</p>
              <Button asChild variant="outline" size="lg">
                <Link href="/member-area">{t.welcomePage.memberAreaButton}</Link>
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-4">{t.auth.getStartedTitle}</h3>
              <p className="text-muted-foreground mb-6 text-lg">{t.auth.getStartedDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
