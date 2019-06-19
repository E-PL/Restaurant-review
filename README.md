# This project is part of the Udacity Mobile Web Specialist Nanodegree
---
#### _Course Material Project - Restaurant Reviews_

## Project Overview

In the first stage of the **Restaurant Reviews** project, I have incrementally converted a static webpage to a mobile-ready web application. I have taken a static design that lacks accessibility and converted the design to be responsive on different sized displays and accessible for screen reader use. I have also added a service worker to begin the process of creating a seamless offline experience for users.

For the second stage of the project, I've changed the data source from a local file to data fetched from an API server.

The fetched data is saved to indexedDB in order to be available for offline use.

I've added icons and a manifest to the app to make it pass the lighthouse PWA audits.

In the third stage of the project I've added a button to mark a restaurant as favorite in the restaurant details page, and I've added a form to allow users to add their own review to a restaurant.

User generated reviews are cached locally using indexedDB, they can be added while offline, and they are sent to the API server when connectivity is re-established.

### Specification

Udacity provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. The code is now updated to resolve these issues while still maintaining the included functionality.

The app read restaurants data from API and stores it in indexedDB for offline use and it's compliant to PWA guidelines.

### How to run the project

To run the project you'll ned to run the API server provided by Udacity first: [API Server](https://github.com/udacity/mws-restaurant-stage-3)

Then, clone this repo and serve it locally

## Leaflet.js, Mapbox and localForage:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/) for map rendering and [localForage](https://github.com/localForage/localForage) for IndexedDB handling 

## Credits

The project is part of the [Udacity](https://udacity.com/) [Mobile Web Specialist Nanodegree](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024), and the starting code was provided by Udacity on the following repo: [https://github.com/udacity/mws-restaurant-stage-1](https://github.com/udacity/mws-restaurant-stage-1)


