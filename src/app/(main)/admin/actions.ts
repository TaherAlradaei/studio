"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
  return await analyzeBookingPatterns(input);
}

export async function getPaymentInstructions(): Promise<string> {
  if (!db) {
    return "Firebase is not configured. Please check your environment variables.";
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
    return "Error fetching payment instructions. Please contact support.";
  }
}

export async function updatePaymentInstructions(instructions: string): Promise<void> {
    if (!db) {
        console.error("Firebase is not configured. Cannot update instructions.");
        throw new Error("Firebase is not configured. Cannot update instructions.");
    }
    try {
        const instructionsDocRef = doc(db, "settings", "paymentInfo");
        await setDoc(instructionsDocRef, { instructions });
    } catch (error) {
        console.error("Error updating payment instructions:", error);
        throw new Error("Failed to update instructions");
    }
}
