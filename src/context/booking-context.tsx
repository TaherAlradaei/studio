"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Booking } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, Timestamp, orderBy, query, deleteDoc, runTransaction, where } from "firebase/firestore";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price">) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  blockSlot: (date: Date, time: string) => Promise<void>;
  unblockSlot: (id: string) => Promise<void>;
  acceptBooking: (booking: Booking) => Promise<'accepted' | 'slot-taken'>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Note: You will need to create a "bookings" collection in your Firestore database.
    const q = query(collection(db, "bookings"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to JS Date
        const date = (data.date as Timestamp)?.toDate();
        if (date) {
            bookingsData.push({ ...data, id: doc.id, date } as Booking);
        }
      });
      setBookings(bookingsData);
    }, (error) => {
        console.error("Error fetching bookings: ", error);
        // You might want to handle this error in your UI
    });

    return () => unsubscribe();
  }, []);

  const addBooking = async (newBookingData: Omit<Booking, "id" | "status" | "price">) => {
    try {
      await addDoc(collection(db, "bookings"), {
        ...newBookingData,
        status: 'pending',
      });
    } catch (error) {
      console.error("Error adding booking: ", error);
    }
  };
  
  const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id'>>) => {
    const bookingDoc = doc(db, "bookings", id);
    try {
      await updateDoc(bookingDoc, updates);
    } catch (error) {
      console.error("Error updating booking: ", error);
    }
  };

  const blockSlot = async (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(hours, minutes, 0, 0);
    try {
      await addDoc(collection(db, "bookings"), {
        userId: 'admin_blocked',
        name: 'Blocked Slot',
        phone: null,
        date: bookingDate,
        time,
        duration: 1, // Default block duration to 1 hour
        status: 'blocked',
      });
    } catch (error) {
      console.error("Error blocking slot:", error);
    }
  };

  const unblockSlot = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bookings", id));
    } catch (error) {
      console.error("Error unblocking slot:", error);
    }
  };

  const acceptBooking = async (bookingToAccept: Booking): Promise<'accepted' | 'slot-taken'> => {
    const bookingDocRef = doc(db, "bookings", bookingToAccept.id);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingDocRef);
        if (!bookingDoc.exists() || bookingDoc.data().status !== 'awaiting-confirmation') {
          return 'slot-taken';
        }

        const newBookingStartTime = (bookingToAccept.date as Date);
        const newBookingEndTime = new Date(newBookingStartTime.getTime() + bookingToAccept.duration * 3600 * 1000);
        
        const dayStart = new Date(newBookingStartTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(newBookingStartTime);
        dayEnd.setHours(23, 59, 59, 999);

        const bookingsCol = collection(db, "bookings");
        // NOTE: This query may require a composite index in Firestore for production environments.
        const q = query(bookingsCol, 
          where("status", "==", "confirmed"),
          where("date", ">=", dayStart),
          where("date", "<=", dayEnd)
        );
        
        const confirmedBookingsSnapshot = await transaction.get(q);

        let isSlotTaken = false;
        for (const doc of confirmedBookingsSnapshot.docs) {
          const b_data = doc.data()
          const b = { ...b_data, date: (b_data.date as Timestamp).toDate()} as Booking
          
          const existingBookingStartTime = b.date;
          const existingBookingEndTime = new Date(existingBookingStartTime.getTime() + b.duration * 3600 * 1000);
          
          if (Math.max(newBookingStartTime.getTime(), existingBookingStartTime.getTime()) < Math.min(newBookingEndTime.getTime(), existingBookingEndTime.getTime())) {
            isSlotTaken = true;
            break;
          }
        }
        
        if (isSlotTaken) {
          transaction.update(bookingDocRef, { status: 'cancelled' });
          return 'slot-taken';
        } else {
          transaction.update(bookingDocRef, { status: 'confirmed' });
          
          // Also cancel other pending/awaiting requests for the same slot
          const pendingQuery = query(bookingsCol,
            where("status", "in", ["pending", "awaiting-confirmation"]),
            where("date", ">=", dayStart),
            where("date", "<=", dayEnd)
          );
          const pendingBookingsSnapshot = await transaction.get(pendingQuery);

          for (const doc of pendingBookingsSnapshot.docs) {
              if (doc.id === bookingToAccept.id) continue;
              const b_data = doc.data();
              const b = { ...b_data, date: (b_data.date as Timestamp).toDate()} as Booking;
              
              const pendingBookingStartTime = b.date;
              const pendingBookingEndTime = new Date(pendingBookingStartTime.getTime() + b.duration * 3600 * 1000);
              
              if (Math.max(newBookingStartTime.getTime(), pendingBookingStartTime.getTime()) < Math.min(newBookingEndTime.getTime(), pendingBookingEndTime.getTime())) {
                  transaction.update(doc.ref, { status: 'cancelled' });
              }
          }
          return 'accepted';
        }
      });

      return result;
    } catch (e) {
      console.error("Booking acceptance transaction failed: ", e);
      throw e;
    }
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
