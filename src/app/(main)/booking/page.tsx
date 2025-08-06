
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotPicker } from "@/components/booking/time-slot-picker";
import { BookingForm } from "@/components/booking/booking-form";
import { useBookings } from "@/context/booking-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, DollarSign } from "lucide-react";
import { FieldIcon } from "@/components/icons";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { arSA } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { Booking } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

const pricingData = [
    { slot: "07:00 - 11:00", price: "6,000" },
    { slot: "14:00 - 17:00", price: "7,000" },
    { slot: "18:00 - 23:00", price: "8,000" },
];

export default function BookingPage() {
  const { t, lang } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const { bookings } = useBookings();
  
  useEffect(() => {
    // Set initial date only on client to avoid hydration errors
    setSelectedDate(new Date());
  }, []);
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string, newDuration: number) => {
    setSelectedTime(time);
    setDuration(newDuration);
  };

  const handleBookingComplete = () => {
    setSelectedTime(null);
  };

  if (isAuthLoading || !user) {
    return (
       <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Convert Firestore Timestamps to JS Dates for the calendar components
  const bookingsWithDates = bookings.map(b => ({
      ...b,
      date: (b.date as Timestamp).toDate()
  }));

  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
            <FieldIcon className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {t.bookingPage.title}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.bookingPage.description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline text-2xl">{t.bookingPage.selectDate}</CardTitle>
              </div>
              <CardDescription>{t.bookingPage.selectDateDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md"
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  locale={lang === 'ar' ? arSA : undefined}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  weekStartsOn={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <CardTitle className="font-headline text-2xl">{t.bookingPage.pricingTitle}</CardTitle>
                </div>
                <CardDescription>{t.bookingPage.pricingDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.bookingPage.pricingTimeSlot}</TableHead>
                                <TableHead className="text-right">{t.bookingPage.pricingPriceYER}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pricingData.map((item) => (
                                <TableRow key={item.slot}>
                                    <TableCell className="font-medium">{item.slot}</TableCell>
                                    <TableCell className="text-right">{item.price}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:sticky lg:top-24 flex flex-col gap-8">
          {selectedDate && (
            <TimeSlotPicker
              selectedDate={selectedDate}
              bookings={bookingsWithDates}
              onTimeSelect={handleTimeSelect}
              selectedTime={selectedTime}
            />
          )}
          {selectedDate && selectedTime && (
            <BookingForm
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              duration={duration}
              onBookingComplete={handleBookingComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
