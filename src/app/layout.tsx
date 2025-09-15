
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { usePathname } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleOneTap } from '@/components/layout/google-one-tap';


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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning={true}>
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
