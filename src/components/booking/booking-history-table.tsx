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
import { useLanguage } from "@/context/language-context";

export function BookingHistoryTable() {
  const { bookings } = useBookings();
  const { t, lang } = useLanguage();
  const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date());

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.bookingHistoryTable.date}</TableHead>
            <TableHead>{t.bookingHistoryTable.time}</TableHead>
            <TableHead>{t.bookingHistoryTable.duration}</TableHead>
            <TableHead>{t.bookingHistoryTable.name}</TableHead>
            <TableHead className="text-right">{t.bookingHistoryTable.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {new Date(booking.date).toLocaleDateString(lang, dateOptions)}
                </TableCell>
                <TableCell>{booking.time}</TableCell>
                <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                <TableCell>{booking.name}</TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{t.bookingHistoryTable.upcoming}</Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                {t.bookingHistoryTable.noBookings}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
