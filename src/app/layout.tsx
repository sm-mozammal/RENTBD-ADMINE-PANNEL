import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/context/query-provider';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'RentBD Admin Dashboard | Smart Renting & Verification',
  description: 'AI-Powered Admin Panel for Landlord NID Verification, Property Moderation, Spam Detection, and Demand vs Supply Heatmaps in Bangladesh.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
