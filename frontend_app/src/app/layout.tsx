import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MUN AI Assistant - Your Intelligent Debate Partner',
  description: 'An ultra-fast, MUN-centric AI assistant with real-time streaming responses, multi-agent coordination, and specialized MUN workflow support.',
  keywords: ['MUN', 'Model United Nations', 'AI Assistant', 'Debate', 'Diplomacy', 'UN'],
  authors: [{ name: 'MUN AI Assistant Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e40af' },
    { media: '(prefers-color-scheme: dark)', color: '#3b82f6' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'MUN AI Assistant',
    description: 'Your intelligent Model United Nations debate partner',
    type: 'website',
    url: 'https://mun-assistant.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MUN AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MUN AI Assistant',
    description: 'Your intelligent Model United Nations debate partner',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for potential external resources */}
        <link rel="dns-prefetch" href="//api.mun-assistant.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Performance optimization */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Fallback for JavaScript */}
        <noscript>
          <style>
            {{`
              .no-js-fallback {
                display: block !important;
              }
              .js-only {
                display: none !important;
              }
            `}}
          </style>
        </noscript>
      </head>
      <body className={inter.className}>
        {/* Loading fallback for no JavaScript */}
        <noscript>
          <div className="no-js-fallback fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                JavaScript Required
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                MUN AI Assistant requires JavaScript to function properly. Please enable JavaScript in your browser settings and refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-un-blue text-white px-6 py-2 rounded-lg hover:bg-un-blue-dark transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </noscript>

        {/* Main application */}
        <div id="root" className="min-h-screen">
          {children}
        </div>

        {/* Error boundary fallback */}
        <div
          id="error-boundary-fallback"
          className="hidden fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-un-blue text-white px-6 py-2 rounded-lg hover:bg-un-blue-dark transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  // Clear localStorage and reload
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        </div>

        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if ('performance' in window && 'measure' in performance) {
                window.addEventListener('load', () => {
                  // Measure page load performance
                  setTimeout(() => {
                    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                    const loadTime = navigation.loadEventEnd - navigation.navigationStart;

                    // Log performance metrics (in development, you'd send this to analytics)
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Page load time:', loadTime + 'ms');
                    }
                  }, 0);
                });
              }

              // Error monitoring
              window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                // In production, you'd send this to an error reporting service
              });

              window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                // In production, you'd send this to an error reporting service
              });
            `,
          }}
        />
      </body>
    </html>
  );
}