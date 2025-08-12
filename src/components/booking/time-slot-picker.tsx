
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
import { useLanguage } from "@/context/language-context";
import type { Booking } from "@/lib/types";
import { Timestamp } from "firebase/firestore";


const generateAvailableTimes = () => {
    const times = [];
    // Morning: 07:00 to 11:30
    for (let i = 7; i < 12; i++) {
        times.push(`${i.toString().padStart(2, '0')}:00`);
        times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    // Afternoon: 14:00 to 23:30
    for (let i = 14; i < 24; i++) {
        times.push(`${i.toString().padStart(2, '0')}:00`);
        times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return times;
};
const availableTimes = generateAvailableTimes();


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

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isSlotBooked = (time: string) => {
    const slotStartMinutes = timeToMinutes(time);
    
    // Only check current time on the client to avoid hydration mismatch
    if (isClient) {
      const now = new Date();
      const slotDateTime = new Date(selectedDate);
      const [hours, minutes] = time.split(':').map(Number);
      slotDateTime.setHours(hours, minutes, 0, 0);

      if (slotDateTime < now) {
          return true;
      }
    }

    const newBookingStartMinutes = slotStartMinutes;
    const newBookingEndMinutes = newBookingStartMinutes + duration * 60;

    for (const booking of bookings) {
      if (booking.status !== 'confirmed' && booking.status !== 'blocked') {
        continue;
      }

      const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
      if (bookingDate.toDateString() === selectedDate.toDateString()) {
        const existingBookingStartMinutes = timeToMinutes(booking.time);
        const existingBookingEndMinutes = existingBookingStartMinutes + booking.duration * 60;
        
        if (
          Math.max(newBookingStartMinutes, existingBookingStartMinutes) <
          Math.min(newBookingEndMinutes, existingBookingEndMinutes)
        ) {
          return true;
        }
      }
    }

    // Check if the selected duration exceeds the field's closing time or break time
    const endHour = Math.floor(newBookingEndMinutes / 60);
    
    // Check break time (12:00 to 14:00)
    const breakStartMinutes = 12 * 60;
    const breakEndMinutes = 14 * 60;
    if (Math.max(newBookingStartMinutes, breakStartMinutes) < Math.min(newBookingEndMinutes, breakEndMinutes)) {
      return true;
    }


    // Check closing time (midnight)
    if (endHour >= 24) {
        return true;
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
              <SelectItem value="2.5">2.5 Hours</SelectItem>
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
                disabled={!isClient || isBooked}
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

    
