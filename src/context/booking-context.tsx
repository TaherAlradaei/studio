
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

  useEffect(() => {
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingsData);
    });
    return () => unsubscribe();
  }, []);

  const addBooking = async (newBookingData: Omit<Booking, "id" | "status" | "price" | "date" | "isRecurring"> & {date: Date}) => {
    await addDoc(collection(db, "bookings"), {
      ...newBookingData,
      date: Timestamp.fromDate(newBookingData.date),
      status: 'pending',
    });
  };
  
  const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id' | 'date'>>) => {
    const bookingDocRef = doc(db, "bookings", id);
    const updateData: any = { ...updates };
    if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date as Date);
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
      const newBookingStartMinutes = timeToMinutes(bookingToConfirm.time);
      const newBookingEndMinutes = newBookingStartMinutes + bookingToConfirm.duration * 60;
      const bookingDate = (bookingToConfirm.date as Timestamp).toDate();
      
      const q = query(collection(db, "bookings"), 
        where("date", "==", Timestamp.fromDate(new Date(bookingDate.setHours(0,0,0,0)))),
        where("status", "in", ["confirmed", "blocked"])
      );
      const querySnapshot = await getDocs(q);
      
      const isSlotTakenByOther = querySnapshot.docs.some(bDoc => {
          const b = bDoc.data() as Booking;
          if (bDoc.id === bookingToConfirm.id) return false;

          const existingBookingStartMinutes = timeToMinutes(b.time);
          const existingBookingEndMinutes = existingBookingStartMinutes + b.duration * 60;

          return Math.max(newBookingStartMinutes, existingBookingStartMinutes) < Math.min(newBookingEndMinutes, existingBookingEndMinutes);
      });

      if (isSlotTakenByOther) {
          return 'slot-taken';
      }

      const batch = writeBatch(db);
      
      // Confirm the target booking
      const bookingToConfirmRef = doc(db, "bookings", bookingToConfirm.id);
      batch.update(bookingToConfirmRef, { status: 'confirmed' });

      // Cancel conflicting requests
      const conflictQ = query(collection(db, "bookings"),
        where("date", "==", Timestamp.fromDate(new Date(bookingDate.setHours(0,0,0,0)))),
        where("status", "in", ["pending", "awaiting-confirmation"])
      );
      const conflictSnapshot = await getDocs(conflictQ);

      conflictSnapshot.forEach(docSnap => {
          if (docSnap.id === bookingToConfirm.id) return;
          const b = docSnap.data() as Booking;
          const bookingStartMinutes = timeToMinutes(b.time);
          const bookingEndMinutes = bookingStartMinutes + b.duration * 60;
          const conflict = Math.max(newBookingStartMinutes, bookingStartMinutes) < Math.min(newBookingEndMinutes, bookingEndMinutes);
          if (conflict) {
              batch.update(docSnap.ref, { status: 'cancelled' });
          }
      });
      
      await batch.commit();
      return 'confirmed';
  };

  const createConfirmedBooking = async (bookingData: Omit<Booking, "id" | "status" | "userId" | "isRecurring" | "date"> & { date: Date }): Promise<'confirmed' | 'slot-taken'> => {
      const newBookingRef = doc(collection(db, "bookings"));
      // Create a temporary booking object with a pending status to run through the confirmation logic
      const tempBooking: Booking = {
        ...bookingData,
        id: newBookingRef.id,
        userId: 'admin_manual',
        date: Timestamp.fromDate(bookingData.date),
        status: 'pending', // Temporarily pending
      };
      
      // Set the document in Firestore so it exists for the confirmation logic
      await setDoc(newBookingRef, tempBooking);

      // Run the confirmation logic
      const result = await confirmBooking(tempBooking);
      
      if (result === 'slot-taken') {
          // If the slot is taken, delete the temporary booking we created
          await deleteDoc(newBookingRef);
          return 'slot-taken';
      }

      // The confirmBooking function already sets the status to 'confirmed'
      return 'confirmed';
  };

    const createRecurringBookings = async (originalBooking: Booking): Promise<void> => {
        const batch = writeBatch(db);
        const originalDate = (originalBooking.date as Timestamp).toDate();

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
