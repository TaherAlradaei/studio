"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("The GOOGLE_API_KEY is not configured in your environment. Please add it to your .env file to use AI features.");
    }
    return await analyzeBookingPatterns(input);
}

export async function getPaymentInstructions(): Promise<string> {
  if (!db) {
    throw new Error("Firebase is not configured. Please check your environment variables.");
  }
  const instructionsDocRef = doc(db, "settings", "paymentInfo");
  try {
    const docSnap = await getDoc(instructionsDocRef);
    if (docSnap.exists()) {
      return docSnap.data().instructions || "";
    }
    // Return a default message if not set
    return "Please contact us at +967 736 333 328 to finalize payment.";
  } catch (error) {
    console.error("Error fetching payment instructions:", error);
    if (error instanceof Error) {
        throw new Error(`Could not fetch payment instructions: ${error.message}`);
    }
    throw new Error("Could not fetch payment instructions. Please contact support.");
  }
}

export async function updatePaymentInstructions(instructions: string): Promise<void> {
    if (!db) {
        throw new Error("Firebase is not configured. Cannot update instructions.");
    }
    try {
        const instructionsDocRef = doc(db, "settings", "paymentInfo");
        await setDoc(instructionsDocRef, { instructions });
    } catch (error) {
        console.error("Error updating payment instructions:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to update instructions: ${error.message}`);
        }
        throw new Error("Failed to update instructions due to an unknown error.");
    }
}
