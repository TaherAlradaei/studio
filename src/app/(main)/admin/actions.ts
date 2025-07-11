"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
    return await analyzeBookingPatterns(input);
}

// In-memory stores have been moved to client-side localStorage in AdminPage to ensure persistence.
// These server actions are no longer used but are kept for reference or future server-side implementation.

// let paymentInstructions = "Please contact us at +967 736 333 328 to finalize payment.";

export async function getPaymentInstructions(): Promise<string> {
  // This is a placeholder. The value is now managed client-side.
  return "Please contact us at +967 736 333 328 to finalize payment.";
}

export async function updatePaymentInstructions(instructions: string): Promise<void> {
    // This is a placeholder. The value is now managed client-side.
    // paymentInstructions = instructions;
}

// let trustedCustomers: string[] = ["Waheeb Hameed"];

export async function getTrustedCustomers(): Promise<string[]> {
  // This is a placeholder. The value is now managed client-side.
  return ["Waheeb Hameed"];
}

export async function addTrustedCustomer(name: string): Promise<void> {
    // This is a placeholder. The value is now managed client-side.
    // if (name && !trustedCustomers.includes(name)) {
    //     trustedCustomers.push(name);
    // }
}

export async function removeTrustedCustomer(name: string): Promise<void> {
    // This is a placeholder. The value is now managed client-side.
    // trustedCustomers = trustedCustomers.filter(customer => customer !== name);
}

export async function isTrustedCustomer(name: string | null): Promise<boolean> {
    // This is a placeholder. The value is now managed client-side.
    if (!name) return false;
    // return trustedCustomers.includes(name);
    return name === "Waheeb Hameed"; // Default fallback
}
