"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
    return await analyzeBookingPatterns(input);
}

// In-memory store for payment instructions. Will be reset on server restart.
let paymentInstructions = "Please contact us at +967 736 333 328 to finalize payment.";

export async function getPaymentInstructions(): Promise<string> {
  return paymentInstructions;
}

export async function updatePaymentInstructions(instructions: string): Promise<void> {
    paymentInstructions = instructions;
}
