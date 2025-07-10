
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, CalendarDays, Clock, Info, ImageUp, ShieldCheck, Settings, LayoutDashboard, KeyRound } from "lucide-react";
import { getSchedulingRecommendations, getPaymentInstructions, updatePaymentInstructions } from "./actions";
import { useBookings } from "@/context/booking-context";
import { useAcademy } from "@/context/academy-context";
import { useLanguage } from "@/context/language-context";
import type { Booking, AcademyRegistration } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth, isWithinInterval, differenceInYears } from "date-fns";
import { arSA } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useBackground } from "@/context/background-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogo } from "@/context/logo-context";

const availableTimes = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

type SectionId = 'bookingManagement' | 'academyRegistrations' | 'manageAvailability' | 'manageLogo' | 'manageBackgrounds' | 'paymentInstructions' | 'schedulingAssistant';

interface AdminSection {
  id: SectionId;
  title: string;
  component: React.ReactNode;
}

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { bookings, updateBooking, blockSlot, unblockSlot } = useBookings();
  const { registrations, updateRegistrationStatus } = useAcademy();
  const [bookingData, setBookingData] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [infoBooking, setInfoBooking] = useState<Booking | null>(null);
  const [hourlyPrice, setHourlyPrice] = useState("");

  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(new Date());
  
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());
  const [filterType, setFilterType] = useState<"week" | "day" | "month">("week");
  const [calendarView, setCalendarView] = useState<'1m' | '2m'>('1m');

  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { backgrounds, updateBackground } = useBackground();
  const { logo, updateLogo } = useLogo();
  const [hintInputs, setHintInputs] = useState<string[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const [sectionsOrder, setSectionsOrder] = useState<SectionId[]>([
    'bookingManagement', 
    'academyRegistrations', 
    'manageAvailability', 
    'manageLogo', 
    'manageBackgrounds', 
    'paymentInstructions', 
    'schedulingAssistant'
  ]);

  useEffect(() => {
    setHintInputs(backgrounds.map(b => b.hint));
    fileInputRefs.current = backgrounds.map(() => null);
  }, [backgrounds]);

  useEffect(() => {
    async function fetchInstructions() {
      try {
        const instructions = await getPaymentInstructions();
        setPaymentInstructions(instructions);
      } catch (err) {
        toast({
            title: t.adminPage.errorTitle,
            description: err instanceof Error ? err.message : "Failed to load payment instructions.",
            variant: "destructive",
        });
      }
    }
    fetchInstructions();
  }, [toast, t]);

  const filteredBookings = useMemo(() => {
    const date = filterDate || new Date();
    
    let interval;
    switch (filterType) {
      case 'day':
        interval = { start: startOfDay(date), end: endOfDay(date) };
        break;
      case 'week':
        interval = { start: startOfDay(date), end: endOfDay(addDays(date, 6)) };
        break;
      case 'month':
        interval = { start: startOfMonth(date), end: endOfMonth(date) };
        break;
    }

    return bookings
      .filter(booking => isWithinInterval(new Date(booking.date), interval))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
  }, [bookings, filterDate, filterType]);

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
      const message = err instanceof Error ? err.message : t.adminPage.errorAnalyzing;
      setError(message);
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
    if (booking.price && booking.duration > 0) {
      setHourlyPrice((booking.price / booking.duration).toString());
    } else {
      setHourlyPrice("8000"); // Default hourly rate
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!booking.id) return;
    try {
      await updateBooking(booking.id, { status: 'cancelled' });
      toast({
        title: t.toasts.bookingUpdateTitle,
        description: t.toasts.bookingUpdateDesc.replace('{name}', booking.name || 'N/A'),
        variant: "destructive"
      });
    } catch (err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to cancel booking.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmSubmit = async () => {
    if (!editingBooking || !editingBooking.id) return;
    const newHourlyPrice = parseFloat(hourlyPrice);
    if (isNaN(newHourlyPrice) || newHourlyPrice < 0) {
      toast({
        title: t.adminPage.invalidPriceToastTitle,
        description: t.adminPage.invalidPriceToastDesc,
        variant: "destructive",
      });
      return;
    }
    try {
      const totalPrice = newHourlyPrice * editingBooking.duration;
      await updateBooking(editingBooking.id, { status: 'awaiting-confirmation', price: totalPrice });
      toast({
        title: t.toasts.bookingUpdateTitle,
        description: t.toasts.priceQuoteSent.replace('{name}', editingBooking.name || 'N/A'),
      });
      setEditingBooking(null);
      setHourlyPrice("");
    } catch (err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to update booking.",
        variant: "destructive"
      });
    }
  };

  const handleSaveInstructions = async () => {
    setIsSaving(true);
    try {
        await updatePaymentInstructions(paymentInstructions);
        toast({
            title: t.adminPage.instructionsSavedToastTitle,
            description: t.adminPage.instructionsSavedToastDesc,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save instructions.";
        toast({
            title: t.adminPage.errorTitle,
            description: message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hintInputs];
    newHints[index] = value;
    setHintInputs(newHints);
  };

  const handleReplaceClick = (index: number) => {
      fileInputRefs.current[index]?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const newUrl = e.target?.result as string;
              const newHint = hintInputs[index] || '';
              updateBackground(index, { url: newUrl, hint: newHint });
              toast({
                  title: t.adminPage.backgroundUpdatedToastTitle,
                  description: t.adminPage.backgroundUpdatedToastDesc,
              });
          };
          reader.readAsDataURL(file);
      }
      // Reset file input value to allow re-uploading the same file
      event.target.value = '';
  };
  
    const handleLogoReplaceClick = () => {
        logoFileInputRef.current?.click();
    };

    const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newUrl = e.target?.result as string;
                updateLogo(newUrl);
                toast({
                    title: t.adminPage.logoUpdatedToastTitle,
                    description: t.adminPage.logoUpdatedToastDesc,
                });
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    const handleRegistrationStatusUpdate = async (registration: AcademyRegistration, status: 'accepted' | 'rejected') => {
        try {
            await updateRegistrationStatus(registration.id, status);
            toast({
                title: t.toasts.registrationUpdateTitle,
                description: t.toasts.registrationUpdateDesc
                    .replace('{name}', registration.talentName)
                    .replace('{status}', status === 'accepted' ? t.academyPage.statusAccepted : t.academyPage.statusRejected),
            });
        } catch (err) {
            toast({
                title: t.adminPage.errorTitle,
                description: err instanceof Error ? err.message : "Failed to update registration.",
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
      case 'blocked':
        return <Badge variant="outline">{t.adminPage.blocked}</Badge>;
      default:
        return null;
    }
  };

  const getRegistrationStatusBadge = (status: AcademyRegistration['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t.academyPage.statusPending}</Badge>;
      case 'accepted':
        return <Badge variant="default">{t.academyPage.statusAccepted}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t.academyPage.statusRejected}</Badge>;
      default:
        return null;
    }
  };

  const sections: Record<SectionId, AdminSection> = {
    bookingManagement: {
      id: 'bookingManagement',
      title: t.adminPage.bookingManagementCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.adminPage.bookingManagementCardTitle}</CardTitle>
            <CardDescription>{t.adminPage.bookingManagementCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 mb-6 p-4 border rounded-lg bg-background/50">
              <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <Label className="px-1">{t.adminPage.filterByDate}</Label>
                    <div className="flex flex-col items-end">
                        <Label className="text-xs mb-1">{t.adminPage.calendarView}</Label>
                        <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)}>
                            <TabsList className="h-8">
                                <TabsTrigger value="1m" className="text-xs px-2 py-1 h-auto">{t.adminPage.oneMonth}</TabsTrigger>
                                <TabsTrigger value="2m" className="text-xs px-2 py-1 h-auto">{t.adminPage.twoMonths}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  className="rounded-md border w-full sm:w-auto"
                  locale={lang === 'ar' ? arSA : undefined}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  weekStartsOn={6}
                  numberOfMonths={calendarView === '1m' ? 1 : 2}
                />
              </div>
              <div className="flex-1">
                <Label>{t.adminPage.filterByRange}</Label>
                <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mt-2">
                  <TabsList>
                    <TabsTrigger value="day">{t.adminPage.day}</TabsTrigger>
                    <TabsTrigger value="week">{t.adminPage.week}</TabsTrigger>
                    <TabsTrigger value="month">{t.adminPage.month}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-sm text-muted-foreground mt-4">{t.adminPage.filterDescription}</p>
              </div>
            </div>
            
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
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{format(booking.date, 'PP', { locale: lang === 'ar' ? arSA : undefined })}</TableCell>
                        <TableCell>{booking.time}</TableCell>
                        <TableCell>{booking.name}<br/><span className="text-sm text-muted-foreground">{booking.phone}</span></TableCell>
                        <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                        <TableCell>{booking.price ? `${booking.price.toLocaleString()} YR` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {booking.status === 'pending' && (
                              <Button size="sm" onClick={() => handleConfirmClick(booking)}>{t.adminPage.confirm}</Button>
                            )}
                            {(booking.status === 'awaiting-confirmation' || booking.status === 'confirmed') && (
                              <Button size="sm" variant="outline" onClick={() => handleConfirmClick(booking)}>{t.adminPage.edit}</Button>
                            )}
                            {(booking.status !== 'cancelled' && booking.status !== 'blocked') && (
                                <Button size="sm" variant={booking.status === 'pending' ? 'outline' : 'destructive'} onClick={() => handleCancelBooking(booking)}>{t.adminPage.cancel}</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">{t.adminPage.noBookingsInView}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ),
    },
    academyRegistrations: {
      id: 'academyRegistrations',
      title: t.adminPage.academyRegistrationsTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <CardTitle>{t.adminPage.academyRegistrationsTitle}</CardTitle>
                </div>
                <CardDescription>{t.adminPage.academyRegistrationsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.adminPage.talentName}</TableHead>
                                <TableHead>{t.adminPage.age}</TableHead>
                                <TableHead>{t.adminPage.ageGroup}</TableHead>
                                <TableHead>{t.adminPage.parentContact}</TableHead>
                                <TableHead>{t.adminPage.accessCode}</TableHead>
                                <TableHead>{t.adminPage.status}</TableHead>
                                <TableHead className="text-right">{t.adminPage.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.length > 0 ? (
                                registrations.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>{reg.talentName}</TableCell>
                                        <TableCell>{differenceInYears(new Date(), new Date(reg.birthDate))}</TableCell>
                                        <TableCell>{reg.ageGroup}</TableCell>
                                        <TableCell>{reg.parentName}<br /><span className="text-sm text-muted-foreground">{reg.phone}</span></TableCell>
                                        <TableCell>
                                            {reg.status === 'accepted' && reg.accessCode && (
                                                <div className="flex items-center gap-2 font-mono text-sm">
                                                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                                                    <span>{reg.accessCode}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{getRegistrationStatusBadge(reg.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {reg.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" onClick={() => handleRegistrationStatusUpdate(reg, 'accepted')}>{t.actions.accept}</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleRegistrationStatusUpdate(reg, 'rejected')}>{t.actions.decline}</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">{t.adminPage.noRegistrations}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      ),
    },
    manageAvailability: {
      id: 'manageAvailability',
      title: t.adminPage.manageAvailabilityCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{t.adminPage.manageAvailabilityCardTitle}</CardTitle>
                <CardDescription>{t.adminPage.manageAvailabilityCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                     <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline text-xl">{t.bookingPage.selectDate}</CardTitle>
                            </div>
                            <div className="flex flex-col items-end">
                                <Label className="text-xs mb-1">{t.adminPage.calendarView}</Label>
                                <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)}>
                                    <TabsList className="h-8">
                                        <TabsTrigger value="1m" className="text-xs px-2 py-1 h-auto">{t.adminPage.oneMonth}</TabsTrigger>
                                        <TabsTrigger value="2m" className="text-xs px-2 py-1 h-auto">{t.adminPage.twoMonths}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={availabilityDate}
                            onSelect={setAvailabilityDate}
                            className="rounded-md"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            locale={lang === 'ar' ? arSA : undefined}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            weekStartsOn={6}
                            numberOfMonths={calendarView === '1m' ? 1 : 2}
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

                                const isPast = new Date() > slotDateTime;
                                
                                let buttonVariant: "default" | "secondary" | "destructive" | "outline" | "ghost" = "outline";
                                let buttonClassName = "w-full";
                                let badgeContent = null;
                                let isDisabled = isPast;

                                if (booking) {
                                    if (booking.status === 'pending' || booking.status === 'awaiting-confirmation') {
                                        isDisabled = true;
                                    }
                                    
                                    switch (booking.status) {
                                        case 'blocked':
                                            buttonVariant = 'destructive';
                                            badgeContent = <Badge variant="destructive">{t.adminPage.blocked}</Badge>;
                                            break;
                                        case 'confirmed':
                                            buttonVariant = 'secondary';
                                            badgeContent = <Badge variant="default">{t.bookingHistoryTable.statusConfirmed}</Badge>;
                                            break;
                                        case 'awaiting-confirmation':
                                            buttonVariant = 'default';
                                            buttonClassName = "w-full bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground";
                                            badgeContent = <Badge className="bg-yellow-500 hover:bg-yellow-500/80">{t.bookingHistoryTable.statusAwaitingConfirmation}</Badge>;
                                            break;
                                        case 'pending':
                                            buttonVariant = 'ghost';
                                            badgeContent = <Badge variant="secondary">{t.bookingHistoryTable.statusPending}</Badge>;
                                            break;
                                    }
                                }
                                
                                return (
                                <div key={time} className="relative">
                                    <Button
                                        variant={buttonVariant}
                                        className={buttonClassName}
                                        disabled={isDisabled}
                                        onClick={async () => {
                                            if (!availabilityDate) return;
                                            try {
                                                if (booking?.status === 'blocked') {
                                                    await unblockSlot(booking.id!);
                                                } else if (booking?.status === 'confirmed') {
                                                    setInfoBooking(booking);
                                                } else if (!booking) {
                                                    await blockSlot(availabilityDate, time);
                                                }
                                            } catch (err) {
                                                toast({
                                                    title: t.adminPage.errorTitle,
                                                    description: err instanceof Error ? err.message : "Failed to update availability.",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                    >
                                    {time}
                                    </Button>
                                    <div className="absolute -bottom-5 left-0 right-0 text-center text-xs">
                                        {badgeContent}
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
      ),
    },
    manageLogo: {
      id: 'manageLogo',
      title: t.adminPage.manageLogoCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ImageUp className="w-6 h-6 text-primary" />
                    <CardTitle>{t.adminPage.manageLogoCardTitle}</CardTitle>
                </div>
                <CardDescription>{t.adminPage.manageLogoCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <Image
                    src={logo.url}
                    alt="Current Logo"
                    width={80}
                    height={88}
                    className="h-20 w-auto object-contain rounded-md bg-white/80 p-2"
                />
                <div className="flex-1 w-full">
                     <Button onClick={handleLogoReplaceClick} className="w-full sm:w-auto">
                        {t.adminPage.replaceLogoButton}
                    </Button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={logoFileInputRef}
                        onChange={handleLogoFileChange}
                        className="hidden"
                    />
                </div>
            </CardContent>
        </Card>
      ),
    },
    manageBackgrounds: {
      id: 'manageBackgrounds',
      title: t.adminPage.manageBackgroundsCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ImageUp className="w-6 h-6 text-primary" />
                    <CardTitle>{t.adminPage.manageBackgroundsCardTitle}</CardTitle>
                </div>
                <CardDescription>{t.adminPage.manageBackgroundsCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {backgrounds.map((bg, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-background/50">
                        <Image
                            src={bg.url}
                            alt={`Background ${index + 1}`}
                            width={160}
                            height={90}
                            className="w-40 h-auto object-cover rounded-md aspect-video"
                            data-ai-hint={bg.hint}
                        />
                        <div className="flex-1 w-full space-y-2">
                            <Label htmlFor={`hint-${index}`}>{t.adminPage.imageHintLabel}</Label>
                            <Input
                                id={`hint-${index}`}
                                value={hintInputs[index] || ''}
                                onChange={(e) => handleHintChange(index, e.target.value)}
                                placeholder={t.adminPage.imageHintPlaceholder}
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <Button onClick={() => handleReplaceClick(index)} className="w-full">
                                {t.adminPage.replaceImageButton}
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={el => fileInputRefs.current[index] = el}
                                onChange={(e) => handleFileChange(e, index)}
                                className="hidden"
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      ),
    },
    paymentInstructions: {
      id: 'paymentInstructions',
      title: t.adminPage.paymentInstructionsCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Info className="w-6 h-6 text-primary" />
                    <CardTitle>{t.adminPage.paymentInstructionsCardTitle}</CardTitle>

                </div>
                <CardDescription>{t.adminPage.paymentInstructionsCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Label htmlFor="payment-instructions">{t.adminPage.paymentInstructionsLabel}</Label>
                <Textarea
                    id="payment-instructions"
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    rows={5}
                />
                <Button onClick={handleSaveInstructions} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.adminPage.savingButton}
                        </>
                    ) : (
                        t.adminPage.saveButton
                    )}
                </Button>
            </CardContent>
        </Card>
      ),
    },
    schedulingAssistant: {
      id: 'schedulingAssistant',
      title: t.adminPage.title,
      component: (
        <>
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
        </>
      ),
    }
  };


  return (
    <div className="container py-8">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-2">
          <Settings className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            {t.header.admin}
          </h1>
        </div>
      </div>

       <Tabs defaultValue="dashboard" className="max-w-6xl mx-auto">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t.adminPage.dashboardTab}
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Wand2 className="mr-2 h-4 w-4" />
            {t.adminPage.layoutTab}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="grid gap-8">
            {sectionsOrder.map(id => (
              <div key={id}>
                {sections[id].component}
              </div>
            ))}
        </TabsContent>
        <TabsContent value="layout">
            <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.adminPage.layoutTab}</CardTitle>
                    <CardDescription>{t.adminPage.layoutTabDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground">{t.adminPage.reorderComingSoon}</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminPage.confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {editingBooking && `${editingBooking.name} - ${format(editingBooking.date, 'PPP', { locale: lang === 'ar' ? arSA : undefined })} @ ${editingBooking.time} (${t.bookingHistoryTable.durationValue.replace('{duration}', editingBooking.duration.toString())})`}
              <br />
              {t.adminPage.confirmDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="hourly-price">{t.adminPage.priceLabel}</Label>
            <Input id="hourly-price" type="number" value={hourlyPrice} onChange={e => setHourlyPrice(e.target.value)} placeholder="e.g. 8000" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>{t.adminPage.confirmSubmitButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!infoBooking} onOpenChange={() => setInfoBooking(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.adminPage.bookingDetailsTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t.adminPage.bookingDetailsDescription.replace('{time}', infoBooking?.time || '')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className={cn("text-right", lang === 'ar' && "text-left")}>{t.adminPage.bookingDetailsName}</Label>
                    <span className="font-semibold">{infoBooking?.name}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className={cn("text-right", lang === 'ar' && "text-left")}>{t.adminPage.bookingDetailsPhone}</Label>
                    <span className="font-semibold" dir="ltr">{infoBooking?.phone}</span>
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setInfoBooking(null)}>{t.actions.ok}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
