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
   * Fetch all restaurants reviews
   */

  static fetchReviews(callback) {
    // fetch reviews from API
    fetch("http://localhost:1337/reviews?limit=-1")
      .then(response => {
        let responseCopy = response;
        let data = responseCopy.json();
        return data;
      })
      // pass reviews to callback if received from API
      .then(data => {
        callback(null, data);
      })
      // if there is an error log it to the console and pass it to callback
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
      this.restaurantsDB
        .ready()
        // save array in indexedDB
        .then(() => {
          // for each element in the array
          data.forEach(restaurant => {
            // use restaurant name as index and save it's data on the indexedDB
            this.restaurantsDB
              .setItem(restaurant.name, restaurant)
              // print errors to console
              .catch(error => {
                console.log(error);
              });
          });
          // when all data is saved pass indexedDB status to callback
          callback(null, this.restaurantsDB.driver());
        })
        // if any error occurs, print it to console and pass it to callback
        .catch(error => {
          console.log(error);
          callback(error, null);
        });
    }
  }

  /**
   * Save API reviews data to indexedDB using localforage
   */
  static saveReviews(data, callback) {
    // if there's data to be saved
    if (data) {
      // when indexedDB is ready
      this.reviewsDB
        .ready()
        // save array in indexedDB
        .then(() => {
          // for each element in the array
          data.forEach(review => {
            // use restaurant name as index and save it's data on the indexedDB
            this.reviewsDB
              .setItem(review.id.toString(), review)
              // print errors to console
              .catch(error => {
                console.log(error);
              });
          });
          // when all data is saved pass indexedDB status to callback
          callback(null, this.reviewsDB.driver());
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
    //TODO: useful?
    if (this.restaurantsDB) {
      localforage
        .dropInstance({
          name: "Restaurants",
          storeName: "RestaurantInfoStore"
        })
        .then(() => {});
    }
    if (!this.restaurantsDB) {
      this.restaurantsDB = localforage.createInstance({
        driver: localforage.INDEXEDDB,
        name: "Restaurants",
        storeName: "RestaurantInfoStore"
      });
    }
    if (!this.reviewsDB) {
      this.reviewsDB = localforage.createInstance({
        driver: localforage.INDEXEDDB,
        name: "Restaurants",
        storeName: "ReviewsStore"
      });
    }
  }

  /**
   *
   * check for restaurants IDB status
   */
  static checkRestaurantsDBStatus(callback) {
    // check Localforage instance for the number of keys
    this.restaurantsDB
      .length()
      .then(numberOfKeys => {
        // if there are keys
        if (numberOfKeys > 0) {
          // pass the number of keys to callback
          callback(null, numberOfKeys);
        }
        // if there are no keys
        else {
          // pass a string as error to callback
          callback("no data", null);
        }
      })
      //if any error is catched
      .catch(function(error) {
        // print error to console
        console.log(error);
        // and pass the error to callback
        callback(error, null);
      });
  }

  /**
   *
   * check for reviews IDB status
   */
  static checkReviewsDBStatus(callback) {
    this.reviewsDB
      .length()
      .then(numberOfKeys => {
        if (numberOfKeys > 0) {
          callback(null, numberOfKeys);
        } else {
          // pass a string as error to callback
          callback("no data", null);
        }
      })
      //if any error is catched
      .catch(function(error) {
        // print error to console
        console.log(error);
        // pass the error to callback
        callback(error, null);
      });
  }

  /**
   * Read indexedDB restaurants data
   */
  static readRestaurants(callback) {
    // create an empty array
    let restaurants = [];
    // append all indexedDB keys to the array
    this.restaurantsDB
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
   * Read indexedDB reviews data
   */
  static readReviews(callback) {
    // create an empty array
    let reviews = [];
    // append all indexedDB keys to the array
    this.reviewsDB
      .iterate(review => {
        reviews.push(review);
      })
      .then(function() {
        // pass the reviews array to callback
        callback(null, reviews);
      })
      .catch(function(error) {
        // in case of error, print them to console and pass it to callback
        console.log(error);
        callback(error, null);
      });
  }

  /**
   * Find reviews by restaurant ID.
   */
  static findReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.

    DBHelper.readReviews((error, reviews) => {
      if (error) {
        console.log("error reading");
        callback(error, null);
      } else {
        const result = reviews.filter(review => {
          return review.restaurant_id == id;
        });

        if (result) {
          // there are reviews
          callback(null, result);
        } else {
          // no reviews
          callback("no reviews", null);
        }
      }
    });
  }

  /**
   * Fetch restaurant favorite status by its ID
   * TODO: useful?
   */
  static fetchRestaurantIsStarredByID(id, callback) {
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=true`)
      .then(response => {
        if (response) {
          const responseCopy = response;
          const data = responseCopy.json();
          return data;
        }
      })
      .then(data => {
        if (data.is_favorite == false) {
          callback(null, false);
        }
        if (data.is_favorite == true) {
          callback(null, true);
        }
      })
      .catch(error => {
        console.log(error);
        callback(error, null);
      });
  }
  // TODO: no use?
  static fetchAllFavoriteRestaurants(callback) {
    fetch("http://localhost:1337/restaurants/?is_favorite=true")
      .then(response => {
        if (response) {
          const responseCopy = response;
          const data = response.json();
          callback(null, data);
        } else {
          console.log("no response");
          callback(null, null);
        }
      })
      .catch(error => {
        console.log(error);
        callback(error, null);
      });
  }

  static saveFavoriteRestaurantToIDB(restaurantName, callback) {
    // find the restaurant by name in IDB

    this.restaurantsDB.ready().then(() => {
      this.restaurantsDB
        .getItem(restaurantName, (error, restaurant) => {
          let theRestaurant = restaurant;
          theRestaurant.is_favorite = !theRestaurant.is_favorite;

          this.restaurantsDB.setItem(restaurantName, theRestaurant);
          return theRestaurant;
        })
        .then(restaurant => {
          callback(null, restaurant);
        })
        .catch(error => {
          callback(error, null);
        });
      // TODO: check callback, I'm rushing and I'm not sure.
    });
  }

  static saveFavoriteRestaurantToAPI(restaurant, callback) {
    // headers
    const headers = new Headers();
    const initFetch = {
      method: "PUT",
      headers: headers,
      mode: "cors",
      cache: "default"
    };
    const requestUrl = `http://localhost:1337/restaurants/${
      restaurant.id
    }/?is_favorite=${restaurant.is_favorite}`;
    const request = new Request(requestUrl, initFetch);
    fetch(request)
      .then(response => {
        let responseCopy = response;
        return responseCopy.json();
      })
      .then(response => {
        if (response.statusText === "OK") {
          callback(null, response.statusText);
        } else {
          callback(response.statusText);
        }
      })
      .catch(error => {
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
    } else {
      return "/img/placeholder";
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

  /*
  * Save new reviews to API server
  */
  static saveReviewToAPI = (review, callback) => {
    // set headers
    const headers = new Headers();
    // POST body contents
    let params = {
      restaurant_id: review.restaurant_id,
      name: review.name,
      rating: review.rating,
      comments: review.comments
    };
    // prepare fetch request
    const init = {
      method: "POST",
      headers,
      mode: "cors",
      cache: "default",
      body: JSON.stringify(params)
    };
    // send review to API server
    fetch("http://localhost:1337/reviews/", init)
    // pass errors to callback  
    .catch((error) => {
        callback(error, null);
      })
  };
}
