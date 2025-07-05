"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { getSchedulingRecommendations } from "./actions";
import { useBookings } from "@/context/booking-context";
import { useLanguage } from "@/context/language-context";

export default function AdminPage() {
  const { t } = useLanguage();
  const { bookings } = useBookings();
  const [bookingData, setBookingData] = useState(JSON.stringify(bookings, null, 2));
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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


  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-2">
          <Wand2 className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            {t.adminPage.title}
          </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.adminPage.description}
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.adminPage.dataCardTitle}</CardTitle>
            <CardDescription>
             {t.adminPage.dataCardDescription}
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
    </div>
  );
}
