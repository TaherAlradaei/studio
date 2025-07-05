"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      } else {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
      }
      router.push("/");
    } catch (error: any) {
      const defaultMessage = activeTab === 'login' ? "Login Failed" : "Sign Up Failed";
      toast({
        title: t.auth.errorTitle,
        description: error.code ? t.auth.firebaseErrors[error.code] || error.message : defaultMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t.auth.login}</TabsTrigger>
        <TabsTrigger value="signup">{t.auth.signUp}</TabsTrigger>
      </TabsList>
      <TabsContent value="login" />
      <TabsContent value="signup" />

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.emailLabel}</Label>
          <Input id="email" type="email" {...form.register("email")} placeholder="name@example.com" />
          {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.passwordLabel}</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {activeTab === 'login' ? t.auth.login : t.auth.signUp}
        </Button>
      </form>
    </Tabs>
  );
}
