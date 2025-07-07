
"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotPicker } from "@/components/booking/time-slot-picker";
import { BookingForm } from "@/components/booking/booking-form";
import { useBookings } from "@/context/booking-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { FieldIcon } from "@/components/icons";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { arSA } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function BookingPage() {
  const { t, lang } = useLanguage();
  const { user, isLoading } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const { bookings } = useBookings();
  const [calendarView, setCalendarView] = useState<'1m' | '2m'>('1m');

  if (isLoading || !user) {
    return null; // Or a loading spinner
  }

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
              <div className="flex justify-end mb-4">
                  <div className="flex flex-col items-end">
                      <Label className="text-xs mb-1">{t.bookingPage.calendarView}</Label>
                      <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)}>
                          <TabsList className="h-8">
                              <TabsTrigger value="1m" className="text-xs px-2 py-1 h-auto">{t.bookingPage.oneMonth}</TabsTrigger>
                              <TabsTrigger value="2m" className="text-xs px-2 py-1 h-auto">{t.bookingPage.twoMonths}</TabsTrigger>
                          </TabsList>
                      </Tabs>
                  </div>
              </div>
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
                  numberOfMonths={calendarView === '1m' ? 1 : 2}
                />
              </div>
            </CardContent>
          </Card>

          {selectedDate && (
            <TimeSlotPicker
              selectedDate={selectedDate}
              bookings={bookings}
              onTimeSelect={handleTimeSelect}
              selectedTime={selectedTime}
            />
          )}
        </div>
        
        <div className="lg:sticky lg:top-24">
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
