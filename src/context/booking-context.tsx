"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Booking } from "@/lib/types";
import { addDays, setHours, setMinutes } from "date-fns";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price">) => void;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => void;
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
        status: 'confirmed',
        price: 50,
    },
    {
        id: "2",
        name: "Fatima Al-Ali",
        phone: "555-5678",
        date: setMinutes(setHours(addDays(new Date(), 2), 20), 0),
        time: "20:00",
        duration: 2,
        status: 'pending',
    },
    {
        id: "3",
        name: "Yusuf Ahmed",
        phone: "555-9012",
        date: setMinutes(setHours(addDays(new Date(), 1), 15), 0),
        time: "15:00",
        duration: 1.5,
        status: 'pending',
    }
];


export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings.sort((a,b) => a.date.getTime() - b.date.getTime()));

  const addBooking = (newBookingData: Omit<Booking, "id" | "status" | "price">) => {
    const newBooking: Booking = {
      ...newBookingData,
      id: (bookings.length + 1).toString(),
      status: 'pending',
    };
    setBookings((prevBookings) => [...prevBookings, newBooking].sort((a,b) => a.date.getTime() - b.date.getTime()));
  };
  
  const updateBooking = (id: string, updates: Partial<Omit<Booking, 'id'>>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b).sort((a,b) => a.date.getTime() - b.date.getTime()));
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking }}>
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
