import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "./components/footer";
import "./globals.css";
import Navbar from "./components/navbar";
import ModalProvider from "@/providers/modal-provider";
import ToastProvider from "@/providers/toast-provider";
import { ClerkProvider } from "@clerk/nextjs";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Store",
  description: "Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <NextTopLoader
           color="#3b82f6"
           height={2}
           showSpinner={false}
           shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
          />
          <ModalProvider />
          <ToastProvider />
          <Navbar />
          <div className="pt-16">
            {children}
          </div>
          <Footer/>
        </body>
      </html>
    </ClerkProvider>
    
  );
}
