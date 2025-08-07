
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useBookings } from "@/context/booking-context";
import { useToast } from "@/hooks/use-toast";
import { Shirt, CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";

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
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (!user || !user.phone) {
        toast({
            title: t.auth.notLoggedInTitle,
            description: t.auth.notLoggedInDesc,
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes);

    try {
      await addBooking({
        userId: user.uid,
        name: user.displayName,
        phone: user.phone,
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
        <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2">{t.bookingForm.bookingAs}</h4>
            <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                    <p className="font-medium">{user?.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user?.phone}</p>
                </div>
            </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {t.bookingForm.requestButton}
        </Button>
      </CardContent>
    </Card>
  );
}
