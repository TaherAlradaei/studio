
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAcademy } from "@/context/academy-context";
import { useLanguage } from "@/context/language-context";
import type { AcademyRegistration, MemberPost } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, BookOpen, Trash2, Send, ImageUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { uploadFile, deleteFile } from "../admin/actions";
import { Timestamp, collection, getDocs, query, where, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";


function MemberSpace({ member, onLogout }: { member: AcademyRegistration, onLogout: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<MemberPost[]>(member.posts || []);
  const [story, setStory] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.isAdmin;

  const addPost = async (postData: Omit<MemberPost, 'id' | 'createdAt'>) => {
    const memberDocRef = doc(db, "academyRegistrations", member.id);
    const newPost: MemberPost = {
      ...postData,
      id: doc(collection(db, 'dummy')).id, // Generate a random ID
      createdAt: Timestamp.now(),
      comments: [],
    };
    await updateDoc(memberDocRef, {
      posts: arrayUnion(newPost)
    });
    setPosts(prev => [newPost, ...prev]);
  };
  
  const addComment = async (postId: string, commentData: Omit<MemberPost['comments'][0], 'createdAt'>) => {
      const memberDocRef = doc(db, "academyRegistrations", member.id);
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;

      const newComment = { ...commentData, createdAt: Timestamp.now() };
      const updatedPost = { ...posts[postIndex] };
      updatedPost.comments = [...(updatedPost.comments || []), newComment];
      
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = updatedPost;

      await updateDoc(memberDocRef, { posts: updatedPosts });
      setPosts(updatedPosts);
  };
  
  const removePost = async (postId: string) => {
      const memberDocRef = doc(db, "academyRegistrations", member.id);
      const postToDelete = posts.find(p => p.id === postId);
      if(postToDelete) {
          if(postToDelete.storagePath) {
              await deleteFile(postToDelete.storagePath);
          }
          await updateDoc(memberDocRef, {
              posts: arrayRemove(postToDelete)
          });
          setPosts(prev => prev.filter(p => p.id !== postId));
      }
  };


  const handlePostImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPostImage(file);
    }
  };

  const handleAddPost = async () => {
    if (!story.trim() && !postImage) {
        toast({ title: t.memberArea.postEmpty, variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
        return;
    }
    
    setIsSubmittingPost(true);

    try {
        let photoUrl = "";
        let storagePath = "";
        
        if (postImage) {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = e => resolve(e.target?.result as string);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(postImage);
            });
            const uploadedFile = await uploadFile(dataUrl, `public/posts/${member.id}`);
            photoUrl = uploadedFile.url;
            storagePath = uploadedFile.path;
        }

        await addPost({ 
            story, 
            author: member.talentName, 
            comments: [], 
            photoUrl, 
            storagePath 
        });
        
        setStory("");
        setPostImage(null);
        if(postImageInputRef.current) postImageInputRef.current.value = "";
        
        toast({ title: t.memberArea.postAddedSuccess });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add story.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSubmittingPost(false);
    }
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
        await removePost(postId);
        toast({ title: "Story Deleted", description: "The story has been successfully removed.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline text-primary">
          {t.memberArea.welcome.replace("{name}", member.talentName)}
        </h2>
        <p className="text-muted-foreground">{t.memberArea.welcomeDesc}</p>
        <Button onClick={onLogout} variant="link" className="mt-2 text-destructive">{t.memberArea.logout}</Button>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
        <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <CardTitle>{t.memberArea.addPostTitle}</CardTitle>
        </div>
        <CardDescription>{t.memberArea.addPostDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder={t.memberArea.storyPlaceholder}
            rows={4}
        />
        <div className="flex flex-col sm:flex-row gap-4 items-center">
             <Button onClick={() => postImageInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
                <ImageUp className="mr-2 h-4 w-4" />
                {postImage ? t.memberArea.changeImage : t.memberArea.addImage}
            </Button>
            <input
                type="file"
                accept="image/*"
                ref={postImageInputRef}
                onChange={handlePostImageSelect}
                className="hidden"
            />
            {postImage && <span className="text-sm text-muted-foreground truncate">{postImage.name}</span>}
            <Button onClick={handleAddPost} className="w-full sm:w-auto sm:ml-auto" disabled={isSubmittingPost}>
                {isSubmittingPost ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {t.adminPage.savingButton}</> : t.memberArea.addPostButton}
            </Button>
        </div>
        </CardContent>
    </Card>

      <div className="space-y-6">
         <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold font-headline">{t.memberArea.galleryTitle}</h3>
        </div>
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden bg-card/80 backdrop-blur-sm">
                {post.photoUrl && (
                    <div className="aspect-video relative">
                         <Image 
                            src={post.photoUrl} 
                            alt={`Story by ${post.author}`}
                            layout="fill"
                            objectFit="cover"
                         />
                    </div>
                )}
                <CardHeader className="flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{post.author.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-base font-semibold">{post.author}</CardTitle>
                    </div>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeletePost(post.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </CardHeader>
                {post.story && (
                  <CardContent className="p-4 pt-0 flex-grow">
                      <p className="text-muted-foreground whitespace-pre-wrap">{post.story}</p>
                  </CardContent>
                )}
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState("");
  const [member, setMember] = useState<AcademyRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);

    if (!user) {
        toast({ title: t.auth.notLoggedInTitle, description: t.auth.notLoggedInDesc, variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const q = query(collection(db, "academyRegistrations"), where("accessCode", "==", accessCode.trim().toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        toast({
            title: t.memberArea.invalidCodeTitle,
            description: t.memberArea.invalidCodeDesc,
            variant: "destructive",
        });
    } else {
        const validatedMember = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as AcademyRegistration;
        // For security, ensure the logged-in user is the one associated with the registration
        if (validatedMember.userId === user.uid || user.isAdmin) {
             setMember(validatedMember);
        } else {
             toast({
                title: t.memberArea.invalidCodeTitle,
                description: "This access code belongs to another user.",
                variant: "destructive",
            });
        }
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
                    <Button onClick={handleLogin} disabled={isLoading || !user || accessCode.length < 6} className="w-full">
                         {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {t.adminPage.analyzingButton}</> : t.memberArea.enterButton}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
