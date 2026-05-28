import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.my.ternakos.app',   // Same as TWA — allows update of existing Play Store listing
  appName: 'TernakOS',
  webDir: 'dist',
  // NOTE: No server.hostname override. Keep default capacitor:// scheme for Phase 1 test.
  // If Supabase/OAuth has issues with capacitor:// origin, we will add:
  //   server: { androidScheme: 'https', hostname: 'ternakos.my.id' }
  // after confirming test results.
  android: {
    // Allow mixed content only if strictly needed (disabled by default = secure)
    allowMixedContent: false,
    // Enable WebView debugging during development. Disable before release build.
    webContentsDebuggingEnabled: false,
    // Capture keyboard input — needed for login forms
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      // Match app dark background: #06090F (converted to RGBA int)
      backgroundColor: '#06090F',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      launchAutoHide: true,
      launchShowDuration: 1500,
    },
    StatusBar: {
      // Dark overlays icon — white icons on dark background
      style: 'Dark',
      backgroundColor: '#06090F',
    },
    Browser: {
      // Use Custom Tab for OAuth + payment flows (Google OAuth, Midtrans)
    },
  },
};

export default config;
