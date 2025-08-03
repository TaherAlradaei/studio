
"use client";

import { useState, useEffect } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getDefaultPrice } from "@/lib/pricing";
import { getPaymentInstructions } from "@/app/(main)/admin/actions";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

export function BookingHistoryTable() {
  const { bookings, updateBooking, acceptBooking } = useBookings();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
        const instructions = await getPaymentInstructions();
        setPaymentInstructions(instructions);
    };
    fetchSettings();
  }, []);

  const userBookings = bookings.filter(b => b.userId === user?.uid && (b.date as Timestamp).toDate() >= new Date(new Date().setHours(0,0,0,0)) && b.status !== 'cancelled');

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const handleAccept = async (booking: Booking) => {
    try {
      const trustedCustomersDoc = await getDoc(doc(db, "settings", "trustedCustomers"));
      const trustedCustomers = trustedCustomersDoc.exists() ? trustedCustomersDoc.data().names : [];
      const isTrusted = trustedCustomers.includes(booking.name || "");
        
      const result = await acceptBooking(booking, isTrusted);
      
      setCurrentBooking(booking);

      if (result === 'slot-taken') {
          toast({
              title: t.toasts.slotUnavailableTitle,
              description: t.toasts.slotUnavailableDesc,
              variant: "destructive",
          });
          router.push('/');
      } else if (result === 'requires-admin') {
          setShowPaymentDialog(true);
      } else if (result === 'accepted') {
          toast({
              title: t.toasts.bookingConfirmedTitle,
              description: t.toasts.bookingConfirmedDesc
                  .replace('{date}', (booking.date as Timestamp).toDate().toLocaleDateString(lang))
                  .replace('{time}', booking.time),
          });
      }
    } catch(err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to accept booking.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (booking: Booking) => {
    try {
      await updateBooking(booking.id, { status: 'cancelled' });
      toast({
          title: t.toasts.bookingUpdateTitle,
          description: t.toasts.bookingCancelled,
          variant: "destructive"
      });
    } catch(err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to decline booking.",
        variant: "destructive",
      });
    }
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
      const estimatedPrice = getDefaultPrice(booking.time) * booking.duration;
      const formattedPrice = t.bookingHistoryTable.priceEstimated.replace('{price}', estimatedPrice.toLocaleString());
      return <span className="text-muted-foreground" title={t.bookingHistoryTable.priceTBD}>{formattedPrice}</span>;
    }
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm">
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
                    {(booking.date as Timestamp).toDate().toLocaleDateString(lang, dateOptions)}
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

      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.bookingHistoryTable.paymentDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    {currentBooking && t.bookingHistoryTable.paymentDialogDescription
                        .replace('{date}', (currentBooking.date as Timestamp).toDate().toLocaleDateString(lang))
                        .replace('{time}', currentBooking.time)}
                    <div className="mt-4 p-4 bg-muted/50 rounded-md border text-sm text-foreground">
                        <p className="whitespace-pre-wrap font-sans">{paymentInstructions}</p>
                    </div>
                  </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowPaymentDialog(false)}>{t.actions.ok}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
