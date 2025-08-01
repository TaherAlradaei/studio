
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function RegisterDetailsPage() {
  const { t } = useLanguage();
  const { user, updateUserDetails } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(2, { message: t.bookingForm.validation.nameMin }),
    phone: z.string().regex(/^[\d\s]{7,15}$/, { message: t.bookingForm.validation.phoneFormat }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // Redirect if user is not logged in or already has details
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.phone) {
      // If user somehow lands here but already has details, send them away
      router.push('/booking');
    }
  }, [user, router]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUserDetails(values);
    toast({
      title: t.auth.detailsUpdatedTitle,
      description: t.auth.detailsUpdatedDesc,
    });
    router.push('/booking');
  }

  return (
     <div className="container py-16 flex justify-center items-center">
        <Card className="max-w-md w-full bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-center items-center gap-4 mb-2">
                <UserPlus className="w-12 h-12 text-primary"/>
            </div>
            <CardTitle className="text-3xl text-center font-bold font-headline text-primary">
              {t.auth.completeProfileTitle}
            </CardTitle>
            <CardDescription className="text-center">
              {t.auth.completeProfileDesc}
            </CardDescription>
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
                <Button type="submit" className="w-full">
                  {t.auth.continue}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
     </div>
  );
}
