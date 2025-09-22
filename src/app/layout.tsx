
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { usePathname } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleOneTap } from '@/components/layout/google-one-tap';
import Script from 'next/script';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

// Even with client-side rendering for layout choices, metadata can be defined
// export const metadata: Metadata = {
//   title: 'Symposium Central',
//   description: 'The central hub for managing your college symposium.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPortalPage = pathname.startsWith('/u/s/portal');
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Symposium Central</title>
        <meta name="description" content="The central hub for managing your college symposium." />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className={cn("font-body antialiased bg-background text-foreground", inter.variable, spaceGrotesk.variable)} suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <GoogleOneTap />
          <div className="flex flex-col min-h-screen">
            {!isPortalPage && <Header />}
            <main className="flex-1">{children}</main>
            {!isPortalPage && <Footer />}
          </div>
          <Toaster />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
