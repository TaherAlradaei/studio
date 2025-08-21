

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, CalendarDays, Clock, Info, ImageUp, ShieldCheck, Settings, LayoutDashboard, KeyRound, UserCheck, Trash2, UserPlus, Repeat, Presentation, Lock, Image as ImageIcon, Phone, Building, User, Download, Archive, BookUser, Star, Users, Newspaper, PlusCircle } from "lucide-react";
import { getSchedulingRecommendations, getPaymentInstructions, updatePaymentInstructions, updateUserTrustedStatus, getAdminAccessCode, updateAdminAccessCode as updateAdminCodeAction, getWelcomePageContent, updateWelcomePageContent as updateWelcomeContentAction, uploadFile, deleteFile, getAllUsers, getGalleryImages, updateGalleryImages, exportBookings, exportAcademyRegistrations, createNewsArticle, getNewsArticles, updateNewsArticle, deleteNewsArticle } from "./actions";
import { useBookings } from "@/context/booking-context";
import { useAcademy } from "@/context/academy-context";
import { useLanguage } from "@/context/language-context";
import type { Booking, AcademyRegistration, GalleryImage, WelcomePageContent, User as UserType, SponsorImage, NewsArticle } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth, isWithinInterval, differenceInYears } from "date-fns";
import { arSA } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { cn, convertGsToHttps } from "@/lib/utils";
import { useBackground } from "@/context/background-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogo } from "@/context/logo-context";
import { getDefaultPrice } from "@/lib/pricing";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";


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
        parentName: values.parentName,
        phone: values.phone,
        talentName: values.talentName,
        ageGroup: values.ageGroup,
        birthDate: new Date(values.birthDate),
        creationMethod: 'admin'
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
  const { bookings: allBookings, unblockSlot, confirmBooking, createConfirmedBooking, createRecurringBookings, updateBooking } = useBookings();
  const { registrations, updateRegistrationStatus } = useAcademy();
  const { toast } = useToast();
  
  const [welcomePageContent, setWelcomePageContent] = useState<WelcomePageContent | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

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
  
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(undefined);
  const [availabilityDuration, setAvailabilityDuration] = useState(1);
  
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterType, setFilterType] = useState<"week" | "day" | "month">("week");
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>();
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>();


  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  const { backgrounds, updateBackground, isBackgroundsLoading, deleteBackground } = useBackground();
  const { logo, updateLogo, isLogoLoading } = useLogo();
  const [hintInputs, setHintInputs] = useState<string[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const welcomePageFieldImageInputRef = useRef<HTMLInputElement | null>(null);
  const welcomePageCoachImageInputRef = useRef<HTMLInputElement | null>(null);
  const welcomePageManagerImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);
  const sponsorImageInputRef = useRef<HTMLInputElement | null>(null);
  const newsImageInputRef = useRef<HTMLInputElement | null>(null);


  const [adminAccessCode, setAdminAccessCode] = useState("");
  const [newAdminCode, setNewAdminCode] = useState("");
  
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    // Set initial date only on client to avoid hydration errors
    setAvailabilityDate(new Date());
    setFilterDate(new Date());

  }, []);

  useEffect(() => {
    if (!isBackgroundsLoading && backgrounds && backgrounds.length > 0) {
        setHintInputs(backgrounds.map(b => b.hint));
        fileInputRefs.current = backgrounds.map(() => null);
    }
  }, [backgrounds, isBackgroundsLoading]);
  
  useEffect(() => {
    async function fetchContent() {
      try {
        setIsContentLoading(true);
        const [welcomeContent, galleryData] = await Promise.all([
          getWelcomePageContent(),
          getGalleryImages()
        ]);
        setWelcomePageContent(welcomeContent);
        setGalleryImages(galleryData);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load page content.", variant: "destructive" });
      } finally {
        setIsContentLoading(false);
      }
    }
    fetchContent();
  }, [toast]);

  useEffect(() => {
    async function fetchAdminData() {
        try {
            setIsUsersLoading(true);
            setIsNewsLoading(true);
            const [instructions, users, code, articles] = await Promise.all([
                getPaymentInstructions(),
                getAllUsers(),
                getAdminAccessCode(),
                getNewsArticles()
            ]);
            setPaymentInstructions(instructions);
            setAllUsers(users);
            setAdminAccessCode(code);
            setNewsArticles(articles);
        } catch (err) {
            toast({
                title: t.adminPage.errorTitle,
                description: "Failed to load admin settings from server.",
                variant: "destructive",
            });
        } finally {
            setIsUsersLoading(false);
            setIsNewsLoading(false);
        }
    }
    fetchAdminData();
  }, [toast, t]);


  const bookingsWithDates = useMemo(() => {
    return allBookings.map(b => ({
      ...b,
      date: b.date instanceof Timestamp ? b.date.toDate() : b.date
    }));
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    if (!filterDate) return [];
    
    let interval;
    switch (filterType) {
      case 'day':
        interval = { start: startOfDay(filterDate), end: endOfDay(filterDate) };
        break;
      case 'week':
        interval = { start: startOfDay(filterDate), end: endOfDay(addDays(filterDate, 6)) };
        break;
      case 'month':
        interval = { start: startOfMonth(filterDate), end: endOfMonth(filterDate) };
        break;
    }

    return bookingsWithDates
      .filter(booking => booking.date && isWithinInterval(booking.date, interval) && booking.status !== 'cancelled')
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0) || a.time.localeCompare(b.time));
  }, [bookingsWithDates, filterDate, filterType]);

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
    setBookingData(JSON.stringify(allBookings, null, 2));
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
      } else if (result === 'slot-taken') {
        toast({
          title: t.toasts.slotUnavailableTitle,
          description: "This slot is now taken by another confirmed booking.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t.adminPage.errorTitle,
        description: err instanceof Error ? err.message : "Failed to confirm booking.",
        variant: "destructive"
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
        const result = await createConfirmedBooking({
            name: manualBookingName,
            phone: manualBookingPhone,
            date: newManualBooking.date,
            time: newManualBooking.time,
            duration: manualBookingDuration,
            price: getDefaultPrice(newManualBooking.time) * manualBookingDuration,
        });

        if (result === 'slot-taken') {
            toast({
              title: t.toasts.slotUnavailableTitle,
              description: t.toasts.slotUnavailableDesc,
              variant: "destructive",
            });
            return;
        }

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
  
  const handlePermissionChange = async (uid: string, key: 'isTrusted' | 'isAdmin', value: boolean) => {
      // Optimistically update UI
      setAllUsers(prevUsers => prevUsers.map(u => u.uid === uid ? { ...u, [key]: value } : u));
      try {
          await updateUserTrustedStatus(uid, { [key]: value });
          
          let toastTitle = '';
          let toastDesc = '';
          
          if(key === 'isTrusted'){
             toastTitle = value ? t.adminPage.trustedCustomerAddedToastTitle : t.adminPage.trustedCustomerRemovedToastTitle;
             toastDesc = value ? t.adminPage.trustedCustomerAddedToastDesc : t.adminPage.trustedCustomerRemovedToastDesc;
          } else {
             toastTitle = value ? t.adminPage.adminAddedToastTitle : t.adminPage.adminRemovedToastTitle;
             toastDesc = value ? t.adminPage.adminAddedToastDesc : t.adminPage.adminRemovedToastDesc;
          }

          toast({ title: toastTitle, description: toastDesc });
      } catch (err) {
          // Revert UI on error
          setAllUsers(prevUsers => prevUsers.map(u => u.uid === uid ? { ...u, [key]: !value } : u));
          const message = err instanceof Error ? err.message : `Failed to update user's ${key} status.`;
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
  
    const handleAddBackground = () => {
        const newFileInput = document.createElement('input');
        newFileInput.type = 'file';
        newFileInput.accept = 'image/*';
        newFileInput.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if(file){
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const dataUrl = e.target?.result as string;
                    try {
                        const { url, path } = await uploadFile(dataUrl, 'public/backgrounds');
                        await updateBackground(backgrounds.length, { url, path, hint: 'new image' });
                         toast({
                            title: "Background Added",
                            description: "New background image has been added.",
                        });
                    } catch(err){
                         toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
                    }
                }
                reader.readAsDataURL(file);
            }
        };
        newFileInput.click();
    };

    const handleDeleteBackground = async (index: number, path: string | undefined) => {
        if (!path) {
            toast({ title: "Error", description: "Image path not found, cannot delete.", variant: "destructive" });
            return;
        }
        try {
            await deleteFile(path);
            await deleteBackground(index);
            toast({ title: "Background Deleted", description: "Background image has been removed.", variant: 'destructive' });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete background.", variant: "destructive" });
        }
    };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
              const dataUrl = e.target?.result as string;
              try {
                // If a background already exists, delete the old one from storage
                const oldPath = backgrounds[index]?.path;
                if (oldPath) {
                   await deleteFile(oldPath);
                }

                const { url, path } = await uploadFile(dataUrl, 'public/backgrounds');
                const newHint = hintInputs[index] || '';
                await updateBackground(index, { url, path, hint: newHint });
                toast({
                    title: t.adminPage.backgroundUpdatedToastTitle,
                    description: t.adminPage.backgroundUpdatedToastDesc,
                });
              } catch (err) {
                toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
              }
          };
          reader.readAsDataURL(file);
      }
      // Reset file input to allow re-uploading the same file
      if (event.target) {
        event.target.value = '';
      }
  };
  
    const handleLogoReplaceClick = () => {
        logoFileInputRef.current?.click();
    };

    const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                try {
                    // If a logo already exists, delete the old one from storage
                    if (logo.path) {
                       await deleteFile(logo.path);
                    }
                    const { url, path } = await uploadFile(dataUrl, 'public/logo');
                    await updateLogo(url, path);
                    toast({
                        title: t.adminPage.logoUpdatedToastTitle,
                        description: t.adminPage.logoUpdatedToastDesc,
                    });
                } catch (err) {
                    toast({ title: "Upload Error", description: "Failed to upload logo.", variant: "destructive" });
                }
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleWelcomePageImageChange = async (
      event: React.ChangeEvent<HTMLInputElement>,
      imageType: 'fieldImageUrl' | 'coachImageUrl' | 'managerImageUrl'
    ) => {
      const file = event.target.files?.[0];
      if (file && welcomePageContent) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          try {
              const oldPath = welcomePageContent[`${imageType}Path`];
              if (oldPath) {
                  await deleteFile(oldPath);
              }

              const { url, path } = await uploadFile(dataUrl, 'public/welcome');
              
              const updateData: Partial<WelcomePageContent> = {
                  [imageType]: url,
                  [`${imageType}Path`]: path,
              };
              
              await updateWelcomeContentAction(updateData);
              
              setWelcomePageContent(prev => prev ? { ...prev, ...updateData } : null);
              
              toast({
                  title: t.adminPage.welcomePageContentUpdatedTitle,
                  description: t.adminPage.welcomePageImageUpdatedDesc,
              });
          } catch(err) {
              const errorMessage = err instanceof Error ? err.message : "Failed to upload image";
              toast({ title: "Upload Error", description: errorMessage, variant: "destructive" });
          }
        };
        reader.readAsDataURL(file);
      }
      if(event.target){
        event.target.value = '';
      }
    };
    
    const handleAddGalleryImage = () => {
        galleryImageInputRef.current?.click();
    };

    const handleGalleryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                try {
                    const { url, path } = await uploadFile(dataUrl, 'public/gallery');
                    const newImages = [...galleryImages, { url, path }];
                    await updateGalleryImages(newImages);
                    setGalleryImages(newImages);
                    toast({ title: "Gallery Image Added" });
                } catch (err) {
                    toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
                }
            };
            reader.readAsDataURL(file);
        }
        if(event.target){
            event.target.value = '';
        }
    };

    const handleDeleteGalleryImage = async (imageToDelete: GalleryImage) => {
        if (!imageToDelete.path) {
            toast({ title: "Error", description: "Image path not found, cannot delete from storage.", variant: "destructive" });
            return;
        }
        try {
            await deleteFile(imageToDelete.path);
            const newImages = galleryImages.filter(img => img.path !== imageToDelete.path);
            await updateGalleryImages(newImages);
            setGalleryImages(newImages);
            toast({ title: "Gallery Image Deleted", variant: "destructive" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete gallery image.", variant: "destructive" });
        }
    };
    
    const handleAddSponsorImage = () => {
        sponsorImageInputRef.current?.click();
    };

    const handleSponsorFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && welcomePageContent) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                try {
                    const { url, path } = await uploadFile(dataUrl, 'public/sponsors');
                    const newSponsors = [...(welcomePageContent.sponsors || []), { url, path }];
                    await updateWelcomeContentAction({ sponsors: newSponsors });
                    setWelcomePageContent(prev => prev ? { ...prev, sponsors: newSponsors } : null);
                    toast({ title: "Sponsor Image Added" });
                } catch (err) {
                    toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
                }
            };
            reader.readAsDataURL(file);
        }
        if(event.target){
            event.target.value = '';
        }
    };

    const handleDeleteSponsorImage = async (sponsorToDelete: SponsorImage) => {
        if (!sponsorToDelete.path) {
            toast({ title: "Error", description: "Image path not found, cannot delete from storage.", variant: "destructive" });
            return;
        }
        if (!welcomePageContent) return;
        try {
            await deleteFile(sponsorToDelete.path);
            const newSponsors = (welcomePageContent.sponsors || []).filter(img => img.path !== sponsorToDelete.path);
            await updateWelcomeContentAction({ sponsors: newSponsors });
            setWelcomePageContent(prev => prev ? { ...prev, sponsors: newSponsors } : null);
            toast({ title: "Sponsor Image Deleted", variant: "destructive" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete sponsor image.", variant: "destructive" });
        }
    };

    const handleRegistrationStatusUpdate = async (registration: AcademyRegistration, status: 'accepted' | 'rejected' | 'archived') => {
        try {
            await updateRegistrationStatus(registration.id, status);
            const statusText = status === 'accepted' ? t.academyPage.statusAccepted : status === 'rejected' ? t.academyPage.statusRejected : t.adminPage.statusArchived;
            toast({
                title: t.toasts.registrationUpdateTitle,
                description: t.toasts.registrationUpdateDesc
                    .replace('{name}', registration.talentName)
                    .replace('{status}', statusText),
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
    
    const handleChangeAdminCode = async () => {
        if (newAdminCode.trim().length > 0) {
            await updateAdminCodeAction(newAdminCode.trim());
            setAdminAccessCode(newAdminCode.trim());
            toast({
                title: t.adminPage.securityCodeUpdatedTitle,
                description: t.adminPage.securityCodeUpdatedDesc,
            });
            setNewAdminCode("");
        } else {
             toast({
                title: t.adminPage.errorTitle,
                description: t.adminPage.securityCodeEmpty,
                variant: "destructive",
            });
        }
    };
    
    const handleExportBookings = async () => {
        try {
            const csvString = await exportBookings(
                exportStartDate && exportEndDate
                ? { from: startOfDay(exportStartDate), to: endOfDay(exportEndDate) }
                : undefined
            );
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "bookings_export.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            toast({ title: t.adminPage.errorTitle, description: "Failed to export bookings.", variant: "destructive" });
        }
    };

    const handleExportRegistrations = async () => {
        try {
            const csvString = await exportAcademyRegistrations();
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "academy_registrations.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            toast({ title: t.adminPage.errorTitle, description: "Failed to export registrations.", variant: "destructive" });
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
      case 'archived':
        return <Badge variant="outline">{t.adminPage.statusArchived}</Badge>;
      default:
        return null;
    }
  };
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const isSlotBooked = (date: Date, time: string, duration: number, bookings: {date: Date, time: string, duration: number, status: string}[]): boolean => {
    const newBookingStartMinutes = timeToMinutes(time);
    const newBookingEndMinutes = newBookingStartMinutes + duration * 60;

    for (const booking of bookings) {
      if (booking.status !== 'confirmed' && booking.status !== 'blocked') continue;
      
      if (booking.date?.toDateString() === date.toDateString()) {
        const existingBookingStartMinutes = timeToMinutes(booking.time);
        const existingBookingEndMinutes = existingBookingStartMinutes + booking.duration * 60;
        
        if (Math.max(newBookingStartMinutes, existingBookingStartMinutes) < Math.min(newBookingEndMinutes, existingBookingEndMinutes)) {
          return true;
        }
      }
    }
    return false;
  };
  
  const handleOpenNewsDialog = (article: NewsArticle | null) => {
    setEditingArticle(article);
    setIsNewsDialogOpen(true);
  };
  
  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteNewsArticle(id);
      setNewsArticles(prev => prev.filter(a => a.id !== id));
      toast({ title: t.adminPage.newsManagement.articleDeleted, variant: 'destructive' });
    } catch (err) {
      toast({ title: t.adminPage.errorTitle, description: err instanceof Error ? err.message : "Failed to delete article", variant: "destructive" });
    }
  };


  return (
    <div className="container py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-2">
          <Settings className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            {t.header.admin}
          </h1>
        </div>
      </div>

       <Tabs defaultValue="booking" className="max-w-6xl mx-auto grid md:grid-cols-[200px_1fr] gap-6 items-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="flex flex-col h-auto justify-start w-full">
          <TabsTrigger value="booking" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t.adminPage.bookingManagementCardTitle}
          </TabsTrigger>
           <TabsTrigger value="news" className="w-full justify-start gap-2">
            <Newspaper className="h-4 w-4" />
            {t.adminPage.newsTab}
          </TabsTrigger>
          <TabsTrigger value="academy" className="w-full justify-start gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t.adminPage.academyRegistrationsTitle}
          </TabsTrigger>
           <TabsTrigger value="users" className="w-full justify-start gap-2">
            <Users className="h-4 w-4" />
            {t.adminPage.usersTab}
          </TabsTrigger>
           <TabsTrigger value="settings" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            {t.adminPage.settingsTab}
          </TabsTrigger>
           <TabsTrigger value="exports" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" />
            {t.adminPage.exportsTab}
          </TabsTrigger>
          <TabsTrigger value="assistant" className="w-full justify-start gap-2">
            <Sparkles className="h-4 w-4" />
            {t.adminPage.title}
          </TabsTrigger>
        </TabsList>
        <div className="w-full">
            <TabsContent value="booking" className="grid grid-cols-1 gap-8 mt-0">
                {/* Booking Management Card */}
                <Card className="bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{t.adminPage.bookingManagementCardTitle}</CardTitle>
                    <CardDescription>{t.adminPage.bookingManagementCardDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 mb-6 p-4 border rounded-lg bg-background/50">
                        <div className="flex-1 space-y-2">
                           <Label>{t.adminPage.filterByDate}</Label>
                           <div className="flex gap-2">
                               <Calendar
                                  mode="single"
                                  selected={filterDate}
                                  onSelect={setFilterDate}
                                  className="rounded-md border w-auto"
                                  locale={lang === 'ar' ? arSA : undefined}
                                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                  weekStartsOn={6}
                                />
                                <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mt-2">
                                  <TabsList className="flex-col h-auto">
                                    <TabsTrigger value="day">{t.adminPage.day}</TabsTrigger>
                                    <TabsTrigger value="week">{t.adminPage.week}</TabsTrigger>
                                    <TabsTrigger value="month">{t.adminPage.month}</TabsTrigger>
                                  </TabsList>
                                </Tabs>
                           </div>
                        </div>
                    </div>
                    
                     {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                      <Table dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.bookingHistoryTable.date}</TableHead>
                            <TableHead>{t.bookingHistoryTable.time}</TableHead>
                            <TableHead>{t.adminPage.customer}</TableHead>
                            <TableHead>{t.adminPage.duration}</TableHead>
                            <TableHead>{t.adminPage.price}</TableHead>
                            <TableHead>{t.adminPage.status}</TableHead>
                            <TableHead className="text-right min-w-[200px]">{t.adminPage.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => {
                               const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
                               return (
                              <TableRow key={booking.id}>
                                <TableCell>{bookingDate ? format(bookingDate, 'PP', { locale: lang === 'ar' ? arSA : undefined }) : 'N/A'}</TableCell>
                                <TableCell>{booking.time}</TableCell>
                                <TableCell>
                                  {booking.name}
                                  <br/>
                                  {booking.phone && (
                                    <a href={`tel:${booking.phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1" dir="ltr">
                                        <Phone className="w-3 h-3" />
                                        {booking.phone}
                                    </a>
                                  )}
                                </TableCell>
                                <TableCell>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</TableCell>
                                <TableCell>{booking.price ? `${booking.price.toLocaleString()} YR` : '-'}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end flex-wrap">
                                     {(booking.status === 'pending' || booking.status === 'awaiting-confirmation') && (
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
                                        <Button size="sm" variant={'destructive'} onClick={() => handleCancelBooking(booking)}>{t.adminPage.cancel}</Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                               )
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-24">{t.adminPage.noBookingsInView}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="grid md:hidden gap-4">
                       {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => {
                                const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
                                return (
                                <Card key={booking.id} className="bg-background/50">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{booking.name}</CardTitle>
                                                 {booking.phone && (
                                                    <a href={`tel:${booking.phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1" dir="ltr">
                                                        <Phone className="w-3 h-3" />
                                                        {booking.phone}
                                                    </a>
                                                  )}
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.bookingHistoryTable.date}</span>
                                            <span>{bookingDate ? format(bookingDate, 'PP', { locale: lang === 'ar' ? arSA : undefined }) : 'N/A'}</span>
                                        </div>
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.bookingHistoryTable.time}</span>
                                            <span>{booking.time}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.adminPage.duration}</span>
                                            <span>{t.bookingHistoryTable.durationValue.replace('{duration}', booking.duration.toString())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.adminPage.price}</span>
                                            <span>{booking.price ? `${booking.price.toLocaleString()} YR` : '-'}</span>
                                        </div>
                                        <div className="pt-3 border-t">
                                             <div className="flex gap-2 justify-end flex-wrap">
                                                 {(booking.status === 'pending' || booking.status === 'awaiting-confirmation') && (
                                                    <>
                                                        <Button size="sm" variant="default" onClick={() => handleAdminConfirmBooking(booking)} className="flex-1">{t.adminPage.confirmButton}</Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleSetPriceClick(booking)}>{t.adminPage.edit}</Button>
                                                    </>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <>
                                                      <Button size="sm" variant="outline" onClick={() => handleSetPriceClick(booking)}>{t.adminPage.edit}</Button>
                                                      <Button size="sm" variant="outline" onClick={() => handleMakeRecurring(booking)} className="flex-1">
                                                          <Repeat className="mr-2 h-4 w-4" />
                                                          {t.adminPage.makeRecurringButton}
                                                      </Button>
                                                    </>
                                                )}
                                                {(booking.status !== 'cancelled' && booking.status !== 'blocked') && (
                                                    <Button size="sm" variant={'destructive'} onClick={() => handleCancelBooking(booking)}>{t.adminPage.cancel}</Button>
                                                )}
                                              </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                )
                            })
                       ) : (
                         <div className="text-center text-muted-foreground py-12">{t.adminPage.noBookingsInView}</div>
                       )}
                    </div>
        
                  </CardContent>
                </Card>

                {/* Manage Availability Card */}
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>{t.adminPage.manageAvailabilityCardTitle}</CardTitle>
                        <CardDescription>{t.adminPage.manageAvailabilityCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                                    disabled={(date) => isClient && date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                                        if (!isClient) {
                                            return (
                                                <div key={time} className="relative">
                                                     <Button variant="outline" className="w-full" disabled>
                                                        {time}
                                                    </Button>
                                                </div>
                                            );
                                        }
                                        const slotDateTime = new Date(availabilityDate);
                                        const [hours, minutes] = time.split(':').map(Number);
                                        slotDateTime.setHours(hours, minutes, 0, 0);
        
                                        const occupyingBooking = bookingsWithDates.find(b => {
                                          if (b.status === 'cancelled') return false;
                                          const bDate = b.date instanceof Timestamp ? b.date.toDate() : b.date;
                                          if (!bDate || bDate.toDateString() !== slotDateTime.toDateString()) return false;
                                          
                                          const bookingStartMinutes = timeToMinutes(b.time);
                                          const bookingEndMinutes = bookingStartMinutes + b.duration * 60;
                                          const slotStartMinutes = timeToMinutes(time);
        
                                          return slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes;
                                        });
        
                                        const isPast = new Date() > slotDateTime;
                                        const isBookedForManual = isSlotBooked(availabilityDate, time, availabilityDuration, bookingsWithDates);
                                        
                                        let buttonVariant: "default" | "secondary" | "destructive" | "outline" | "ghost" = "outline";
                                        let buttonClassName = "w-full";
                                        let badgeContent = null;
                                        let isDisabled = isPast || (isBookedForManual && !occupyingBooking);
        
                                        if (occupyingBooking) {
                                            isDisabled = false; // It should be clickable to show info or unblock
                                            switch (occupyingBooking.status) {
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
                                                    if (occupyingBooking) {
                                                        if (occupyingBooking.status === 'blocked') {
                                                            await unblockSlot(occupyingBooking.id!);
                                                            toast({ title: "Slot Unblocked", description: `The slot at ${time} has been made available.` });
                                                        } else {
                                                            setInfoBooking(occupyingBooking);
                                                        }
                                                    } else {
                                                        setManualBookingDuration(availabilityDuration);
                                                        setNewManualBooking({date: availabilityDate, time, duration: availabilityDuration});
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
            </TabsContent>
            <TabsContent value="news" className="grid grid-cols-1 gap-8 mt-0">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>{t.adminPage.newsManagement.title}</CardTitle>
                                <CardDescription>{t.adminPage.newsManagement.description}</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenNewsDialog(null)}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                {t.adminPage.newsManagement.createNew}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isNewsLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : newsArticles.length > 0 ? (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newsArticles.map(article => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <Image 
                                                        src={article.imageUrl || 'https://placehold.co/100x75.png'} 
                                                        alt={lang === 'ar' ? article.titleAR : article.titleEN}
                                                        width={100}
                                                        height={75}
                                                        className="w-24 h-auto object-cover rounded-md"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{lang === 'ar' ? article.titleAR : article.titleEN}</TableCell>
                                                <TableCell>{format(article.createdAt.toDate(), 'PPP', { locale: lang === 'ar' ? arSA : undefined })}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenNewsDialog(article)}>{t.adminPage.edit}</Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteArticle(article.id)}>{t.adminPage.cancel}</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                           <div className="text-center py-12 text-muted-foreground">{t.adminPage.newsManagement.noArticles}</div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="academy" className="grid grid-cols-1 gap-8 mt-0">
                {/* Academy Registrations Card */}
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.academyRegistrationsTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.academyRegistrationsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.adminPage.talentName}</TableHead>
                                        <TableHead>{t.adminPage.age}</TableHead>
                                        <TableHead>{t.adminPage.ageGroup}</TableHead>
                                        <TableHead>{t.adminPage.parentContact}</TableHead>
                                        <TableHead>{t.adminPage.accessCode}</TableHead>
                                        <TableHead>{t.adminPage.status}</TableHead>
                                        <TableHead className="text-right min-w-[150px]">{t.adminPage.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.filter(r => r.status === 'pending' || r.status === 'accepted').length > 0 ? (
                                        registrations.filter(r => r.status === 'pending' || r.status === 'accepted').map((reg) => {
                                          const birthDate = reg.birthDate instanceof Timestamp ? reg.birthDate.toDate() : reg.birthDate;
                                          return (
                                            <TableRow key={reg.id}>
                                                <TableCell>{reg.talentName}</TableCell>
                                                <TableCell>{isClient && birthDate ? differenceInYears(new Date(), birthDate) : '-'}</TableCell>
                                                <TableCell>{reg.ageGroup}</TableCell>
                                                <TableCell>
                                                    {reg.parentName}
                                                    <br/>
                                                    {reg.phone && (
                                                        <a href={`tel:${reg.phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1" dir="ltr">
                                                            <Phone className="w-3 h-3" />
                                                            {reg.phone}
                                                        </a>
                                                    )}
                                                </TableCell>
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
                                                    {reg.status === 'accepted' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleRegistrationStatusUpdate(reg, 'archived')}>
                                                            <Archive className="mr-2 h-4 w-4" />
                                                            {t.adminPage.archiveButton}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                          )
                                        })
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
                {/* Archived Members Card */}
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Archive className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.archivedRegistrationsTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.archivedRegistrationsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.adminPage.talentName}</TableHead>
                                        <TableHead>{t.adminPage.parentContact}</TableHead>
                                        <TableHead>{t.adminPage.accessCode}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.filter(r => r.status === 'archived').length > 0 ? (
                                        registrations.filter(r => r.status === 'archived').map((reg) => (
                                            <TableRow key={reg.id}>
                                                <TableCell>{reg.talentName}</TableCell>
                                                <TableCell>{reg.parentName} ({reg.phone})</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 font-mono text-sm">
                                                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                                                        <span>{reg.accessCode}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">{t.adminPage.noArchivedRegistrations}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                {/* Add Member Form Card */}
                <AddMemberForm />
            </TabsContent>
            <TabsContent value="users" className="grid grid-cols-1 gap-8 mt-0">
                 <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.userManagementTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.userManagementDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isUsersLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t.adminPage.customer}</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-center">{t.adminPage.trustedStatusLabel}</TableHead>
                                            <TableHead className="text-center">{t.adminPage.adminStatusLabel}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allUsers.map(user => (
                                            <TableRow key={user.uid}>
                                                <TableCell>{user.displayName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={user.isTrusted || false}
                                                        onCheckedChange={(isChecked) => handlePermissionChange(user.uid, 'isTrusted', isChecked)}
                                                        aria-label={`Toggle trusted status for ${user.displayName}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={user.isAdmin || false}
                                                        onCheckedChange={(isChecked) => handlePermissionChange(user.uid, 'isAdmin', isChecked)}
                                                        aria-label={`Toggle admin status for ${user.displayName}`}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="settings" className="grid grid-cols-1 gap-8 mt-0">
                 <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Presentation className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.manageWelcomePageCardTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.manageWelcomePageCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isContentLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                                <div className="space-y-4">
                                    <Label>{t.adminPage.welcomePageFieldImageLabel}</Label>
                                    {welcomePageContent?.fieldImageUrl && (
                                        <Image
                                            src={welcomePageContent.fieldImageUrl}
                                            alt="Football Field"
                                            width={200}
                                            height={150}
                                            className="w-full h-auto object-cover rounded-md aspect-video border"
                                            data-ai-hint="football field"
                                        />
                                    )}
                                    <Button onClick={() => welcomePageFieldImageInputRef.current?.click()} className="w-full">
                                        {t.adminPage.replaceImageButton}
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={welcomePageFieldImageInputRef}
                                        onChange={(e) => handleWelcomePageImageChange(e, 'fieldImageUrl')}
                                        className="hidden"
                                    />
                                </div>
                                 <div className="space-y-4">
                                    <Label>{t.adminPage.welcomePageCoachImageLabel}</Label>
                                    {welcomePageContent?.coachImageUrl && (
                                        <Image
                                            src={welcomePageContent.coachImageUrl}
                                            alt="Academy Coach"
                                            width={200}
                                            height={150}
                                            className="w-full h-auto object-cover rounded-md aspect-video border"
                                            data-ai-hint="football coach"
                                        />
                                    )}
                                    <Button onClick={() => welcomePageCoachImageInputRef.current?.click()} className="w-full">
                                        {t.adminPage.replaceImageButton}
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={welcomePageCoachImageInputRef}
                                        onChange={(e) => handleWelcomePageImageChange(e, 'coachImageUrl')}
                                        className="hidden"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label>{t.adminPage.welcomePageManagerImageLabel}</Label>
                                    {welcomePageContent?.managerImageUrl && (
                                        <Image
                                            src={welcomePageContent.managerImageUrl}
                                            alt="Club Manager"
                                            width={200}
                                            height={150}
                                            className="w-full h-auto object-cover rounded-md aspect-video border"
                                            data-ai-hint="portrait man"
                                        />
                                    )}
                                    <Button onClick={() => welcomePageManagerImageInputRef.current?.click()} className="w-full">
                                        {t.adminPage.replaceImageButton}
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={welcomePageManagerImageInputRef}
                                        onChange={(e) => handleWelcomePageImageChange(e, 'managerImageUrl')}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-primary" />
                                <CardTitle>{t.welcomePage.galleryTitle}</CardTitle>
                            </div>
                            <Button onClick={handleAddGalleryImage}>{t.adminPage.addCustomerButton}</Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={galleryImageInputRef}
                                onChange={handleGalleryFileChange}
                                className="hidden"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {isContentLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            galleryImages?.map((image, index) => (
                                image.url && (
                                    <div key={index} className="relative group">
                                        <Image
                                            src={image.url}
                                            alt={`Gallery image ${index + 1}`}
                                            width={200}
                                            height={150}
                                            className="w-full h-auto object-cover rounded-md aspect-video"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteGalleryImage(image)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            ))
                        )}
                    </CardContent>
                </Card>
                 <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building className="w-6 h-6 text-primary" />
                                <CardTitle>{t.welcomePage.sponsorsTitle}</CardTitle>
                            </div>
                            <Button onClick={handleAddSponsorImage}>{t.adminPage.addCustomerButton}</Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={sponsorImageInputRef}
                                onChange={handleSponsorFileChange}
                                className="hidden"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {isContentLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            welcomePageContent?.sponsors?.map((image, index) => (
                                image.url && (
                                    <div key={index} className="relative group">
                                        <Image
                                            src={image.url}
                                            alt={`Sponsor image ${index + 1}`}
                                            width={150}
                                            height={80}
                                            className="w-full h-auto object-contain rounded-md aspect-[3/2] bg-white p-2"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteSponsorImage(image)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            ))
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ImageUp className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.manageLogoCardTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.manageLogoCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                         {isLogoLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            logo.url && (
                                <Image
                                    src={convertGsToHttps(logo.url)}
                                    alt="Current Logo"
                                    width={80}
                                    height={88}
                                    className="h-20 w-auto object-contain rounded-md"
                                />
                            )
                        )}
                        <div className="flex-1 w-full">
                             <Button onClick={handleLogoReplaceClick} className="w-full sm:w-auto">
                                {t.adminPage.replaceLogoButton}
                            </Button>
                            <input
                                type="file"
                                accept="image/*,image/gif"
                                ref={logoFileInputRef}
                                onChange={handleLogoFileChange}
                                className="hidden"
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ImageUp className="w-6 h-6 text-primary" />
                                    <CardTitle>{t.adminPage.manageBackgroundsCardTitle}</CardTitle>
                                </div>
                                <CardDescription>{t.adminPage.manageBackgroundsCardDescription}</CardDescription>
                            </div>
                            <Button onClick={handleAddBackground}>{t.adminPage.addCustomerButton}</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(isBackgroundsLoading || !backgrounds) ? <Loader2 className="h-8 w-8 animate-spin" /> : backgrounds.map((bg, index) => (
                            bg.url && (
                                <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg bg-background/50">
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
                                    <div className="w-full sm:w-auto flex flex-col gap-2">
                                        <Button onClick={() => handleReplaceClick(index)} className="w-full">
                                            {t.adminPage.replaceImageButton}
                                        </Button>
                                         <Button onClick={() => handleDeleteBackground(index, bg.path)} className="w-full" variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            {t.adminPage.cancel}
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
                            )
                        ))}
                    </CardContent>
                </Card>
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
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.securitySettingsCardTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.securitySettingsCardDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="current-admin-code">{t.adminPage.securityCurrentCodeLabel}</Label>
                            <Input
                                id="current-admin-code"
                                value={adminAccessCode || ''}
                                readOnly
                                className="font-mono mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="new-admin-code">{t.adminPage.securityNewCodeLabel}</Label>
                             <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                <Input
                                    id="new-admin-code"
                                    value={newAdminCode}
                                    onChange={(e) => setNewAdminCode(e.target.value)}
                                    placeholder={t.adminPage.securityNewCodePlaceholder}
                                />
                                <Button onClick={handleChangeAdminCode} className="w-full sm:w-auto">
                                    {t.adminPage.securityChangeCodeButton}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="exports" className="grid grid-cols-1 gap-8 mt-0">
                 <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Download className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.exportBookingsTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.exportBookingsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label>{t.adminPage.exportByDateRange}</Label>
                         <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <Calendar
                              mode="single"
                              selected={exportStartDate}
                              onSelect={setExportStartDate}
                              className="rounded-md border w-full sm:w-auto"
                              placeholder={t.adminPage.exportStartDate}
                            />
                            <Calendar
                              mode="single"
                              selected={exportEndDate}
                              onSelect={setExportEndDate}
                              className="rounded-md border w-full sm:w-auto"
                              placeholder={t.adminPage.exportEndDate}
                            />
                            <Button onClick={handleExportBookings} className="w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4"/>
                                {t.adminPage.exportButton}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BookUser className="w-6 h-6 text-primary" />
                            <CardTitle>{t.adminPage.exportRegistrationsTitle}</CardTitle>
                        </div>
                        <CardDescription>{t.adminPage.exportRegistrationsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button onClick={handleExportRegistrations} variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           {t.adminPage.exportButton}
                       </Button>
                    </CardContent>
                </Card>
             </TabsContent>
            <TabsContent value="assistant" className="grid grid-cols-1 gap-8 mt-0">
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
            </TabsContent>
        </div>
      </Tabs>

      <AlertDialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminPage.confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {editingBooking && `${editingBooking.name} - ${format(editingBooking.date instanceof Date ? editingBooking.date : (editingBooking.date as Timestamp).toDate(), 'PPP', { locale: lang === 'ar' ? arSA : undefined })} @ ${editingBooking.time} (${t.bookingHistoryTable.durationValue.replace('{duration}', editingBooking.duration.toString())})`}
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
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminPage.manualBookingTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {newManualBooking && t.adminPage.manualBookingDescription.replace('{date}', format(newManualBooking.date, 'PPP', { locale: lang === 'ar' ? arSA : undefined })).replace('{time}', newManualBooking.time)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-name" className={cn("text-right", lang === 'ar' && "text-left")}>{t.bookingForm.nameLabel}</Label>
                  <Input id="manual-name" value={manualBookingName} onChange={(e) => setManualBookingName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-phone" className={cn("text-right", lang === 'ar' && "text-left")}>{t.bookingForm.phoneLabel}</Label>
                  <Input id="manual-phone" value={manualBookingPhone} onChange={(e) => setManualBookingPhone(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manual-duration" className={cn("text-right", lang === 'ar' && "text-left")}>{t.bookingHistoryTable.duration}</Label>
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
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.adminPage.bookingDetailsTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t.adminPage.bookingDetailsDescription.replace('{time}', infoBooking?.time || '')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className={cn("text-right", lang === 'ar' && "text-left")}>{t.adminPage.bookingDetailsName}</Label>
                    <span className="font-semibold">{(infoBooking?.name === 'Blocked Slot' && lang === 'ar') ? t.adminPage.blocked : infoBooking?.name}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className={cn("text-right", lang === 'ar' && "text-left")}>{t.adminPage.bookingDetailsPhone}</Label>
                    {infoBooking?.phone ? (
                         <a href={`tel:${infoBooking.phone}`} className="font-semibold text-primary hover:underline" dir="ltr">{infoBooking.phone}</a>
                    ) : (
                        <span className="font-semibold" dir="ltr">N/A</span>
                    )}
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setInfoBooking(null)}>{t.actions.ok}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!recurringBooking} onOpenChange={() => setRecurringBooking(null)}>
          <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t.adminPage.recurringBookingTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {recurringBooking && 
                        t.adminPage.recurringBookingDesc
                            .replace('{name}', recurringBooking.name || '')
                            .replace('{time}', recurringBooking.time)
                            .replace('{day}', format(recurringBooking.date instanceof Date ? recurringBooking.date : (recurringBooking.date as Timestamp).toDate(), 'EEEE', { locale: lang === 'ar' ? arSA : undefined }))
                    }
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmRecurring}>{t.adminPage.confirmButton}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <NewsArticleDialog 
        isOpen={isNewsDialogOpen}
        setIsOpen={setIsNewsDialogOpen}
        article={editingArticle}
        onSave={(newArticle) => {
          if (editingArticle) {
            setNewsArticles(prev => prev.map(a => a.id === newArticle.id ? newArticle as NewsArticle : a));
          } else {
            setNewsArticles(prev => [newArticle as NewsArticle, ...prev]);
          }
        }}
      />

    </div>
  );
}


// News Article Dialog Component
function NewsArticleDialog({ isOpen, setIsOpen, article, onSave }: { isOpen: boolean, setIsOpen: (open: boolean) => void, article: NewsArticle | null, onSave: (article: NewsArticle | Partial<NewsArticle>) => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(article?.imageUrl || null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const newsFormSchema = z.object({
    titleEN: z.string().min(1, t.adminPage.newsManagement.validation.titleEN),
    titleAR: z.string().min(1, t.adminPage.newsManagement.validation.titleAR),
    summaryEN: z.string().min(1, t.adminPage.newsManagement.validation.summaryEN),
    summaryAR: z.string().min(1, t.adminPage.newsManagement.validation.summaryAR),
  });

  const form = useForm<z.infer<typeof newsFormSchema>>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      titleEN: '',
      titleAR: '',
      summaryEN: '',
      summaryAR: '',
    }
  });
  
  useEffect(() => {
    if (article) {
      form.reset({
        titleEN: article.titleEN,
        titleAR: article.titleAR,
        summaryEN: article.summaryEN,
        summaryAR: article.summaryAR,
      });
      setImagePreview(article.imageUrl || null);
    } else {
      form.reset({ titleEN: '', titleAR: '', summaryEN: '', summaryAR: '' });
      setImagePreview(null);
    }
    setNewImageFile(null);
  }, [article, isOpen, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: z.infer<typeof newsFormSchema>) => {
    setIsSaving(true);
    try {
      let imageUrl = article?.imageUrl || undefined;
      let imagePath = article?.imagePath || undefined;

      if (newImageFile) {
        if (article?.imagePath) {
          await deleteFile(article.imagePath);
        }
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(newImageFile);
        });
        const uploaded = await uploadFile(dataUrl, 'public/news');
        imageUrl = uploaded.url;
        imagePath = uploaded.path;
      }
      
      const payload = { ...data, imageUrl, imagePath };

      if (article) {
        await updateNewsArticle(article.id, payload);
        onSave({ ...article, ...payload });
        toast({ title: t.adminPage.newsManagement.articleUpdated });
      } else {
        const newDoc = await createNewsArticle(payload);
        // This is a bit of a workaround to get the full object back without another fetch
        const createdArticle = { ...payload, id: newDoc.id, createdAt: Timestamp.now() };
        onSave(createdArticle as any);
        toast({ title: t.adminPage.newsManagement.articleCreated });
      }
      setIsOpen(false);
    } catch (err) {
      toast({ title: t.adminPage.errorTitle, description: err instanceof Error ? err.message : "Failed to save article", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{article ? t.adminPage.newsManagement.editArticle : t.adminPage.newsManagement.createNew}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="titleEN" render={({ field }) => (
              <FormItem>
                <FormLabel>{t.adminPage.newsManagement.titleEN}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="titleAR" render={({ field }) => (
              <FormItem>
                <FormLabel>{t.adminPage.newsManagement.titleAR}</FormLabel>
                <FormControl><Input {...field} dir="rtl"/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="summaryEN" render={({ field }) => (
              <FormItem>
                <FormLabel>{t.adminPage.newsManagement.summaryEN}</FormLabel>
                <FormControl><Textarea {...field} rows={4}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="summaryAR" render={({ field }) => (
              <FormItem>
                <FormLabel>{t.adminPage.newsManagement.summaryAR}</FormLabel>
                <FormControl><Textarea {...field} dir="rtl" rows={4} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div>
              <Label>{t.adminPage.newsManagement.image}</Label>
              <Card className="mt-2">
                <CardContent className="p-2">
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" width={100} height={75} className="object-cover rounded-md aspect-video" />
                    ) : <div className="w-[100px] h-[75px] bg-muted rounded-md flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground"/></div>}
                    <div className="flex-1 space-y-2">
                       <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                         <ImageUp className="mr-2 h-4 w-4" />
                         {imagePreview ? t.adminPage.replaceImageButton : t.adminPage.addCustomerButton + " " + t.adminPage.newsManagement.image}
                       </Button>
                       <p className="text-xs text-muted-foreground">{t.adminPage.newsManagement.imageDesc}</p>
                       <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">{t.adminPage.cancel}</Button></DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {article ? t.adminPage.newsManagement.update : t.adminPage.newsManagement.publish}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
