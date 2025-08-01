
export interface Booking {
  id: string;
  userId: string | null;
  name: string | null;
  phone: string | null;
  date: Date;
  time: string;
  duration: number; // in hours
  status: 'pending' | 'awaiting-confirmation' | 'confirmed' | 'cancelled' | 'blocked';
  price?: number;
  isRecurring?: boolean;
}

export interface PostComment {
  author: string;
  text: string;
}

export interface MemberPost {
  id: string;
  author: string;
  photoUrl: string;
  story?: string;
  comments?: PostComment[];
}

export interface AcademyRegistration {
  id: string;
  userId: string;
  parentName: string;
  phone: string;
  talentName: string;
  birthDate: Date;
  ageGroup: "U10" | "U14";
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
  accessCode?: string;
  posts: MemberPost[];
}

export interface User {
    uid: string;
    displayName: string | null;
    phone: string | null;
    isAdmin?: boolean;
}
