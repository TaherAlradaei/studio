"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
  return await analyzeBookingPatterns(input);
}
