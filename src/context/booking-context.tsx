
"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Booking } from "@/lib/types";
import { addDays } from 'date-fns';
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc, 
    writeBatch, 
    Timestamp,
    where,
    getDocs,
    deleteDoc,
    setDoc
} from "firebase/firestore";
import { getDefaultPrice } from "@/lib/pricing";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price" | "date" | "isRecurring"> & {date: Date}) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  blockSlot: (date: Date, time: string, duration: number) => Promise<void>;
  unblockSlot: (id: string) => Promise<void>;
  acceptBooking: (booking: Booking, isTrusted: boolean) => Promise<'accepted' | 'slot-taken' | 'requires-admin'>;
  confirmBooking: (bookingToConfirm: Booking) => Promise<'confirmed' | 'slot-taken'>;
  createConfirmedBooking: (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }) => Promise<'confirmed' | 'slot-taken'>;
  createRecurringBookings: (booking: Booking) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = async (newBookingData: Omit<Booking, "id" | "status" | "price" | "date" | "isRecurring"> & {date: Date}) => {
    const price = getDefaultPrice(newBookingData.time) * newBookingData.duration;
    
    await addDoc(collection(db, "bookings"), {
      ...newBookingData,
      date: Timestamp.fromDate(newBookingData.date),
      status: 'awaiting-confirmation',
      price,
    });
  };
  
  const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id'>>) => {
    const bookingDocRef = doc(db, "bookings", id);
    const updateData: any = { ...updates };
    if (updates.date && updates.date instanceof Date) {
        updateData.date = Timestamp.fromDate(updates.date);
    }
    await updateDoc(bookingDocRef, updateData);
  };

  const blockSlot = async (date: Date, time: string, duration: number) => {
    await addDoc(collection(db, "bookings"), {
      userId: 'admin_blocked',
      name: 'Blocked Slot',
      phone: null,
      date: Timestamp.fromDate(date),
      time,
      duration,
      status: 'blocked',
    });
  };

  const unblockSlot = async (id: string) => {
    await deleteDoc(doc(db, "bookings", id));
  };

  const confirmBooking = async (bookingToConfirm: Booking): Promise<'confirmed' | 'slot-taken'> => {
      // Handle both Timestamp and Date objects
      const bookingDate = bookingToConfirm.date instanceof Timestamp
        ? bookingToConfirm.date.toDate()
        : bookingToConfirm.date;

      const bookingStart = new Date(bookingDate.getTime());
      const [startHours, startMinutes] = bookingToConfirm.time.split(':').map(Number);
      bookingStart.setHours(startHours, startMinutes, 0, 0);
      
      const bookingEnd = new Date(bookingStart.getTime() + bookingToConfirm.duration * 60 * 60 * 1000);

      const q = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(new Date(bookingDate.setHours(0, 0, 0, 0)))),
        where("status", "in", ["confirmed", "blocked"])
      );
      const querySnapshot = await getDocs(q);

      const isSlotTaken = querySnapshot.docs.some(doc => {
        const b = doc.data() as Booking;
        if (doc.id === bookingToConfirm.id) return false;

        const existingStart = new Date((b.date as Timestamp).toDate());
        const [existingStartHours, existingStartMinutes] = b.time.split(':').map(Number);
        existingStart.setHours(existingStartHours, existingStartMinutes, 0, 0);

        const existingEnd = new Date(existingStart.getTime() + b.duration * 60 * 60 * 1000);
        
        // Check for overlap
        return bookingStart < existingEnd && bookingEnd > existingStart;
      });

      if (isSlotTaken) {
        return 'slot-taken';
      }

      const batch = writeBatch(db);
      
      // Confirm the target booking
      const bookingToConfirmRef = doc(db, "bookings", bookingToConfirm.id);
      batch.update(bookingToConfirmRef, { status: 'confirmed' });

      // Find and cancel conflicting requests (pending or awaiting-confirmation)
      const conflictQ = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(new Date(bookingDate.setHours(0, 0, 0, 0)))),
        where("status", "in", ["pending", "awaiting-confirmation"])
      );
      const conflictSnapshot = await getDocs(conflictQ);
      
      conflictSnapshot.forEach(conflictDoc => {
        if (conflictDoc.id === bookingToConfirm.id) return;
        const b = conflictDoc.data() as Booking;

        const existingStart = new Date((b.date as Timestamp).toDate());
        const [existingStartHours, existingStartMinutes] = b.time.split(':').map(Number);
        existingStart.setHours(existingStartHours, existingStartMinutes, 0, 0);
        const existingEnd = new Date(existingStart.getTime() + b.duration * 60 * 60 * 1000);

        if (bookingStart < existingEnd && bookingEnd > existingStart) {
          batch.update(conflictDoc.ref, { status: 'cancelled' });
        }
      });
      
      await batch.commit();
      return 'confirmed';
  };

  const createConfirmedBooking = async (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }): Promise<'confirmed' | 'slot-taken'> => {
      const newBookingRef = doc(collection(db, "bookings"));
      const tempBooking: Booking = {
        ...bookingData,
        id: newBookingRef.id,
        userId: 'admin_manual',
        date: Timestamp.fromDate(bookingData.date),
        status: 'awaiting-confirmation', // Will be updated to confirmed by confirmBooking
      };
      
      await setDoc(newBookingRef, tempBooking);

      const result = await confirmBooking(tempBooking);
      
      if (result === 'slot-taken') {
          await deleteDoc(newBookingRef);
      }

      return result;
  };

    const createRecurringBookings = async (originalBooking: Booking): Promise<void> => {
        const batch = writeBatch(db);
        const originalDate = originalBooking.date instanceof Timestamp ? originalBooking.date.toDate() : originalBooking.date;

        for (let i = 1; i <= 4; i++) {
            const nextDate = addDays(originalDate, i * 7);
            const newBooking: Omit<Booking, 'id'> = {
                ...originalBooking,
                date: Timestamp.fromDate(nextDate),
                status: 'confirmed',
                isRecurring: true,
            };
            // remove id from object before saving
            const { id, ...bookingData } = newBooking;
            const newBookingRef = doc(collection(db, "bookings"));
            batch.set(newBookingRef, bookingData);
        }
        await batch.commit();
    };

  const acceptBooking = async (bookingToAccept: Booking, isTrusted: boolean): Promise<'accepted' | 'slot-taken' | 'requires-admin'> => {
      if (!isTrusted) {
        return 'requires-admin';
      }
    
      const result = await confirmBooking(bookingToAccept);
      
      if (result === 'slot-taken') {
          await updateDoc(doc(db, "bookings", bookingToAccept.id), { status: 'cancelled' });
          return 'slot-taken';
      }

      return 'accepted';
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking, blockSlot, unblockSlot, acceptBooking, confirmBooking, createConfirmedBooking, createRecurringBookings }}>
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
