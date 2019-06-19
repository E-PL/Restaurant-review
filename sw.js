// Service worker

"use strict";
importScripts("/js/dbhelper.js");
importScripts("/js/localforage.js");
// Cache name
var restaurantCache = "restaurant-review";

// Resources to be cached before service worker activation
var criticalUrls = [
  "/",
  "css/styles.css",
  "js/swi.js",
  "js/dbhelper.js",
  "js/main.js",
  "js/restaurant_info.js",
  "img/1_400.jpg",
  "img/2_400.jpg",
  "img/3_400.jpg",
  "img/4_400.jpg",
  "img/5_400.jpg",
  "img/6_400.jpg",
  "img/7_400.jpg",
  "img/8_400.jpg",
  "img/9_400.jpg",
  "img/10_400.jpg",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png"
];

// Resources to be cached later
var notCriticalUrls = [
  "/restaurant.html?id=1",
  "/restaurant.html?id=2",
  "/restaurant.html?id=3",
  "/restaurant.html?id=4",
  "/restaurant.html?id=5",
  "/restaurant.html?id=6",
  "/restaurant.html?id=7",
  "/restaurant.html?id=8",
  "/restaurant.html?id=9",
  "/restaurant.html?id=10",
  "img/1.jpg",
  "img/2.jpg",
  "img/3.jpg",
  "img/4.jpg",
  "img/5.jpg",
  "img/6.jpg",
  "img/7.jpg",
  "img/8.jpg",
  "img/9.jpg",
  "img/10.jpg"
];

// Add resources to the cache
// url accept a url and data a response object
let updateCache = (url, data) => {
  caches.open(restaurantCache).then(function(cache) {
    cache.put(url, data);
  });
};

// At install time preload resources in cache
self.addEventListener("install", e => {
  e.waitUntil(
    caches
      .open(restaurantCache)
      .then(function(cache) {
        cache.addAll(notCriticalUrls);
        // as this returns, the service worker is installed
        return cache.addAll(criticalUrls);
      })
      .catch(function(cacheError) {
        console.log("Precaching ERROR");
      })
  );
});

// Catch requests
self.addEventListener("fetch", e => {
  e.respondWith(
    // First look in cache
    caches
      .match(e.request)
      .then(function(response, reject) {
        // If url is cached serve that
        if (response) return response;
        else reject();
      })
      .catch(function(response, reject) {
        // Otherwise fetch the url on the network
        response = fetch(e.request);
        // It it can be retrieved on the network
        if (response) return response;
        else reject();
      })
      .then(function(response) {
        // Cache it for future use
        let dollyResponse = response.clone();
        updateCache(e.request.url, dollyResponse);
        // And serve it
        return response;
      })
      .catch(function(noNet, reject) {
        // If it cannot be downloaded, print an error message on the console
        console.log(
          "Can't retrieve " + e.request.url + " from the network, OFFLINE?"
        );
      })
  );
});

// I'm using Background Sync as advised in the Introducing Background Sync blog post by Jake Archibald
// Event handler
self.onsync = e => {
  if (e.tag == "send-review") {
    e.waitUntil(saveReviews());
  }
};

// The service worker will wait to saveReviews to resolve
function saveReviews() {
  // Create a promise
  let savingStatus = new Promise((resolve, reject) => {
    // Call DBHelper method and wait for a status on callback
    DBHelper.updateReviewsOnServer((error, success) => {
      // If an error is passed to callback, reject promise
      if (error) {
        reject();
      }
      // If the DBHelper method calls callback with a success code, promise is fullfilled
      if (success) {
        resolve();
      }
    });
    // Handle errors
  }).catch(error => {
    console.error(error);
    // If errors are catched, return the promise
    return savingStatus;
  });
}
