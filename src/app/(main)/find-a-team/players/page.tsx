
"use client";

import { useFindATeam } from "@/context/find-a-team-context";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserMinus, Phone, ShieldCheck, Loader2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { TeamRegistration } from "@/lib/types";

export default function PlayersListPage() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { registrations, isLoading: isListLoading, isRegistered, deleteRegistration } = useFindATeam();
  const router = useRouter();
  const { toast } = useToast();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      // If a user lands here but isn't registered, send them to the registration form.
      if (isRegistered === false) { // Check for explicit false, as initial state might be null/undefined
        router.push('/find-a-team');
      }
    }
  }, [isRegistered, user, isAuthLoading, router]);


  const handleLeaveList = async () => {
    if (!user) return;
    const myRegistration = registrations.find(r => r.userId === user.uid);
    if (myRegistration) {
      await deleteRegistration(myRegistration.id);
      toast({
        title: t.findATeamPage.leaveListSuccess,
        variant: "destructive"
      });
      // After leaving, redirect back to the registration form.
      router.push('/find-a-team');
    }
  };

  const getPositionText = (position: TeamRegistration['position']) => {
    const positionMap = {
        Goalkeeper: t.findATeamPage.positionGoalkeeper,
        Defender: t.findATeamPage.positionDefender,
        Midfielder: t.findATeamPage.positionMidfielder,
        Forward: t.findATeamPage.positionForward,
        Any: t.findATeamPage.positionAny
    };
    return positionMap[position] || position;
  }
  
  // Wait for both authentication and registration status to be resolved
  if (isAuthLoading || isRegistered === null || (isRegistered && isListLoading)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Users className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {t.findATeamPage.playerListTitle}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-white max-w-2xl mx-auto">
          {t.findATeamPage.playerListDesc}
        </p>
      </div>
        
      <Card className="mb-8 bg-card/80 backdrop-blur-sm border-accent">
          <CardHeader>
              <div className="flex flex-col items-center text-center gap-2">
                 <Handshake className="w-10 h-10 text-primary"/>
                 <CardTitle className="font-headline text-2xl">{t.findATeamPage.managementMessageTitle}</CardTitle>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-center text-muted-foreground">{t.findATeamPage.managementMessageDesc}</p>
          </CardContent>
      </Card>

       <div className="text-center mb-12">
           <Button variant="destructive" onClick={() => setShowConfirmDialog(true)}>
                <UserMinus className="mr-2 h-4 w-4"/>
                {t.findATeamPage.leaveListButton}
            </Button>
       </div>

      {isListLoading ? (
         <div className="flex justify-center items-center min-h-[30vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((player) => (
            <Card key={player.id} className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline">{player.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary"/>
                    <span>{getPositionText(player.position)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground"/>
                    <a href={`tel:${player.phone}`} className="text-primary hover:underline" dir="ltr">{player.phone}</a>
                </div>
                <div>
                    <h4 className="font-semibold text-sm">{t.findATeamPage.availabilityLabel}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{player.availability}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t.findATeamPage.noPlayers}</p>
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.findATeamPage.leaveListConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.findATeamPage.leaveListConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.adminPage.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveList} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.findATeamPage.leaveListButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
