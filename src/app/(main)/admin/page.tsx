"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
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

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { bookings, updateBooking } = useBookings();
  const [bookingData, setBookingData] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [price, setPrice] = useState("");
  const { toast } = useToast();

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
    await updateBooking(booking.id, { status: 'cancelled' });
    toast({
      title: t.toasts.bookingUpdateTitle,
      description: t.toasts.bookingUpdateDesc.replace('{name}', booking.name),
      variant: "destructive"
    });
  };

  const handleConfirmSubmit = async () => {
    if (!editingBooking) return;
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid positive number for the price.",
        variant: "destructive",
      });
      return;
    }
    await updateBooking(editingBooking.id, { status: 'confirmed', price: newPrice });
    toast({
      title: t.toasts.bookingUpdateTitle,
      description: t.toasts.bookingUpdateDesc.replace('{name}', editingBooking.name),
    });
    setEditingBooking(null);
    setPrice("");
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
                           {booking.status === 'confirmed' && (
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
