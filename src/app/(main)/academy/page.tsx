
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
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAcademy } from "@/context/academy-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, UserPlus, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from 'date-fns/locale';


export default function AcademyRegistrationPage() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { addRegistration } = useAcademy();
  const { user } = useAuth();

  const formSchema = z.object({
    parentName: z.string().min(2, { message: t.academyPage.validation.parentNameMin }),
    phone: z.string().regex(/^[\d\s]{7,15}$/, { message: t.bookingForm.validation.phoneFormat }),
    talentName: z.string().min(2, { message: t.academyPage.validation.talentNameMin }),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: t.academyPage.validation.birthDateInvalid,
    }),
    ageGroup: z.enum(["U10", "U14"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentName: "",
      phone: "",
      talentName: "",
      birthDate: "",
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
        ...values,
        birthDate: new Date(values.birthDate),
      });
      toast({
        title: t.academyPage.toastSuccessTitle,
        description: t.academyPage.toastSuccessDesc.replace('{name}', values.talentName),
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
            <Shield className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {t.academyPage.title}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.academyPage.description}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline text-2xl">{t.academyPage.formTitle}</CardTitle>
            </div>
            <CardDescription>{t.academyPage.formDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.academyPage.parentNameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.academyPage.parentNamePlaceholder} {...field} />
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
                  name="talentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.academyPage.talentNameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.academyPage.talentNamePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.academyPage.birthDateLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY-MM-DD" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.academyPage.ageGroupLabel}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.academyPage.ageGroupPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="U10">{t.academyPage.ageGroupU10}</SelectItem>
                          <SelectItem value="U14">{t.academyPage.ageGroupU14}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {t.academyPage.submitButton}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
