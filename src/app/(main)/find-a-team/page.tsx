
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { useFindATeam } from "@/context/find-a-team-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";


export default function FindATeamPage() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { addRegistration, isRegistered, isLoading: isTeamContextLoading } = useFindATeam();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const formSchema = z.object({
    name: z.string().min(2, { message: t.bookingForm.validation.nameMin }),
    phone: z.string().regex(/^[\d\s]{7,15}$/, { message: t.bookingForm.validation.phoneFormat }),
    position: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward", "Any"]),
    availability: z.string().min(10, { message: t.findATeamPage.validation.availabilityMin }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      phone: user?.phone || "",
      availability: "",
    },
  });

  useEffect(() => {
    if (user) {
        form.setValue('name', user.displayName || "");
        form.setValue('phone', user.phone || "");
    }
  }, [user, form]);
  
  useEffect(() => {
      // Redirect if user is already registered to find a team.
      if (!isTeamContextLoading && isRegistered) {
          router.replace('/find-a-team/players');
      }
  }, [isRegistered, isTeamContextLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
     if (!user) {
        toast({
            title: t.auth.notLoggedInTitle,
            description: t.auth.notLoggedInDesc,
            variant: "destructive",
        });
        return;
    }
    
    try {
      await addRegistration({
        userId: user.uid,
        name: values.name,
        phone: values.phone,
        position: values.position,
        availability: values.availability,
      });
      toast({
        title: t.findATeamPage.toastSuccessTitle,
        description: t.findATeamPage.toastSuccessDesc,
      });
      router.push('/find-a-team/players');
    } catch (error) {
      toast({
        title: t.adminPage.errorTitle,
        description: error instanceof Error ? error.message : "Failed to submit registration.",
        variant: "destructive",
      });
    }
  }
  
  // Show a loading state while we check auth and registration status
  if (isAuthLoading || isTeamContextLoading || isRegistered) {
      return (
          <div className="flex justify-center items-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Users className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {t.findATeamPage.title}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-white max-w-2xl mx-auto">
          {t.findATeamPage.description}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
        <div className="hidden md:block">
            <Image 
                src="data:image/webp;base64,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"
                alt="Football players ready for a match"
                width={600}
                height={800}
                className="rounded-lg object-cover w-full h-full"
                data-ai-hint="football players team"
            />
        </div>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{t.findATeamPage.formTitle}</CardTitle>
            <CardDescription>{t.findATeamPage.formDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bookingForm.nameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.bookingForm.namePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bookingForm.phoneLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.bookingForm.phonePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.findATeamPage.positionLabel}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.findATeamPage.positionPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Goalkeeper">{t.findATeamPage.positionGoalkeeper}</SelectItem>
                          <SelectItem value="Defender">{t.findATeamPage.positionDefender}</SelectItem>
                          <SelectItem value="Midfielder">{t.findATeamPage.positionMidfielder}</SelectItem>
                          <SelectItem value="Forward">{t.findATeamPage.positionForward}</SelectItem>
                          <SelectItem value="Any">{t.findATeamPage.positionAny}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.findATeamPage.availabilityLabel}</FormLabel>
                       <FormControl>
                        <Textarea
                          placeholder={t.findATeamPage.availabilityPlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t.findATeamPage.availabilityDesc}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!user}>
                  {t.findATeamPage.submitButton}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
