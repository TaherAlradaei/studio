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
}
