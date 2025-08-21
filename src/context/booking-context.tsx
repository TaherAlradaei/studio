

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
    const bookingDate = bookingToConfirm.date instanceof Timestamp ? bookingToConfirm.date.toDate() : bookingToConfirm.date;

    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const newBookingStartMinutes = timeToMinutes(bookingToConfirm.time);
    const newBookingEndMinutes = newBookingStartMinutes + bookingToConfirm.duration * 60;

    // Fetch ALL bookings for the given day to check for conflicts before starting the transaction.
    const allBookingsForDayQuery = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(startOfDay(bookingDate)))
    );

    const snapshot = await getDocs(allBookingsForDayQuery);
    const bookingsForDay = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

    // Check for conflicts with already confirmed or blocked slots
    const hasConflict = bookingsForDay.some(existingBooking => {
        if (existingBooking.status !== 'confirmed' && existingBooking.status !== 'blocked') {
            return false;
        }
        const existingStartMinutes = timeToMinutes(existingBooking.time);
        const existingEndMinutes = existingStartMinutes + existingBooking.duration * 60;
        return Math.max(newBookingStartMinutes, existingStartMinutes) < Math.min(newBookingEndMinutes, existingEndMinutes);
    });

    if (hasConflict) {
        return 'slot-taken';
    }

    // Identify other pending/awaiting-confirmation bookings that conflict and need to be cancelled
    const bookingsToCancel = bookingsForDay.filter(b => {
        if (b.id === bookingToConfirm.id || (b.status !== 'pending' && b.status !== 'awaiting-confirmation')) {
            return false;
        }
        const pendingStartMinutes = timeToMinutes(b.time);
        const pendingEndMinutes = pendingStartMinutes + b.duration * 60;
        return Math.max(newBookingStartMinutes, pendingStartMinutes) < Math.min(newBookingEndMinutes, pendingEndMinutes);
    });

    // Now, run the transaction to perform the atomic write operations
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Confirm the target booking
            const bookingToConfirmRef = doc(db, "bookings", bookingToConfirm.id);
            transaction.update(bookingToConfirmRef, { status: 'confirmed' });

            // 2. Cancel all conflicting pending bookings
            bookingsToCancel.forEach(b => {
                const bookingToCancelRef = doc(db, "bookings", b.id);
                transaction.update(bookingToCancelRef, { status: 'cancelled' });
            });
        });
        return 'confirmed';
    } catch (error) {
        console.error("Transaction failed: ", error);
        // If the transaction fails, it's safer to assume the slot might have been taken by another process.
        return 'slot-taken';
    }
  };

  const createConfirmedBooking = async (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }): Promise<'confirmed' | 'slot-taken'> => {
      // Check for conflicts before creating the document
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const newBookingStartMinutes = timeToMinutes(bookingData.time);
      const newBookingEndMinutes = newBookingStartMinutes + bookingData.duration * 60;
      const conflictingConfirmedQuery = query(
        collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(startOfDay(bookingData.date))),
        where("status", "in", ["confirmed", "blocked"])
      );
      const confirmedSnapshot = await getDocs(conflictingConfirmedQuery);
      for (const doc of confirmedSnapshot.docs) {
        const existingBooking = doc.data() as Booking;
        const existingStartMinutes = timeToMinutes(existingBooking.time);
        const existingEndMinutes = existingStartMinutes + existingBooking.duration * 60;
        if (Math.max(newBookingStartMinutes, existingStartMinutes) < Math.min(newBookingEndMinutes, existingEndMinutes)) {
          return 'slot-taken';
        }
      }

      // If no conflict, create the booking directly as confirmed.
      const tempBooking: Omit<Booking, 'id'> = {
        ...bookingData,
        userId: 'admin_manual',
        status: 'confirmed', 
        date: Timestamp.fromDate(bookingData.date),
      };
      await addDoc(collection(db, "bookings"), tempBooking);

      return 'confirmed';
  };

    const createRecurringBookings = async (originalBooking: Booking): Promise<void> => {
        const batch = writeBatch(db);
        const originalDate = originalBooking.date instanceof Timestamp ? originalBooking.date.toDate() : originalBooking.date;

        for (let i = 1; i <= 4; i++) {
            const nextDate = addDays(originalDate, i * 7);
            
            // Generate a new unique object for the new booking, but don't include the old ID.
            const { id, ...originalBookingData } = originalBooking;
            
            const newBooking: Omit<Booking, 'id'> = {
                ...originalBookingData,
                date: Timestamp.fromDate(nextDate),
                status: 'confirmed',
                isRecurring: true,
            };
            const newBookingRef = doc(collection(db, "bookings"));
            batch.set(newBookingRef, newBooking);
        }
        await batch.commit();
    };

  const acceptBooking = async (bookingToAccept: Booking): Promise<'accepted' | 'slot-taken' | 'requires-admin'> => {
    
    if (!user || !user.isTrusted) {
        return 'requires-admin';
    }
  
    const result = await confirmBooking(bookingToAccept);
    
    if (result === 'slot-taken') {
        // The transaction failed because the slot was taken. We should update the UI.
        // The booking that failed should be marked as cancelled so the user knows.
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
