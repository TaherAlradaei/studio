"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useBookings } from "@/context/booking-context";
import { useToast } from "@/hooks/use-toast";
import { Shirt } from "lucide-react";
import { useLanguage } from "@/context/language-context";

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

  const formSchema = React.useMemo(() => z.object({
    name: z.string().min(2, t.bookingForm.validation.nameMin),
    phone: z.string().regex(/^\d{3}\s\d{3}\s\d{3}$/, t.bookingForm.validation.phoneFormat),
    terms: z.boolean().refine((val) => val === true, {
      message: t.bookingForm.validation.termsRequired,
    }),
  }), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      terms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes);

    await addBooking({
      name: values.name,
      phone: values.phone,
      date: bookingDate,
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
    form.reset();
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
            <CardTitle className="font-headline text-2xl">{t.bookingForm.title}</CardTitle>
        </div>
        <CardDescription>
          {bookingForDesc}
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
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t.bookingForm.termsLabel}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {t.bookingForm.requestButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
