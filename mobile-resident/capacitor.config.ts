import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.visitorpasses.resident',
  appName: 'VisitorPasses Resident',
  webDir: 'www',
  // This app is a thin native shell around the live site -- it always loads
  // the real, currently-deployed web app rather than bundling a copy of it.
  // That means ordinary web app updates (new features, bug fixes) show up
  // immediately for everyone with the app installed, with no app-store-style
  // update needed. The .apk only needs rebuilding if the native shell itself
  // changes (icon, permissions, app name).
  server: {
    url: 'https://visitorpasses.in/login?role=resident',
    cleartext: false,
  },
};

export default config;
