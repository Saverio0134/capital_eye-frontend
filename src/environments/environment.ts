// Placeholder environment: commit-safe dummy values.
// In every build configuration this file is replaced via fileReplacements:
//   - development: -> environment.development.ts (locale, gitignored)
//   - demo:        -> environment.demo.ts (committato)
//   - production:  -> environment.production.ts (locale, gitignored)
// I valori qui sotto non vengono mai usati a runtime: servono solo per
// permettere a TypeScript di compilare i file che importano environment
// quando si esegue un build senza fileReplacements attivi.
export const environment = {
  production: false,
  useMocks: false,
  skipAuth: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'dummy',
    authDomain: 'https://dummy.firebaseapp.com',
    projectId: 'dummy',
    storageBucket: 'dummy.appspot.com',
    messagingSenderId: '000000000000',
    appId: '0:000000000000:web:0000000000000000000000',
    measurementId: 'G-dummy',
  },
};