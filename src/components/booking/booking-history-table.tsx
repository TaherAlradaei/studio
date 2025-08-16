
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

export function BookingHistoryTable() {
  const { updateBooking, acceptBooking } = useBookings();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
        const instructions = await getPaymentInstructions();
        setPaymentInstructions(instructions);
    };
    fetchSettings();

    if (user?.uid) {
        const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const bookingsData: Booking[] = [];
            querySnapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
            });
            const userBookings = bookingsData.filter(b => (b.date as Timestamp).toDate() >= new Date(new Date().setHours(0,0,0,0)) && b.status !== 'cancelled')
                                          .sort((a, b) => (a.date as Timestamp).toMillis() - (b.date as Timestamp).toMillis());
            setBookings(userBookings);
        });
        return () => unsubscribe();
    }
  }, [user]);

  const handleAccept = async (booking: Booking) => {
    try {
      setCurrentBooking(booking);
      const result = await acceptBooking(booking);
      
      if (result === 'slot-taken') {
          toast({
              title: t.toasts.slotUnavailableTitle,
              description: t.toasts.slotUnavailableDesc,
              variant: "destructive",
          });
          router.push('/booking'); // Redirect to try again
      } else if (result === 'requires-admin') {
          setShowPaymentDialog(true);
      } else if (result === 'accepted') {
          const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
          toast({
              title: t.toasts.bookingConfirmedTitle,
              description: t.toasts.bookingConfirmedDesc
                  .replace('{date}', bookingDate.toLocaleDateString(lang))
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
      // For pending, we show the price that was quoted.
      if (typeof booking.price === 'number') {
        return `${booking.price.toLocaleString()} YR`;
      }
      // Fallback if price isn't set for some reason
      const estimatedPrice = getDefaultPrice(booking.time) * booking.duration;
      const formattedPrice = t.bookingHistoryTable.priceEstimated.replace('{price}', estimatedPrice.toLocaleString());
      return <span className="text-muted-foreground" title={t.bookingHistoryTable.priceTBD}>{formattedPrice}</span>;
    }
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm">
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
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {format(booking.date instanceof Timestamp ? booking.date.toDate() : booking.date, 'PP', { locale: lang === 'ar' ? arSA : undefined })}
                  </TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                  <TableCell>{formatPrice(booking)}</TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(booking.status === 'awaiting-confirmation' || (booking.status === 'pending' && user?.isTrusted)) && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleAccept(booking)}>{t.actions.accept}</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDecline(booking)}>{t.actions.decline}</Button>
                      </div>
                    )}
                     {(booking.status === 'pending' && !user?.isTrusted) && (
                      <p className="text-xs text-muted-foreground text-right">{t.bookingHistoryTable.statusPending}</p>
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

      {/* Mobile Card View */}
      <div className="grid md:hidden gap-4">
        {bookings.length > 0 ? (
            bookings.map((booking) => {
              const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
              return (
                <Card key={booking.id} className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">
                                  {format(bookingDate, 'PPP', { locale: lang === 'ar' ? arSA : undefined })}
                                </CardTitle>
                                <CardDescription>{t.bookingHistoryTable.time}: {booking.time}</CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.bookingHistoryTable.duration}</span>
                            <span>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.bookingHistoryTable.price}</span>
                            <span>{formatPrice(booking)}</span>
                        </div>
                         {(booking.status === 'awaiting-confirmation' || (booking.status === 'pending' && user?.isTrusted)) && (
                            <div className="pt-3 border-t flex gap-2 justify-end flex-wrap">
                               <Button size="sm" onClick={() => handleAccept(booking)} className="flex-1">{t.actions.accept}</Button>
                               <Button size="sm" variant="destructive" onClick={() => handleDecline(booking)} className="flex-1">{t.actions.decline}</Button>
                            </div>
                         )}
                          {(booking.status === 'pending' && !user?.isTrusted) && (
                              <p className="text-xs text-muted-foreground text-center pt-3 border-t">{t.bookingHistoryTable.statusPending}</p>
                          )}
                    </CardContent>
                </Card>
              )
            })
        ) : (
            <div className="text-center text-muted-foreground py-12">{t.bookingHistoryTable.noBookings}</div>
        )}
      </div>

      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.bookingHistoryTable.paymentDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    <p>
                      {currentBooking && t.bookingHistoryTable.paymentDialogDescription
                          .replace('{date}', (currentBooking.date instanceof Timestamp ? currentBooking.date.toDate() : currentBooking.date).toLocaleDateString(lang))
                          .replace('{time}', currentBooking.time)}
                    </p>
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
