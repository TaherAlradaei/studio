'use server';

/**
 * @fileOverview A flow for fetching players looking for a team.
 *
 * - getTeamRegistrations - Fetches all registrations from the findATeamRegistrations collection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamRegistration } from '@/lib/types';


const TeamRegistrationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    phone: z.string(),
    position: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward", "Any"]),
    availability: z.string(),
    status: z.enum(['pending', 'placed']),
    submittedAt: z.any(), // Timestamps are tricky to serialize, handle as any for now
});

const GetTeamRegistrationsOutputSchema = z.array(TeamRegistrationSchema);

export async function getTeamRegistrations(): Promise<z.infer<typeof GetTeamRegistrationsOutputSchema>> {
    return getTeamRegistrationsFlow();
}

const getTeamRegistrationsFlow = ai.defineFlow(
  {
    name: 'getTeamRegistrationsFlow',
    inputSchema: z.void(),
    outputSchema: GetTeamRegistrationsOutputSchema,
  },
  async () => {
    const registrationsCol = collection(db, 'findATeamRegistrations');
    const snapshot = await getDocs(registrationsCol);
    const registrations = snapshot.docs.map(doc => {
      const data = doc.data();
      // Manually handle Timestamp serialization
      const submittedAt = (data.submittedAt as Timestamp);
      return {
        id: doc.id,
        ...data,
        submittedAt: {
            seconds: submittedAt.seconds,
            nanoseconds: submittedAt.nanoseconds,
        },
      } as any;
    });
    return registrations;
  }
);
