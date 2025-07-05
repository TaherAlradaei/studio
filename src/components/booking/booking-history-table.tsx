"use client";

import { useBookings } from "@/context/booking-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function BookingHistoryTable() {
  const { bookings } = useBookings();
  const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date());

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell>{booking.time}</TableCell>
                <TableCell>{booking.duration} hr(s)</TableCell>
                <TableCell>{booking.name}</TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Upcoming</Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                You have no upcoming bookings.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
