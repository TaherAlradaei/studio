export interface Booking {
  id: string;
  userId: string;
  name: string;
  phone: string;
  date: Date;
  time: string;
  duration: number; // in hours
  status: 'pending' | 'awaiting-confirmation' | 'confirmed' | 'cancelled';
  price?: number;
}
