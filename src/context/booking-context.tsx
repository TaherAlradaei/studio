
"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Booking } from "@/lib/types";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price">) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  blockSlot: (date: Date, time: string) => Promise<void>;
  unblockSlot: (id: string) => Promise<void>;
  acceptBooking: (booking: Booking, isTrusted: boolean) => Promise<'accepted' | 'slot-taken' | 'requires-admin'>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = async (newBookingData: Omit<Booking, "id" | "status" | "price">) => {
    const newBooking: Booking = {
      ...newBookingData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
    };
    setBookings(prev => [...prev, newBooking].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };
  
  const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id'>>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const blockSlot = async (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    const newBlockedBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'admin_blocked',
      name: 'Blocked Slot',
      phone: null,
      date: bookingDate,
      time,
      duration: 1,
      status: 'blocked',
    };
    setBookings(prev => [...prev, newBlockedBooking].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const unblockSlot = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const acceptBooking = async (bookingToAccept: Booking, isTrusted: boolean): Promise<'accepted' | 'slot-taken' | 'requires-admin'> => {
      if (!isTrusted) {
        // For non-trusted users, just show instructions. Admin must confirm.
        return 'requires-admin';
      }
    
      // For trusted users, proceed with confirmation logic.
      const newBookingStartTime = new Date(bookingToAccept.date);
      const newBookingEndTime = new Date(newBookingStartTime.getTime() + bookingToAccept.duration * 3600 * 1000);

      const isSlotTaken = bookings.some(b => {
          if (b.id !== bookingToAccept.id && b.status === 'confirmed') {
              const existingBookingStartTime = new Date(b.date);
              const existingBookingEndTime = new Date(existingBookingStartTime.getTime() + b.duration * 3600 * 1000);

              return Math.max(newBookingStartTime.getTime(), existingBookingStartTime.getTime()) < Math.min(newBookingEndTime.getTime(), existingBookingEndTime.getTime());
          }
          return false;
      });

      if (isSlotTaken) {
          await updateBooking(bookingToAccept.id, { status: 'cancelled' });
          return 'slot-taken';
      }

      // If slot is not taken, confirm booking and cancel conflicting requests
      let newBookings = bookings.map(b => {
          if (b.id === bookingToAccept.id) {
              return { ...b, status: 'confirmed' };
          }
          
          // Cancel other pending requests for the same slot
          if (b.status === 'pending' || b.status === 'awaiting-confirmation') {
              const bookingStartTime = new Date(b.date);
              const bookingEndTime = new Date(bookingStartTime.getTime() + b.duration * 3600 * 1000);
              const conflict = Math.max(newBookingStartTime.getTime(), bookingStartTime.getTime()) < Math.min(newBookingEndTime.getTime(), bookingEndTime.getTime());
              if (conflict) {
                  return { ...b, status: 'cancelled' };
              }
          }
          
          return b;
      });

      setBookings(newBookings);
      return 'accepted';
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking, blockSlot, unblockSlot, acceptBooking }}>
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
