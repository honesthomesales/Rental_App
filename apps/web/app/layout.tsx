import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '../components/Header'
import { Toaster } from 'react-hot-toast'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Rental Management App',
  description: 'Comprehensive rental property management system',
  keywords: ['rental', 'property', 'management', 'real estate'],
  authors: [{ name: 'Honest Home Sales' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Rental Management App',
    description: 'Comprehensive rental property management system',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rental Management App',
    description: 'Comprehensive rental property management system',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Environment variables are set in next.config.js

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://gnisgfojzrrnidizrycj.supabase.co" />
        <link rel="preconnect" href="https://gnisgfojzrrnidizrycj.supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
} 