"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { BookingHistoryTable } from "@/components/booking/booking-history-table";
import { useLanguage } from "@/context/language-context";
import { Ticket } from "lucide-react";

export default function BookingsPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null; // or a loading spinner
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Ticket className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                {t.bookingsPage.title}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.bookingsPage.description}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <BookingHistoryTable />
      </div>
    </div>
  );
}
