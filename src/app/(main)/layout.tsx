import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BookingProvider } from "@/context/booking-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </BookingProvider>
  );
}
