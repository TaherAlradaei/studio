
"use client";

import { useFindATeam } from "@/context/find-a-team-context";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserMinus, Phone, ShieldCheck } from "lucide-react";
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
  const { user } = useAuth();
  const { registrations, isRegistered, deleteRegistration } = useFindATeam();
  const router = useRouter();
  const { toast } = useToast();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    // If a user lands here but isn't registered, send them to the registration form.
    if (!isRegistered && user) {
      router.push('/find-a-team');
    }
  }, [isRegistered, user, router]);

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

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Users className="w-12 h-12 text-primary"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {t.findATeamPage.playerListTitle}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.findATeamPage.playerListDesc}
        </p>
      </div>

       <div className="text-center mb-12">
           <Button variant="destructive" onClick={() => setShowConfirmDialog(true)}>
                <UserMinus className="mr-2 h-4 w-4"/>
                {t.findATeamPage.leaveListButton}
            </Button>
       </div>

      {registrations.length > 0 ? (
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
