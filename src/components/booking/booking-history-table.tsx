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
import { useAuth } from "@/context/auth-context";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function BookingHistoryTable() {
  const { bookings, updateBooking, acceptBooking } = useBookings();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

  const userBookings = bookings.filter(b => b.userId === user?.uid && new Date(b.date) >= new Date() && b.status !== 'cancelled');

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const handleAccept = async (booking: Booking) => {
    const result = await acceptBooking(booking);

    if (result === 'accepted') {
        toast({
            title: t.toasts.bookingConfirmedTitle,
            description: t.toasts.bookingConfirmedDesc.replace('{date}', new Date(booking.date).toLocaleDateString(lang)).replace('{time}', booking.time),
        });
    } else if (result === 'slot-taken') {
        toast({
            title: t.toasts.slotUnavailableTitle,
            description: t.toasts.slotUnavailableDesc,
            variant: "destructive",
        });
        router.push('/');
    }
  };

  const handleDecline = async (booking: Booking) => {
      await updateBooking(booking.id, { status: 'cancelled' });
      toast({
          title: t.toasts.bookingUpdateTitle,
          description: t.toasts.bookingCancelled,
          variant: "destructive"
      });
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t.bookingHistoryTable.statusPending}</Badge>;
      case 'awaiting-confirmation':
        return <Badge className="bg-yellow-500 hover:bg-yellow-500/80">{t.bookingHistoryTable.statusAwaitingConfirmation}</Badge>;
      case 'confirmed':
        return <Badge variant="default">{t.bookingHistoryTable.statusConfirmed}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t.bookingHistoryTable.statusCancelled}</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (booking: Booking) => {
    if ((booking.status === 'confirmed' || booking.status === 'awaiting-confirmation') && typeof booking.price === 'number') {
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
            <TableHead>{t.bookingHistoryTable.price}</TableHead>
            <TableHead>{t.bookingHistoryTable.status}</TableHead>
            <TableHead className="text-right">{t.bookingHistoryTable.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userBookings.length > 0 ? (
            userBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {new Date(booking.date).toLocaleDateString(lang, dateOptions)}
                </TableCell>
                <TableCell>{booking.time}</TableCell>
                <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                <TableCell>{formatPrice(booking)}</TableCell>
                <TableCell>
                  {getStatusBadge(booking.status)}
                </TableCell>
                <TableCell className="text-right">
                  {booking.status === 'awaiting-confirmation' && (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={() => handleAccept(booking)}>{t.actions.accept}</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDecline(booking)}>{t.actions.decline}</Button>
                    </div>
                  )}
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
