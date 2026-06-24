// Ambiente demo per deployment pubblico (es. Netlify).
// useMocks: attiva il mockHttpInterceptor che intercetta ogni chiamata verso apiUrl
//   e restituisce dati realistici da stato in memoria, senza backend reale.
// skipAuth: bypassa Firebase Auth in AuthStore: imposta un token demo fittizio e
//   un utente demo, sbloccando le guard e gli httpResource (gated sul token).
export const environment = {
  production: true,
  useMocks: true,
  skipAuth: true,
  apiUrl: '/api',
  firebase: {
    apiKey: 'demo',
    authDomain: 'https://demo.firebaseapp.com',
    projectId: 'demo',
    storageBucket: 'demo.appspot.com',
    messagingSenderId: '000000000000',
    appId: '0:000000000000:web:0000000000000000000000',
    measurementId: 'G-demo',
  },
};