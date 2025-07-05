import { BookingHistoryTable } from "@/components/booking/booking-history-table";
import { Ticket } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Ticket className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                My Bookings
            </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Here is a list of all your upcoming reservations at Al Maidan Arena.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <BookingHistoryTable />
      </div>
    </div>
  );
}
