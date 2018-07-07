"use strict";
/**
 * Register the service worker at page load
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
});
/**
 * Service worker registration
 */
let registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { 
      scope: '/'
    }).catch(function(serviceWorkerError){
            console.log('Service Worker registration ERROR');
    });
  }
  else {
    console.log('Service worker is not supported by this browser');
  } 
}