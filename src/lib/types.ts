
import type { Timestamp } from "firebase/firestore";

export interface Booking {
  id: string;
  userId: string | null;
  name: string | null;
  phone: string | null;
  date: Timestamp | Date; // Allow both for easier handling
  time: string;
  duration: number; // in hours
  status: 'pending' | 'awaiting-confirmation' | 'confirmed' | 'cancelled' | 'blocked';
  price?: number;
  isRecurring?: boolean;
}

export interface PostComment {
  author: string;
  text: string;
  createdAt: Timestamp;
}

export interface MemberPost {
  id: string;
  author: string;
  photoUrl: string;
  storagePath?: string; // To track the file in Firebase Storage for deletion
  story?: string;
  comments?: PostComment[];
  createdAt: Timestamp;
}

export interface AcademyRegistration {
  id:string;
  userId: string;
  parentName: string;
  phone: string;
  talentName: string;
  birthDate: Timestamp | Date; // Allow both
  ageGroup: "U10" | "U14";
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Timestamp;
  accessCode?: string;
  posts?: MemberPost[];
}

export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phone: string | null;
    isAdmin?: boolean;
}

export interface Background {
  url: string;
  hint: string;
  path?: string;
}

export interface WelcomePageContent {
  title: string;
  message: string;
  fieldImageUrl: string;
  fieldImageUrlPath?: string;
  coachImageUrl: string;
  coachImageUrlPath?: string;
}
