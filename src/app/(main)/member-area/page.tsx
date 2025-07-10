
"use client";

import { useState } from "react";
import { useAcademy } from "@/context/academy-context";
import { useLanguage } from "@/context/language-context";
import type { AcademyRegistration } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Camera, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

function MemberSpace({ member }: { member: AcademyRegistration }) {
  const { t } = useLanguage();
  const { addPost, getPosts } = useAcademy();
  const { toast } = useToast();
  const [story, setStory] = useState("");
  const fileInputRef = useState<React.RefObject<HTMLInputElement>>(
    () => React.createRef()
  );

  const posts = getPosts(member.id);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        addPost(member.id, { photoUrl, story });
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
    fileInputRef[0].current?.click();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline text-primary">
          {t.memberArea.welcome.replace("{name}", member.talentName)}
        </h2>
        <p className="text-muted-foreground">{t.memberArea.welcomeDesc}</p>
      </div>

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
            ref={fileInputRef[0]}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button onClick={handleAddPost} className="w-full sm:w-auto">
            {t.memberArea.addPostButton}
          </Button>
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
              <Card key={post.id} className="overflow-hidden bg-card/80 backdrop-blur-sm">
                <Image
                  src={post.photoUrl}
                  alt={post.story || "Member photo"}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4">
                  <p className="text-muted-foreground">{post.story}</p>
                </CardContent>
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
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState("");
  const [member, setMember] = useState<AcademyRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
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

  if (member) {
    return (
        <div className="container py-8">
            <MemberSpace member={member} />
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
                <CardDescription>{t.memberArea.description}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <Input
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder={t.memberArea.accessCodePlaceholder}
                        className="text-center tracking-widest font-mono text-lg h-12"
                    />
                    <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                         {isLoading ? t.adminPage.analyzingButton : t.memberArea.enterButton}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
