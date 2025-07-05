"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Booking } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, Timestamp, orderBy, query, deleteDoc } from "firebase/firestore";

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "price">) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  blockSlot: (date: Date, time: string) => Promise<void>;
  unblockSlot: (id: string) => Promise<void>;
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

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking, blockSlot, unblockSlot }}>
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
