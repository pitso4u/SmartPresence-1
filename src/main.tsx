import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Temporarily disable service worker to avoid errors
// const registerServiceWorker = async () => {
//   if ('serviceWorker' in navigator) {
//     try {
//       const registration = await navigator.serviceWorker.register('/service-worker.js');
//       console.log('ServiceWorker registration successful with scope: ', registration.scope);
//       
//       // Handle service worker updates
//       registration.addEventListener('updatefound', () => {
//         const newWorker = registration.installing;
//         if (newWorker) {
//           newWorker.addEventListener('statechange', () => {
//             if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//               // New content is available, show update notification
//               if (confirm('New version available! Reload to update?')) {
//                 window.location.reload();
//               }
//             }
//           });
//         }
//       });
//     } catch (error) {
//       console.error('ServiceWorker registration failed: ', error);
//     }
//   }
// };

// if ('serviceWorker' in navigator) {
//   registerServiceWorker();
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
