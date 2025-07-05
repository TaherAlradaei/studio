"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, CalendarDays, Clock } from "lucide-react";
import { getSchedulingRecommendations } from "./actions";
import { useBookings } from "@/context/booking-context";
import { useLanguage } from "@/context/language-context";
import type { Booking } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const availableTimes = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { bookings, updateBooking, blockSlot, unblockSlot } = useBookings();
  const [bookingData, setBookingData] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [price, setPrice] = useState("");
  const { toast } = useToast();

  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(new Date());

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError("");
    setRecommendations("");
    try {
      const result = await getSchedulingRecommendations({ bookingData });
      if (result?.recommendations) {
        setRecommendations(result.recommendations);
      } else {
        setError(t.adminPage.errorEmpty);
      }
    } catch (err) {
      setError(t.adminPage.errorAnalyzing);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseMockData = () => {
    setBookingData(JSON.stringify(bookings, null, 2));
  };

  const handleConfirmClick = (booking: Booking) => {
    setEditingBooking(booking);
    setPrice(booking.price?.toString() || "");
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!booking.id) return;
    await updateBooking(booking.id, { status: 'cancelled' });
    toast({
      title: t.toasts.bookingUpdateTitle,
      description: t.toasts.bookingUpdateDesc.replace('{name}', booking.name || 'N/A'),
      variant: "destructive"
    });
  };

  const handleConfirmSubmit = async () => {
    if (!editingBooking || !editingBooking.id) return;
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid positive number for the price.",
        variant: "destructive",
      });
      return;
    }
    await updateBooking(editingBooking.id, { status: 'awaiting-confirmation', price: newPrice });
    toast({
      title: t.toasts.bookingUpdateTitle,
      description: t.toasts.priceQuoteSent.replace('{name}', editingBooking.name || 'N/A'),
    });
    setEditingBooking(null);
    setPrice("");
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
      case 'blocked':
        return <Badge variant="outline">{t.adminPage.blocked}</Badge>;
      default:
        return null;
    }
  };


  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
          <Wand2 className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            {t.header.admin}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-8">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.adminPage.bookingManagementCardTitle}</CardTitle>
            <CardDescription>{t.adminPage.bookingManagementCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.bookingHistoryTable.date}</TableHead>
                    <TableHead>{t.bookingHistoryTable.time}</TableHead>
                    <TableHead>{t.adminPage.customer}</TableHead>
                    <TableHead>{t.adminPage.duration}</TableHead>
                    <TableHead>{t.adminPage.price}</TableHead>
                    <TableHead>{t.adminPage.status}</TableHead>
                    <TableHead className="text-right">{t.adminPage.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{format(booking.date, 'PP')}</TableCell>
                        <TableCell>{booking.time}</TableCell>
                        <TableCell>{booking.name}<br/><span className="text-sm text-muted-foreground">{booking.phone}</span></TableCell>
                        <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                        <TableCell>{booking.price ? `${booking.price.toLocaleString()} YR` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" onClick={() => handleConfirmClick(booking)}>{t.adminPage.confirm}</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancelBooking(booking)}>{t.adminPage.cancel}</Button>
                            </div>
                          )}
                           {(booking.status === 'confirmed' || booking.status === 'awaiting-confirmation') && (
                            <Button size="sm" variant="outline" onClick={() => handleConfirmClick(booking)}>{t.adminPage.edit}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">{t.adminPage.noBookings}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{t.adminPage.manageAvailabilityCardTitle}</CardTitle>
                <CardDescription>{t.adminPage.manageAvailabilityCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                     <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-6 h-6 text-primary" />
                            <CardTitle className="font-headline text-xl">{t.bookingPage.selectDate}</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={availabilityDate}
                            onSelect={setAvailabilityDate}
                            className="rounded-md"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                    </div>
                </div>
                <div>
                    {availabilityDate && (
                    <>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline text-xl">{t.timeSlotPicker.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableTimes.map((time) => {
                                const slotDateTime = new Date(availabilityDate);
                                const [hours, minutes] = time.split(':').map(Number);
                                slotDateTime.setHours(hours, minutes, 0, 0);

                                const booking = bookings.find(b => {
                                    const bookingDate = new Date(b.date);
                                    return bookingDate.toDateString() === slotDateTime.toDateString() && b.time === time && b.status !== 'cancelled';
                                });

                                const isBooked = !!booking && booking.status !== 'blocked';
                                const isBlocked = !!booking && booking.status === 'blocked';
                                const isPast = slotDateTime < new Date();
                                
                                return (
                                <div key={time} className="relative">
                                    <Button
                                    variant={isBooked ? "secondary" : isBlocked ? "destructive" : "outline"}
                                    className="w-full"
                                    disabled={isBooked || isPast}
                                    onClick={() => {
                                        if (isBlocked) {
                                            unblockSlot(booking.id);
                                        } else {
                                            blockSlot(availabilityDate, time);
                                        }
                                    }}
                                    >
                                    {time}
                                    </Button>
                                    <div className="absolute -bottom-5 left-0 right-0 text-center text-xs">
                                        {isBooked && <Badge variant="secondary">{t.adminPage.booked}</Badge>}
                                        {isBlocked && <Badge variant="destructive">{t.adminPage.blocked}</Badge>}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </>
                    )}
                </div>
            </CardContent>
        </Card>


        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.adminPage.title}</CardTitle>
            <CardDescription>
             {t.adminPage.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={bookingData}
              onChange={(e) => setBookingData(e.target.value)}
              rows={15}
              placeholder={t.adminPage.dataPlaceholder}
              className="font-code"
            />
             <div className="flex flex-wrap gap-2">
              <Button onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.adminPage.analyzingButton}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t.adminPage.analyzeButton}
                  </>
                )}
              </Button>
               <Button onClick={handleUseMockData} variant="outline">
                {t.adminPage.useMockButton}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t.adminPage.errorTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {recommendations && (
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-accent" />
                {t.adminPage.recommendationsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {recommendations}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminPage.confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {editingBooking && `${editingBooking.name} - ${format(editingBooking.date, 'PPP')} @ ${editingBooking.time}`}
              <br />
              {t.adminPage.confirmDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="price">{t.adminPage.priceLabel}</Label>
            <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 8000" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>{t.adminPage.confirmSubmitButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
