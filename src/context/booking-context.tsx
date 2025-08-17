

"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import type { Booking } from "@/lib/types";
import { addDays, startOfDay } from 'date-fns';
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
    runTransaction,
    getDoc
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
      const bookingToConfirmRef = doc(db, "bookings", bookingToConfirm.id);
      
      const bookingDoc = await transaction.get(bookingToConfirmRef);
      if (!bookingDoc.exists()) {
        throw "Booking does not exist!";
      }

      const bookingDate = (bookingDoc.data().date as Timestamp).toDate();
      const bookingTime = bookingDoc.data().time;
      const bookingDuration = bookingDoc.data().duration;
  
      // --- Time overlap calculation logic ---
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const newBookingStartMinutes = timeToMinutes(bookingTime);
      const newBookingEndMinutes = newBookingStartMinutes + bookingDuration * 60;
  
      // --- Check for conflicts with already confirmed/blocked slots ---
      const conflictingConfirmedQuery = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(startOfDay(bookingDate))),
        where("status", "in", ["confirmed", "blocked"])
      );
  
      const confirmedSnapshot = await getDocs(conflictingConfirmedQuery);
  
      for (const doc of confirmedSnapshot.docs) {
        // A transaction doesn't need to read from the server again for docs it already has
        const existingBooking = doc.data() as Booking;
        const existingStartMinutes = timeToMinutes(existingBooking.time);
        const existingEndMinutes = existingStartMinutes + existingBooking.duration * 60;
  
        if (Math.max(newBookingStartMinutes, existingStartMinutes) < Math.min(newBookingEndMinutes, existingEndMinutes)) {
          return 'slot-taken'; // Conflict found
        }
      }
  
      // --- If no conflicts, proceed with confirmation and cancellation of pending ---
      
      // 1. Confirm the target booking
      transaction.update(bookingToConfirmRef, { status: 'confirmed' });
  
      // 2. Find and cancel all other overlapping pending/awaiting-confirmation bookings
      const conflictingPendingQuery = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(startOfDay(bookingDate))),
        where("status", "in", ["pending", "awaiting-confirmation"])
      );
  
      const pendingSnapshot = await getDocs(conflictingPendingQuery);
  
      for (const doc of pendingSnapshot.docs) {
          if (doc.id === bookingToConfirm.id) continue; // Don't cancel itself
          
          const pendingBooking = doc.data() as Booking;
          const pendingStartMinutes = timeToMinutes(pendingBooking.time);
          const pendingEndMinutes = pendingStartMinutes + pendingBooking.duration * 60;
  
          if (Math.max(newBookingStartMinutes, pendingStartMinutes) < Math.min(newBookingEndMinutes, pendingEndMinutes)) {
              transaction.update(doc.ref, { status: 'cancelled' });
          }
      }
      
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
