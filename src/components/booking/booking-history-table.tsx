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
import type { Booking } from "@/lib/types";

export function BookingHistoryTable() {
  const { bookings } = useBookings();
  const { t, lang } = useLanguage();
  const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date() && b.status !== 'cancelled');

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t.bookingHistoryTable.statusPending}</Badge>;
      case 'confirmed':
        return <Badge variant="default">{t.bookingHistoryTable.statusConfirmed}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t.bookingHistoryTable.statusCancelled}</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (booking: Booking) => {
    if (booking.status === 'confirmed' && typeof booking.price === 'number') {
      return `${booking.price.toLocaleString()} YR`;
    }
    if (booking.status === 'pending') {
      const estimatedPrice = 8000 * booking.duration;
      const formattedPrice = t.bookingHistoryTable.priceEstimated.replace('{price}', estimatedPrice.toLocaleString());
      return <span className="text-muted-foreground" title={t.bookingHistoryTable.priceTBD}>{formattedPrice}</span>;
    }
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.bookingHistoryTable.date}</TableHead>
            <TableHead>{t.bookingHistoryTable.time}</TableHead>
            <TableHead>{t.bookingHistoryTable.duration}</TableHead>
            <TableHead>{t.bookingHistoryTable.name}</TableHead>
            <TableHead>{t.bookingHistoryTable.price}</TableHead>
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
                <TableCell>{formatPrice(booking)}</TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(booking.status)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                {t.bookingHistoryTable.noBookings}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
