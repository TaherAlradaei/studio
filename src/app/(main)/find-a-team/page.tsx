
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
import { Users } from "lucide-react";
import { useFindATeam } from "@/context/find-a-team-context";


export default function FindATeamPage() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { addRegistration } = useFindATeam();
  const { user } = useAuth();

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
      form.reset();
    } catch (error) {
      toast({
        title: t.adminPage.errorTitle,
        description: error instanceof Error ? error.message : "Failed to submit registration.",
        variant: "destructive",
      });
    }
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
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.findATeamPage.description}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
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
