"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Booking } from "@/lib/types";
import { addDays, setHours, setMinutes } from "date-fns";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id">) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialBookings: Booking[] = [
    {
        id: "1",
        name: "Ahmed Khan",
        phone: "555-1234",
        date: setMinutes(setHours(new Date(), 18), 0),
        time: "18:00",
        duration: 1,
    },
    {
        id: "2",
        name: "Fatima Al-Ali",
        phone: "555-5678",
        date: setMinutes(setHours(addDays(new Date(), 2), 20), 0),
        time: "20:00",
        duration: 2,
    },
];


export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const addBooking = (newBookingData: Omit<Booking, "id">) => {
    const newBooking: Booking = {
      ...newBookingData,
      id: (bookings.length + 1).toString(),
    };
    setBookings((prevBookings) => [...prevBookings, newBooking].sort((a,b) => a.date.getTime() - b.date.getTime()));
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider");
  }
  return context;
};
