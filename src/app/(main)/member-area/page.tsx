
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAcademy } from "@/context/academy-context";
import { useLanguage } from "@/context/language-context";
import type { AcademyRegistration, MemberPost } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Camera, BookOpen, Trash2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function MemberSpace({ member, onLogout }: { member: AcademyRegistration, onLogout: () => void }) {
  const { t } = useLanguage();
  const { addPost, getPosts, addComment, deletePost } = useAcademy();
  const { user } = useAuth();
  const { toast } = useToast();
  const [story, setStory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const allPosts = getPosts();
  const isAdmin = user?.isAdmin || false;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoUrl = e.target?.result as string;
        await addPost(member.id, { photoUrl, story, author: member.talentName, comments: [] });
        setStory("");
        toast({ title: t.memberArea.postAddedSuccess });
      };
      reader.readAsDataURL(file);
    }
     if(event.target) {
        event.target.value = '';
    }
  };

  const handleAddPost = () => {
    fileInputRef.current?.click();
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (commentText && user) {
      await addComment(postId, { author: user.displayName || 'Admin', text: commentText });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    if (isAdmin) {
        await deletePost(postId);
        toast({ title: "Post Deleted", description: "The post has been successfully removed.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline text-primary">
          {isAdmin ? t.header.title : t.memberArea.welcome.replace("{name}", member.talentName)}
        </h2>
        <p className="text-muted-foreground">{isAdmin ? t.adminPage.academyRegistrationsTitle : t.memberArea.welcomeDesc}</p>
        <Button onClick={onLogout} variant="link" className="mt-2 text-destructive">{t.memberArea.logout}</Button>
      </div>

      {!isAdmin && (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
            <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-primary" />
                <CardTitle>{t.memberArea.addPostTitle}</CardTitle>
            </div>
            <CardDescription>{t.memberArea.addPostDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <Input
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder={t.memberArea.storyPlaceholder}
            />
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <Button onClick={handleAddPost} className="w-full sm:w-auto">
                {t.memberArea.addPostButton}
            </Button>
            </CardContent>
        </Card>
      )}


      <div className="space-y-6">
         <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold font-headline">{t.memberArea.galleryTitle}</h3>
        </div>
        {allPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden bg-card/80 backdrop-blur-sm">
                <div className="relative">
                    <Image
                      src={post.photoUrl}
                      alt={post.story || "Member photo"}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    {isAdmin && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleDeletePost(post.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <CardContent className="p-4 flex-grow">
                    <p className="text-sm font-semibold">{post.author}</p>
                    <p className="text-muted-foreground">{post.story}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 p-4 border-t bg-background/20">
                    <div className="w-full space-y-2 max-h-32 overflow-y-auto">
                        {post.comments && post.comments.map((comment, index) => (
                             <div key={index} className="flex items-start gap-2 text-sm">
                                <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{comment.author.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/50 p-2 rounded-md">
                                    <p className="font-semibold text-xs">{comment.author}</p>
                                    <p className="text-muted-foreground">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                     {isAdmin && (
                        <div className="w-full flex items-center gap-2 pt-2 border-t">
                            <Input
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                placeholder={t.memberArea.addCommentPlaceholder}
                                className="h-9"
                            />
                            <Button size="icon" className="h-9 w-9" onClick={() => handleAddComment(post.id)}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t.memberArea.noPosts}</p>
        )}
      </div>
    </div>
  );
}


export default function MemberAreaPage() {
  const { t } = useLanguage();
  const { validateAccessCode } = useAcademy();
  const { user, checkAdminStatus } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [member, setMember] = useState<AcademyRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);

    const settingsDocRef = doc(db, 'settings', 'admin');
    const docSnap = await getDoc(settingsDocRef);
    const adminCode = docSnap.exists() ? docSnap.data().accessCode : 'almaidan';

    if (user && accessCode === adminCode) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {isAdmin: true}, {merge: true});
        await checkAdminStatus(); // Re-fetch user data to get admin status
        router.push('/admin');
        setIsLoading(false);
        return;
    }

    const validatedMember = validateAccessCode(accessCode);
    if (validatedMember) {
      setMember(validatedMember);
    } else {
      toast({
        title: t.memberArea.invalidCodeTitle,
        description: t.memberArea.invalidCodeDesc,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };
  
  const handleLogout = () => {
    setMember(null);
    setAccessCode("");
  };

  if (member) {
    return (
        <div className="container py-8">
            <MemberSpace member={member} onLogout={handleLogout} />
        </div>
    )
  }

  return (
    <div className="container py-16 flex justify-center items-center">
        <Card className="max-w-md w-full bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <KeyRound className="w-12 h-12 text-primary"/>
                </div>
                <CardTitle className="text-3xl font-bold font-headline text-primary">{t.memberArea.title}</CardTitle>
                <CardDescription>{!user ? t.auth.notLoggedInDesc : t.memberArea.description}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <Input
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder={t.memberArea.accessCodePlaceholder}
                        className="text-center tracking-widest font-mono text-lg h-12"
                    />
                    <Button onClick={handleLogin} disabled={isLoading || !user} className="w-full">
                         {isLoading ? t.adminPage.analyzingButton : t.memberArea.enterButton}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
