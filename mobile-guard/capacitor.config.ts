import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.visitorpasses.guard',
  appName: 'VisitorPasses Guard',
  webDir: 'www',
  // Thin native shell around the live site -- always loads the current
  // deployed web app, no bundled copy to keep in sync. Rebuilding the .apk
  // is only needed if the native shell itself changes (icon, permissions,
  // app name), not for ordinary web app updates.
  server: {
    url: 'https://visitorpasses.in/login/society?role=guard',
    cleartext: false,
  },
};

export default config;
