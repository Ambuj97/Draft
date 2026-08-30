// Dynamic Expo config. All static config lives in app.json; this layer injects
// the Google Maps API key from the environment so it never lands in git.
//
// Local dev:  put GOOGLE_MAPS_API_KEY=... in a .env file (gitignored)
// EAS Build:  eas env:create --name GOOGLE_MAPS_API_KEY --value ... --visibility secret
//
// The key is restricted by iOS bundle id / Android package + SHA-1 in the
// Google Cloud console, so shipping it inside the binary is expected.

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

  return {
    ...config,
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config ?? {}),
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: { apiKey: googleMapsApiKey },
      },
    },
  };
};
