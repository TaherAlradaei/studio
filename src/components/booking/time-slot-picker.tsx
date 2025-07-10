
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Booking } from "@/lib/types";
import { useLanguage } from "@/context/language-context";

const availableTimes = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

interface TimeSlotPickerProps {
  selectedDate: Date;
  bookings: Booking[];
  onTimeSelect: (time: string, duration: number) => void;
  selectedTime: string | null;
}

export function TimeSlotPicker({ selectedDate, bookings, onTimeSelect, selectedTime }: TimeSlotPickerProps) {
  const { t, lang } = useLanguage();
  const [duration, setDuration] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isSlotBooked = (time: string) => {
    const slotHour = parseInt(time.split(':')[0], 10);
    
    if (isClient) {
      const now = new Date();
      // Disable past time slots for the current day
      if (selectedDate.toDateString() === now.toDateString() && slotHour < now.getHours()) {
        return true;
      }
    }

    const newBookingStartHour = slotHour;
    const newBookingEndHour = slotHour + duration;

    for (const booking of bookings) {
      // A slot is only considered unavailable if it's confirmed or blocked by an admin.
      if (booking.status !== 'confirmed' && booking.status !== 'blocked') {
        continue;
      }

      const bookingDate = new Date(booking.date);
      if (bookingDate.toDateString() === selectedDate.toDateString()) {
        const existingBookingStartHour = bookingDate.getHours();
        const existingBookingEndHour = existingBookingStartHour + booking.duration;

        if (
          Math.max(newBookingStartHour, existingBookingStartHour) <
          Math.min(newBookingEndHour, existingBookingEndHour)
        ) {
          return true;
        }
      }
    }

    return false;
  };
  
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-2xl">{t.timeSlotPicker.title}</CardTitle>
        </div>
        <CardDescription>
          {t.timeSlotPicker.description.replace('{date}', selectedDate.toLocaleDateString(lang, dateOptions))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label htmlFor="duration" className="block text-sm font-medium mb-2">
            {t.timeSlotPicker.durationLabel}
          </label>
          <Select
            value={duration.toString()}
            onValueChange={(value) => setDuration(parseFloat(value))}
          >
            <SelectTrigger id="duration" className="w-[180px]">
              <SelectValue placeholder={t.timeSlotPicker.durationPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t.timeSlotPicker.oneHour}</SelectItem>
              <SelectItem value="1.5">{t.timeSlotPicker.oneAndHalfHour}</SelectItem>
              <SelectItem value="2">{t.timeSlotPicker.twoHours}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {availableTimes.map((time) => {
            const isBooked = isSlotBooked(time);
            return (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                onClick={() => onTimeSelect(time, duration)}
                disabled={isBooked}
                className={cn(
                  "transition-all duration-200 ease-in-out",
                  isBooked ? "bg-muted text-muted-foreground line-through" : "",
                  selectedTime === time ? "ring-2 ring-ring ring-offset-2 bg-primary text-primary-foreground" : "hover:bg-primary/10"
                )}
                aria-pressed={selectedTime === time}
                aria-label={`Select time slot for ${time}`}
              >
                {time}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
