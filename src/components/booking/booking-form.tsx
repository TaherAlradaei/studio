"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useBookings } from "@/context/booking-context";
import { useToast } from "@/hooks/use-toast";
import { Shirt } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().regex(/^\d{3}-\d{4}$/, "Phone number must be in XXX-XXXX format."),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
});

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  duration: number;
  onBookingComplete: () => void;
}

export function BookingForm({
  selectedDate,
  selectedTime,
  duration,
  onBookingComplete,
}: BookingFormProps) {
  const { addBooking } = useBookings();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      terms: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes);

    addBooking({
      name: values.name,
      phone: values.phone,
      date: bookingDate,
      time: selectedTime,
      duration,
    });
    
    toast({
      title: "Booking Confirmed!",
      description: `Your booking for ${selectedDate.toLocaleDateString()} at ${selectedTime} is confirmed.`,
      variant: "default",
      className: "bg-primary text-primary-foreground"
    });

    onBookingComplete();
  }

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Shirt className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Enter Your Details</CardTitle>
        </div>
        <CardDescription>
          Booking for {selectedDate.toLocaleDateString()} at {selectedTime} for {duration} hour(s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 555-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Accept terms and conditions
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Confirm Booking
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
