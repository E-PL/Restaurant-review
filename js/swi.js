"use strict";
/**
 * Register the service worker at page load
 */
document.addEventListener("DOMContentLoaded", event => {
  registerServiceWorker();
});
/**
 * Service worker registration
 */
let registerServiceWorker = () => {
  // Register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/"
      })
      // Wait for service worker to be ready
      .then(() => {
        return navigator.serviceWorker.ready;
      })
      // Install event listener for new review form submission
      .then(reg => {
        // Install the event listener on the restaurant details pages only
        if (document.getElementById("submit-review")) {
          document
            .getElementById("dummy-click")
            .addEventListener("click", e => {
              reg.sync.register("send-review");
            });
        }
      })
      .catch(function(serviceWorkerError) {
        console.log("Service Worker registration ERROR");
      });
  } else {
    console.log("Service worker is not supported by this browser");
  }
};
