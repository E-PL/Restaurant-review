/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Fetch all restaurants from API server
   */
  static fetchRestaurants(callback) {
    // fetch data from API
    fetch("http://localhost:1337/restaurants")
      //parse response
      .then(response => {
        let dollyResponse = response;
        let data = dollyResponse.json();
        return data;
      })
      // pass parsed data to callback
      .then(data => {
        callback(null, data);
      })
      // log errors to console
      .catch(error => {
        console.log(error);
        callback(error, null);
      });
  }

  /**
   * Save API data to indexedDB using localforage
   */
  static saveRestaurants(data, callback) {
    // if there's data to be saved
    if (data) {
      // when indexedDB is ready
      localforage
        .ready()
        // save array in indexedDB
        .then(() => {
          // for each element in the array
          data.forEach(restaurant => {
            // use restaurant name as index and save it's data on the indexedDB
            localforage
              .setItem(restaurant.name, restaurant)
              // print errors to console
              .catch(error => {
                console.log(error);
              });
          });
          // when all data is saved pass indexedDB status to callback
          callback(null, localforage.driver());
        })
        // if any error occurs, print it to console and pass it to callback
        .catch(error => {
          console.log(error);
          callback(error, null);
        });
    }
  }

  /**
   * Initalize indexedDB
   */
  static initIdb() {
    localforage.config({
      driver: localforage.INDEXEDDB,
      name: "Restaurants",
      storeName: "RestaurantStore"
    });
  }

  /**
   * Check for indexedDB status, is it the first visit?
   */
  static checkDBStatus(callback) {
    // Gets the number of keys in the indexedDB
    localforage
      .length()
      .then(numberOfKeys => {
        // if there are keys in indexedeDB, it's not the first visit, pass the number of keys to callback
        if (numberOfKeys > 0) {
          callback(null, numberOfKeys);
        }
        // if there are no keys in the indexedDB, initialize it
        else {
          DBHelper.initIdb();
          // pass a string as error to callback
          callback("no data", null);
        }
      })
      //if any error is catched
      .catch(function(error) {
        // print error to console
        console.log(error);
        // init indexedDB
        DBHelper.initIdb();
        // pass the error to callback
        callback(error, null);
      });
  }

  /**
   * Read indexedDB data
   */
  static readRestaurants(callback) {
    // create an empty array
    let restaurants = [];
    // append all indexedDB keys to the array
    localforage
      .iterate(restaurant => {
        restaurants.push(restaurant);
      })
      .then(function() {
        // pass the restaurants array to callback
        callback(null, restaurants);
      })
      .catch(function(error) {
        // in case of error, print them to console and pass it to callback
        console.log(error);
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.readRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // it looks like the new API server is lacking one picture, falling back to a placeholder
    if (restaurant.photograph) {
    return `/img/${restaurant.photograph}`;
    }
    else {
      return '/img/placeholder';
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name + "map marker",
        // make the screen reader read the restaurant name and address of the map marker
        // TODO: think about if it's not too much
        alt: restaurant.name + " " + restaurant.address,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
}
