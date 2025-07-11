
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
  confirmBooking: (bookingToConfirm: Booking) => Promise<'confirmed' | 'slot-taken'>;
  createConfirmedBooking: (bookingData: Omit<Booking, "id" | "status" | "userId">) => Promise<'confirmed' | 'slot-taken'>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

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

  const confirmBooking = async (bookingToConfirm: Booking): Promise<'confirmed' | 'slot-taken'> => {
      const newBookingStartMinutes = timeToMinutes(bookingToConfirm.time);
      const newBookingEndMinutes = newBookingStartMinutes + bookingToConfirm.duration * 60;
      const newBookingDateStr = new Date(bookingToConfirm.date).toDateString();

      const isSlotTakenByOther = bookings.some(b => {
          if (b.id !== bookingToConfirm.id && b.status === 'confirmed') {
              const existingBookingDateStr = new Date(b.date).toDateString();
              if (existingBookingDateStr !== newBookingDateStr) return false;

              const existingBookingStartMinutes = timeToMinutes(b.time);
              const existingBookingEndMinutes = existingBookingStartMinutes + b.duration * 60;

              return Math.max(newBookingStartMinutes, existingBookingStartMinutes) < Math.min(newBookingEndMinutes, existingBookingEndMinutes);
          }
          return false;
      });


      if (isSlotTakenByOther) {
          return 'slot-taken';
      }

      // If slot is not taken, confirm booking and cancel conflicting requests
      let newBookings = bookings.map(b => {
          // Confirm the target booking
          if (b.id === bookingToConfirm.id) {
              return { ...b, status: 'confirmed' };
          }
          
          // Cancel other pending or awaiting-confirmation requests for the same slot
          const bookingDateStr = new Date(b.date).toDateString();
          if ((b.status === 'pending' || b.status === 'awaiting-confirmation') && bookingDateStr === newBookingDateStr) {
              const bookingStartMinutes = timeToMinutes(b.time);
              const bookingEndMinutes = bookingStartMinutes + b.duration * 60;
              const conflict = Math.max(newBookingStartMinutes, bookingStartMinutes) < Math.min(newBookingEndMinutes, bookingEndMinutes);
              if (conflict) {
                  return { ...b, status: 'cancelled' };
              }
          }
          
          return b;
      });

      setBookings(newBookings);
      return 'confirmed';
  };

  const createConfirmedBooking = async (bookingData: Omit<Booking, "id" | "status" | "userId">): Promise<'confirmed' | 'slot-taken'> => {
      const newBooking: Booking = {
        ...bookingData,
        id: Math.random().toString(36).substr(2, 9),
        userId: 'admin_manual',
        status: 'pending', // Temporarily set as pending to run through confirmBooking logic
      };

      const result = await confirmBooking(newBooking);

      if (result === 'slot-taken') {
          return 'slot-taken';
      }
      
      // Manually add the booking as confirmed if it wasn't already in the list
      setBookings(prev => {
          const bookingExists = prev.some(b => b.id === newBooking.id);
          if (bookingExists) {
              return prev.map(b => b.id === newBooking.id ? {...b, status: 'confirmed'} : b);
          }
          return [...prev, {...newBooking, status: 'confirmed'}].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      return 'confirmed';
  };

  const acceptBooking = async (bookingToAccept: Booking, isTrusted: boolean): Promise<'accepted' | 'slot-taken' | 'requires-admin'> => {
      if (!isTrusted) {
        // For non-trusted users, just show instructions. Admin must confirm.
        return 'requires-admin';
      }
    
      // For trusted users, proceed with confirmation logic.
      const result = await confirmBooking(bookingToAccept);
      
      if (result === 'slot-taken') {
          await updateBooking(bookingToAccept.id, { status: 'cancelled' });
          return 'slot-taken';
      }

      return 'accepted';
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking, blockSlot, unblockSlot, acceptBooking, confirmBooking, createConfirmedBooking }}>
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
