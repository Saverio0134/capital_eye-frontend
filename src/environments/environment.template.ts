// ## Setup

// 1. Copia `environment.template.ts`
// 2. Rinomina in:
//    - `environment.development.ts`
// 3. Inserisci le tue chiavi Firebase
// 4. Avvia il progetto


export const environment = {
  production: false,
  useMocks: false,
  skipAuth: false,
  apiUrl: '',
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
};
