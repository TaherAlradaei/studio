
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect } from "react";
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
    setDoc,
    runTransaction
} from "firebase/firestore";
import { getDefaultPrice } from "@/lib/pricing";
import { useAuth } from "./auth-context";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price" | "date" | "isRecurring"> & {date: Date}) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  blockSlot: (date: Date, time: string, duration: number) => Promise<void>;
  unblockSlot: (id: string) => Promise<void>;
  acceptBooking: (booking: Booking) => Promise<'accepted' | 'slot-taken' | 'requires-admin'>;
  confirmBooking: (bookingToConfirm: Booking) => Promise<'confirmed' | 'slot-taken'>;
  createConfirmedBooking: (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }) => Promise<'confirmed' | 'slot-taken'>;
  createRecurringBookings: (booking: Booking) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.isAdmin) {
      setBookings([]);
      return;
    }
    
     const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingsData);
    });
    return () => unsubscribe();
  }, [user?.isAdmin]);

  const addBooking = async (newBookingData: Omit<Booking, "id" | "status" | "price" | "date" | "isRecurring"> & {date: Date}) => {
    const price = getDefaultPrice(newBookingData.time) * newBookingData.duration;
    
    // Set status directly to 'awaiting-confirmation' to skip admin pricing step.
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
      return runTransaction(db, async (transaction) => {
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
          
          const dayBookingsSnapshot = await getDocs(q);

          for (const doc of dayBookingsSnapshot.docs) {
              if (doc.id === bookingToConfirm.id) continue;
              const b = doc.data() as Booking;
              const existingStart = new Date((b.date as Timestamp).toDate());
              const [existingStartHours, existingStartMinutes] = b.time.split(':').map(Number);
              existingStart.setHours(existingStartHours, existingStartMinutes, 0, 0);
              const existingEnd = new Date(existingStart.getTime() + b.duration * 60 * 60 * 1000);
              
              if (bookingStart < existingEnd && bookingEnd > existingStart) {
                  return 'slot-taken';
              }
          }

          const bookingToConfirmRef = doc(db, "bookings", bookingToConfirm.id);
          transaction.update(bookingToConfirmRef, { status: 'confirmed' });

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
                  transaction.update(conflictDoc.ref, { status: 'cancelled' });
              }
          });
          
          return 'confirmed';
      });
  };

  const createConfirmedBooking = async (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }): Promise<'confirmed' | 'slot-taken'> => {
      const newBookingRef = doc(collection(db, "bookings"));
      // Create a temporary booking object to pass to confirmBooking
      const tempBooking: Booking = {
        ...bookingData,
        id: newBookingRef.id,
        userId: 'admin_manual',
        // This is a temporary in-memory status. The transaction will set the final status.
        status: 'awaiting-confirmation', 
        date: Timestamp.fromDate(bookingData.date),
      };
      
      // Set the initial document data
      await setDoc(newBookingRef, { ...tempBooking });

      // Run the confirmation logic
      const result = await confirmBooking(tempBooking);
      
      if (result === 'slot-taken') {
          // If the slot was taken, delete the temporary booking doc we created
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

  const acceptBooking = async (bookingToAccept: Booking): Promise<'accepted' | 'slot-taken' | 'requires-admin'> => {
    
    if (!user || !user.isTrusted) {
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
