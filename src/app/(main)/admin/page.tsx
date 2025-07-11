
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, CalendarDays, Clock, Info, ImageUp, ShieldCheck, Settings, LayoutDashboard, KeyRound, UserCheck, Trash2, UserPlus, Repeat } from "lucide-react";
import { getSchedulingRecommendations } from "./actions";
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
import { getDefaultPrice } from "@/lib/pricing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";


const generateAvailableTimes = () => {
    const times = [];
    // Morning: 07:00 to 11:30
    for (let i = 7; i < 12; i++) {
        times.push(`${i.toString().padStart(2, '0')}:00`);
        times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    // Afternoon: 14:00 to 23:30
    for (let i = 14; i <= 23; i++) {
        times.push(`${i.toString().padStart(2, '0')}:00`);
        times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return times;
};
const availableTimes = generateAvailableTimes();


type SectionId = 'bookingManagement' | 'academyRegistrations' | 'addAcademyMember' | 'manageAvailability' | 'trustedCustomers' | 'manageLogo' | 'manageBackgrounds' | 'paymentInstructions' | 'schedulingAssistant';

interface AdminSection {
  id: SectionId;
  title: string;
  component: React.ReactNode;
}

const AddMemberForm = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { addRegistration } = useAcademy();
  const { user } = useAuth();

  const formSchema = z.object({
    parentName: z.string().min(2, { message: t.academyPage.validation.parentNameMin }),
    phone: z.string().regex(/^[\d\s]{7,15}$/, { message: t.bookingForm.validation.phoneFormat }),
    talentName: z.string().min(2, { message: t.academyPage.validation.talentNameMin }),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: t.academyPage.validation.birthDateInvalid,
    }),
    ageGroup: z.enum(["U10", "U14"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentName: "",
      phone: "",
      talentName: "",
      birthDate: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
     if (!user) {
        toast({
            title: t.auth.notLoggedInTitle,
            description: t.auth.notLoggedInDesc,
            variant: "destructive",
        });
        return;
    }
    
    try {
      await addRegistration({
        userId: 'admin_added', // or some other identifier
        ...values,
        birthDate: new Date(values.birthDate),
      }, 'accepted'); // Automatically accept members added by admin
      toast({
        title: t.adminPage.memberAddedSuccessTitle,
        description: t.adminPage.memberAddedSuccessDesc.replace('{name}', values.talentName),
      });
      form.reset();
    } catch (error) {
      toast({
        title: t.adminPage.errorTitle,
        description: error instanceof Error ? error.message : "Failed to add member.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            <CardTitle>{t.adminPage.addMemberCardTitle}</CardTitle>
        </div>
        <CardDescription>{t.adminPage.addMemberCardDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.academyPage.parentNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.academyPage.parentNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.bookingForm.phoneLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.bookingForm.phonePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="talentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.academyPage.talentNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.academyPage.talentNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.academyPage.birthDateLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.academyPage.ageGroupLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.academyPage.ageGroupPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="U10">{t.academyPage.ageGroupU10}</SelectItem>
                      <SelectItem value="U14">{t.academyPage.ageGroupU14}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto">
              {t.adminPage.addMemberButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { bookings, updateBooking, unblockSlot, confirmBooking, createConfirmedBooking, createRecurringBookings } = useBookings();
  const { registrations, updateRegistrationStatus } = useAcademy();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState("");
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState("");

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [hourlyPrice, setHourlyPrice] = useState("");

  const [newManualBooking, setNewManualBooking] = useState<{date: Date, time: string, duration: number} | null>(null);
  const [manualBookingName, setManualBookingName] = useState("");
  const [manualBookingPhone, setManualBookingPhone] = useState("");
  const [manualBookingDuration, setManualBookingDuration] = useState(1);
  
  const [infoBooking, setInfoBooking] = useState<Booking | null>(null);
  const [recurringBooking, setRecurringBooking] = useState<Booking | null>(null);
  
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(new Date());
  const [availabilityDuration, setAvailabilityDuration] = useState(1);
  
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());
  const [filterType, setFilterType] = useState<"week" | "day" | "month">("week");

  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [trustedCustomers, setTrustedCustomers] = useState<string[]>([]);
  const [newTrustedCustomer, setNewTrustedCustomer] = useState("");

  const { backgrounds, updateBackground } = useBackground();
  const { logo, updateLogo } = useLogo();
  const [hintInputs, setHintInputs] = useState<string[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const [sectionsOrder, setSectionsOrder] = useState<SectionId[]>([
    'bookingManagement', 
    'manageAvailability',
    'academyRegistrations', 
    'addAcademyMember',
    'trustedCustomers',
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
    try {
        const storedInstructions = localStorage.getItem('paymentInstructions');
        if (storedInstructions) {
            setPaymentInstructions(storedInstructions);
        } else {
            setPaymentInstructions("Please contact us at +967 736 333 328 to finalize payment.");
        }

        const storedCustomers = localStorage.getItem('trustedCustomers');
        if (storedCustomers) {
            setTrustedCustomers(JSON.parse(storedCustomers));
        } else {
            setTrustedCustomers(["Waheeb Hameed"]);
        }
    } catch (err) {
        toast({
            title: t.adminPage.errorTitle,
            description: "Failed to load settings from local storage.",
            variant: "destructive",
        });
    }
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

  const handleSetPriceClick = (booking: Booking) => {
    setEditingBooking(booking);
    if (booking.price && booking.duration > 0) {
      setHourlyPrice((booking.price / booking.duration).toString());
    } else {
      const defaultPrice = getDefaultPrice(booking.time);
      setHourlyPrice(defaultPrice.toString());
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

  const handleQuoteSubmit = async () => {
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

  const handleAdminConfirmBooking = async (booking: Booking) => {
    try {
      const result = await confirmBooking(booking);
      if (result === 'confirmed') {
        toast({
            title: t.toasts.bookingConfirmedTitle,
            description: t.toasts.bookingConfirmedDescAdmin.replace('{name}', booking.name || 'N/A'),
        });
      }
    } catch (err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to confirm booking.",
        variant: "destructive",
      });
    }
  };

  const handleManualBookingSubmit = async () => {
    if (!newManualBooking || !manualBookingName || !manualBookingPhone) {
        toast({
            title: t.adminPage.errorTitle,
            description: t.adminPage.manualBookingError,
            variant: "destructive",
        });
        return;
    }
    try {
        await createConfirmedBooking({
            name: manualBookingName,
            phone: manualBookingPhone,
            date: newManualBooking.date,
            time: newManualBooking.time,
            duration: manualBookingDuration,
            price: getDefaultPrice(newManualBooking.time) * manualBookingDuration,
        });
        toast({
            title: t.toasts.bookingConfirmedTitle,
            description: t.toasts.bookingConfirmedDescAdmin.replace('{name}', manualBookingName),
        });
        setNewManualBooking(null);
        setManualBookingName("");
        setManualBookingPhone("");
        setManualBookingDuration(1);
    } catch (err) {
        toast({
            title: t.adminPage.errorTitle,
            description: err instanceof Error ? err.message : "Failed to create booking.",
            variant: "destructive",
        });
    }
  };


  const handleSaveInstructions = async () => {
    setIsSaving(true);
    try {
        localStorage.setItem('paymentInstructions', paymentInstructions);
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
  
  const handleAddTrustedCustomer = async () => {
    if (!newTrustedCustomer.trim()) return;
    try {
        const updatedCustomers = [...trustedCustomers, newTrustedCustomer.trim()];
        setTrustedCustomers(updatedCustomers);
        localStorage.setItem('trustedCustomers', JSON.stringify(updatedCustomers));
        setNewTrustedCustomer("");
        toast({
            title: t.adminPage.trustedCustomerAddedToastTitle,
            description: t.adminPage.trustedCustomerAddedToastDesc.replace('{name}', newTrustedCustomer),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add trusted customer.";
        toast({ title: t.adminPage.errorTitle, description: message, variant: "destructive" });
    }
  };
  
  const handleRemoveTrustedCustomer = async (customerName: string) => {
    try {
        const updatedCustomers = trustedCustomers.filter(customer => customer !== customerName);
        setTrustedCustomers(updatedCustomers);
        localStorage.setItem('trustedCustomers', JSON.stringify(updatedCustomers));
        toast({
            title: t.adminPage.trustedCustomerRemovedToastTitle,
            description: t.adminPage.trustedCustomerRemovedToastDesc.replace('{name}', customerName),
            variant: "destructive",
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove trusted customer.";
        toast({ title: t.adminPage.errorTitle, description: message, variant: "destructive" });
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
    
    const handleMakeRecurring = (booking: Booking) => {
        setRecurringBooking(booking);
    };

    const handleConfirmRecurring = async () => {
        if (!recurringBooking) return;
        try {
            await createRecurringBookings(recurringBooking);
            toast({
                title: t.adminPage.recurringBookingSuccessTitle,
                description: t.adminPage.recurringBookingSuccessDesc
                    .replace('{name}', recurringBooking.name || ''),
            });
            setRecurringBooking(null);
        } catch (err) {
             toast({
                title: t.adminPage.errorTitle,
                description: err instanceof Error ? err.message : "Failed to create recurring bookings.",
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
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const isSlotBooked = (date: Date, time: string, duration: number, bookings: Booking[]): boolean => {
    const slotStartMinutes = timeToMinutes(time);
    const newBookingStartMinutes = slotStartMinutes;
    const newBookingEndMinutes = newBookingStartMinutes + duration * 60;

    for (const booking of bookings) {
      if (booking.status !== 'confirmed' && booking.status !== 'blocked') continue;
      
      const bookingDate = new Date(booking.date);
      if (bookingDate.toDateString() === date.toDateString()) {
        const existingBookingStartMinutes = timeToMinutes(booking.time);
        const existingBookingEndMinutes = existingBookingStartMinutes + booking.duration * 60;
        
        if (Math.max(newBookingStartMinutes, existingBookingStartMinutes) < Math.min(newBookingEndMinutes, existingBookingEndMinutes)) {
          return true;
        }
      }
    }
    return false;
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
                <Label className="px-1">{t.adminPage.filterByDate}</Label>
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  className="rounded-md border w-full sm:w-auto mt-2"
                  locale={lang === 'ar' ? arSA : undefined}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  weekStartsOn={6}
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
                              <Button size="sm" onClick={() => handleSetPriceClick(booking)}>{t.adminPage.setPriceButton}</Button>
                            )}
                            {booking.status === 'awaiting-confirmation' && (
                                <>
                                    <Button size="sm" variant="default" onClick={() => handleAdminConfirmBooking(booking)}>{t.adminPage.confirmButton}</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSetPriceClick(booking)}>{t.adminPage.edit}</Button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleSetPriceClick(booking)}>{t.adminPage.edit}</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleMakeRecurring(booking)}>
                                      <Repeat className="mr-2 h-4 w-4" />
                                      {t.adminPage.makeRecurringButton}
                                  </Button>
                                </>
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
    addAcademyMember: {
        id: 'addAcademyMember',
        title: t.adminPage.addMemberCardTitle,
        component: <AddMemberForm />
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
                     <CardHeader className="p-0 mb-4">
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
                            locale={lang === 'ar' ? arSA : undefined}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            weekStartsOn={6}
                        />
                    </div>
                </div>
                <div>
                    {availabilityDate && (
                    <>
                        <CardHeader className="p-0 mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline text-xl">{t.timeSlotPicker.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="mb-4">
                            <Label htmlFor="admin-duration" className="block text-sm font-medium mb-2">
                                {t.timeSlotPicker.durationLabel}
                            </Label>
                            <Select
                                value={availabilityDuration.toString()}
                                onValueChange={(value) => setAvailabilityDuration(parseFloat(value))}
                            >
                                <SelectTrigger id="admin-duration" className="w-[180px]">
                                    <SelectValue placeholder={t.timeSlotPicker.durationPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t.timeSlotPicker.oneHour}</SelectItem>
                                    <SelectItem value="1.5">{t.timeSlotPicker.oneAndHalfHour}</SelectItem>
                                    <SelectItem value="2">{t.timeSlotPicker.twoHours}</SelectItem>
                                    <SelectItem value="2.5">2.5 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableTimes.map((time) => {
                                const slotDateTime = new Date(availabilityDate);
                                const [hours, minutes] = time.split(':').map(Number);
                                slotDateTime.setHours(hours, minutes, 0, 0);

                                const booking = bookings.find(b => {
                                  if (b.status === 'cancelled') return false;
                                  const bookingDate = new Date(b.date);
                                  if (bookingDate.toDateString() !== slotDateTime.toDateString()) return false;
                                  
                                  const bookingStartMinutes = timeToMinutes(b.time);
                                  const bookingEndMinutes = bookingStartMinutes + b.duration * 60;
                                  const slotStartMinutes = timeToMinutes(time);

                                  return slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes;
                                });

                                const isPast = new Date() > slotDateTime;
                                const isBookedForManual = isSlotBooked(availabilityDate, time, availabilityDuration, bookings);
                                
                                let buttonVariant: "default" | "secondary" | "destructive" | "outline" | "ghost" = "outline";
                                let buttonClassName = "w-full";
                                let badgeContent = null;
                                let isDisabled = isPast || (isBookedForManual && !booking);

                                if (booking) {
                                    isDisabled = true;
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
                                                    setManualBookingDuration(availabilityDuration);
                                                    setNewManualBooking({date: availabilityDate, time, duration: availabilityDuration});
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
    trustedCustomers: {
      id: 'trustedCustomers',
      title: t.adminPage.trustedCustomersCardTitle,
      component: (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-primary" />
                    <CardTitle>{t.adminPage.trustedCustomersCardTitle}</CardTitle>
                </div>
                <CardDescription>{t.adminPage.trustedCustomersCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new-trusted-customer">{t.adminPage.addTrustedCustomerLabel}</Label>
                  <div className="flex gap-2 mt-2">
                      <Input 
                          id="new-trusted-customer"
                          value={newTrustedCustomer}
                          onChange={(e) => setNewTrustedCustomer(e.target.value)}
                          placeholder={t.adminPage.trustedCustomerNamePlaceholder}
                      />
                      <Button onClick={handleAddTrustedCustomer}>{t.adminPage.addCustomerButton}</Button>
                  </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">{t.adminPage.trustedCustomersListTitle}</h4>
                    {trustedCustomers.length > 0 ? (
                        <div className="border rounded-lg p-2 space-y-2 max-h-48 overflow-y-auto">
                            {trustedCustomers.map(customer => (
                                <div key={customer} className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                                    <span>{customer}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveTrustedCustomer(customer)}>
                                        <Trash2 className="w-4 h-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t.adminPage.noTrustedCustomers}</p>
                    )}
                </div>
            </CardContent>
        </Card>
      )
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
            <AlertDialogAction onClick={handleQuoteSubmit}>{t.adminPage.confirmSubmitButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!newManualBooking} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setNewManualBooking(null);
                setManualBookingDuration(1);
            }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminPage.manualBookingTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {newManualBooking && t.adminPage.manualBookingDescription.replace('{date}', format(newManualBooking.date, 'PPP', { locale: lang === 'ar' ? arSA : undefined })).replace('{time}', newManualBooking.time)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-name" className="text-right">{t.bookingForm.nameLabel}</Label>
                  <Input id="manual-name" value={manualBookingName} onChange={(e) => setManualBookingName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-phone" className="text-right">{t.bookingForm.phoneLabel}</Label>
                  <Input id="manual-phone" value={manualBookingPhone} onChange={(e) => setManualBookingPhone(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-duration" className="text-right">{t.bookingHistoryTable.duration}</Label>
                   <Select
                        value={manualBookingDuration.toString()}
                        onValueChange={(value) => setManualBookingDuration(parseFloat(value))}
                    >
                        <SelectTrigger id="manual-duration" className="col-span-3">
                            <SelectValue placeholder={t.timeSlotPicker.durationPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">{t.timeSlotPicker.oneHour}</SelectItem>
                            <SelectItem value="1.5">{t.timeSlotPicker.oneAndHalfHour}</SelectItem>
                            <SelectItem value="2">{t.timeSlotPicker.twoHours}</SelectItem>
                            <SelectItem value="2.5">2.5 Hours</SelectItem>
                        </SelectContent>
                    </Select>
              </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualBookingSubmit}>{t.adminPage.confirmButton}</AlertDialogAction>
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

      <AlertDialog open={!!recurringBooking} onOpenChange={() => setRecurringBooking(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t.adminPage.recurringBookingTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {recurringBooking && 
                        t.adminPage.recurringBookingDesc
                            .replace('{name}', recurringBooking.name || '')
                            .replace('{time}', recurringBooking.time)
                            .replace('{day}', format(new Date(recurringBooking.date), 'EEEE', { locale: lang === 'ar' ? arSA : undefined }))
                    }
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmRecurring}>{t.adminPage.confirmButton}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
