let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];

/**
 * At page load, initialize app
 */
document.addEventListener("DOMContentLoaded", event => {
  initApp();
});

/**
 * App initialization
 */
initApp = () => {
  // check if the indexedDb already contains restaurants data
  DBHelper.checkDBStatus((error, keys) => {
    // if there is no data in indexedDb, fetch data from API
    if (error) {
      DBHelper.fetchRestaurants((error, data) => {
        // print fetch errors to the console
        if (error) {
          console.log(error);
        }
        // save fetched data to indexedDB
        if (data) {
          DBHelper.saveRestaurants(data, (error, idbOK) => {
            // print indexedDB data to the console
            if (error) {
              console.log(error);
            }
            // wait for indexedDb to be ready, then initialize map and populate page html with indexedDB data
            if (idbOK) {
              localforage.ready().then(() => {
                initMap(); // added
                fetchNeighborhoods();
                fetchCuisines();
              });
            }
          });
        }
      });
    }
    // if data is already in indexedDB, initialize the map and populate page with indexedDB data
    if (keys) {
      initMap(); // added
      fetchNeighborhoods();
      fetchCuisines();
    }
  });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");
  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
    {
      mapboxToken:
        "pk.eyJ1IjoiZS1wbCIsImEiOiJjaml6cWUyM2owOXJ0M3ZxZDh0YmQ1ZXF3In0.qSl2KCzS-rv27slYMB6PcA",
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox.streets"
    }
  ).addTo(newMap);
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      }
      // check for no results
      if (restaurants.length === 0) {
        resetRestaurants(restaurants);
        tellMeNoResults();
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

// display a message and a reset button if there are no results
tellMeNoResults = () => {
  const ul = document.getElementById("restaurants-list");
  const li = document.createElement("li");
  li.id = "error";
  const title = document.createElement("h2");
  title.innerHTML = "No results";
  const p = document.createElement("p");
  p.innerHTML =
    "The selected neighborhood and cuisine filter options gave no results, try again or learn to cook! ^^";
  p.classList.add("padded");
  const a = document.createElement("a");
  a.innerHTML = "Reset filters";
  a.setAttribute("aria-label", "No results, reset and return to filters");
  a.addEventListener("click", function() {
    resetFilters();
  });
  a.addEventListener("keydown", function(e) {
    if (e.keycode == 13 || e.key == "Enter") {
      resetFilters();
    }
  });
  a.href = "#neighborhoods-select";
  li.append(title);
  li.append(p);
  li.append(a);
  ul.append(li);
};

resetFilters = () => {
  document.getElementById("neighborhoods-select").selectedIndex = 0;
  document.getElementById("cuisines-select").selectedIndex = 0;
  // resetRestaurants();
  updateRestaurants();
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const image = document.createElement("img");
  image.className = "restaurant-img";
  const dbUrl = DBHelper.imageUrlForRestaurant(restaurant);
  const newUrl = dbUrl + "_400.jpg";
  image.src = newUrl;
  // add alt to images
  image.alt = "A picture of " + restaurant.name;
  li.append(image);
  const name = document.createElement("h3");
  name.innerHTML = restaurant.name;
  li.append(name);
  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);
  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  // TODO: consider if it's better to use a button tag here
  // It would seem more semantic, as it looks like a button
  // On the other side it act like a link, so I'm keeping it like that for now
  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("aria-label", restaurant.name + " details page");
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
