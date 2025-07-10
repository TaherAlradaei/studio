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

// In-memory store for trusted customers.
let trustedCustomers: string[] = ["Waheeb Hameed"];

export async function getTrustedCustomers(): Promise<string[]> {
  return trustedCustomers;
}

export async function addTrustedCustomer(name: string): Promise<void> {
    if (name && !trustedCustomers.includes(name)) {
        trustedCustomers.push(name);
    }
}

export async function removeTrustedCustomer(name: string): Promise<void> {
    trustedCustomers = trustedCustomers.filter(customer => customer !== name);
}

export async function isTrustedCustomer(name: string | null): Promise<boolean> {
    if (!name) return false;
    return trustedCustomers.includes(name);
}
