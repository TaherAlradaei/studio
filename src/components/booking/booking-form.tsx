
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useBookings } from "@/context/booking-context";
import { useToast } from "@/hooks/use-toast";
import { Shirt, CheckCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  duration: number;
  onBookingComplete: () => void;
}

export function BookingForm({
  selectedDate,
  selectedTime,
  duration,
  onBookingComplete,
}: BookingFormProps) {
  const { addBooking } = useBookings();
  const { toast } = useToast();
  const { t, lang } = useLanguage();
  const { user, updateUserDetails } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formSchema = z.object({
    name: z.string().min(2, { message: t.bookingForm.validation.nameMin }),
    phone: z.string().regex(/^[\d\s]{7,15}$/, { message: t.bookingForm.validation.phoneFormat }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      phone: user?.phone || "",
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: user?.displayName || "",
      phone: user?.phone || "",
    });
  }, [user, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            title: t.auth.notLoggedInTitle,
            description: t.auth.notLoggedInDesc,
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
      // If user is anonymous, update their details first.
      if (user.isAnonymous && (!user.displayName || !user.phone)) {
        await updateUserDetails(values);
      }

      await addBooking({
        userId: user.uid,
        name: values.name,
        phone: values.phone,
        date: selectedDate,
        time: selectedTime,
        duration,
      });
      
      toast({
        title: t.toasts.bookingPendingTitle,
        description: t.toasts.bookingPendingDesc
          .replace('{date}', selectedDate.toLocaleDateString(lang))
          .replace('{time}', selectedTime),
      });

      onBookingComplete();
      router.push('/bookings');
    } catch (err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to create booking.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  const bookingForDesc = t.bookingForm.bookingFor
    .replace('{date}', selectedDate.toLocaleDateString(lang))
    .replace('{time}', selectedTime)
    .replace('{duration}', duration.toString());

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Shirt className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-2xl">{t.bookingForm.titleConfirm}</CardTitle>
        </div>
        <CardDescription>
          {bookingForDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.isAnonymous && (
           <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-yellow-300">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/>{t.auth.anonBookingTitle}</h4>
            <p className="text-xs opacity-90">{t.auth.anonBookingDesc}</p>
          </div>
        )}
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isSubmitting ? t.adminPage.savingButton : t.bookingForm.requestButton}
              </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
