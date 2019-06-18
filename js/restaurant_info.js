let restaurant;
var newMap;

/**
 * At page load, initialize app
 */
document.addEventListener("DOMContentLoaded", event => {
  DBHelper.initIdb();
  initApp();
});

/**
 * App initialization
 */
initApp = () => {
  // check if the indexedDb already contains restaurants data
  DBHelper.checkRestaurantsDBStatus((error, keys) => {
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
                initMap();
              });
            }
          });
        }
      });
    }
    // if data is already in indexedDB, initialize the map and populate page with indexedDB data
    if (keys) {
      initMap();
    }
  });

  DBHelper.checkReviewsDBStatus((error, keys) => {
    // if they are not, fetch them from API
    if (error) {
      console.log(error);
      console.log("fetching reviews");
      DBHelper.fetchReviews((error, data) => {
        if (error) {
          console.log(error);
        }
        // and save them to IDB
        if (data) {
          DBHelper.saveReviews(data, (error, idbOK) => {
            if (error) {
              console.log(error);
            }
          });
        }
      });
    }
    // if reviews are already cached, print a message to console
    // TODO: remove console.log and think about updating reviews cache instead
    if (keys) {
    }
  });
};

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 * TODO: refactor
 * starting everything after map load might be ok,
 * but here instead of getting the id everything is happening.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();

      DBHelper.findReviewsByRestaurantId(id, (error, reviews) => {
        if (error) {
          console.log(error);
        }
        if (reviews) {
          // fill reviews
          fillReviewsHTML(reviews);
        }
      });
      DBHelper.fetchRestaurantIsStarredByID(id, (error, isStarred) => {
        if (error) {
          isStarred = false;
          console.log(error);
        }

        if (isStarred != undefined) {
          if (isStarred == true) {
            lightTheStarUp();
          }
        }
      });

      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  // TODO: refactor -  function install event listeners
  // toggle favorite star
  let star = document.getElementById("star");
  if (restaurant.is_favorite === "true" || restaurant.is_favorite === true) {
    star.classList.toggle("lightened");
  }
  star.addEventListener("click", e => {
    toggleFavorite(restaurant.name);
  });

  // review form event listener

  let reviewForm = document.getElementById("write-review");
  reviewForm.addEventListener("submit", e => {
    e.preventDefault();
    handleReviewSubmission(restaurant.id, e);
  });

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + ".jpg";
  // add alt to images
  image.alt = "A picture of " + restaurant.name;
  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");

  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = reviews => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h3");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  // append reviewer name and review date in a div for styling
  const reviewHeadingDiv = document.createElement("div");
  reviewHeadingDiv.classList.add("review-headings");
  // use an heading for the reviewer name
  const name = document.createElement("h4");
  name.innerHTML = review.name;
  // add a class to the review heading
  name.classList.add("reviewer-name");
  reviewHeadingDiv.appendChild(name);

  const date = document.createElement("p");

  let theDate = new Date(review.createdAt);
  date.innerHTML = theDate.toLocaleDateString();

  // add a class to the review date
  date.classList.add("review-date");
  reviewHeadingDiv.appendChild(date);
  li.appendChild(reviewHeadingDiv);

  const rating = document.createElement("h5");
  rating.innerHTML = `Rating: ${review.rating}`;
  // add a class to rating
  rating.classList.add("review-rating");
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  // add a class to the review text
  comments.classList.add("review-text");
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  const button = document.getElementById("star-li");
  li.innerHTML = restaurant.name;
  breadcrumb.insertBefore(li, button);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 *  Toggle the favorite star
 */
lightTheStarUp = () => {
  const theStar = document.getElementById("star");
  theStar.classList.toggle("lightened");
};

/**
 *  Star button clicked
 */
toggleFavorite = name => {
  lightTheStarUp();
  DBHelper.saveFavoriteRestaurantToIDB(name, (error, restaurant) => {
    if (error) {
      console.log(error);
      //TODO: add error handling
    }
    if (restaurant) {
      DBHelper.saveFavoriteRestaurantToAPI(restaurant, (error, restaurant) => {
        if (error) {
          console.log(error);
          // TODO: add error handling
        }
        if (restaurant) {
          console.log(restaurant);
        }
      });
    }
  });
};

/*
* handles review creation
*/
handleReviewSubmission = (id, e) => {
  // get form data
  const data = new FormData(e.target);
  const rating = data.get("rating");
  const review = data.get("review");
  const reviewer = data.get("reviewer");
  // get the date
  const date = new Date();
  const reviewDate = date.getTime();
  // get first free id
  DBHelper.reviewsDB
    .length()
    .then(numberOfReviews => {
      let nextID = numberOfReviews;
      nextID++;
      //create the review object
      return createReview(review, reviewDate, nextID, reviewer, rating, id);
    })
    .then(review => {
      // show the review on page
      showNewReview(review);
      // cache review to IDB
      saveReview(review);
      // save review to API
      uploadReview(review);
    })
    // handle errors
    .catch(error => {
      console.log(error);
    });
}

/*
* create the review object
*/
createReview = (review, reviewDate, nextID, reviewer, rating, id) => {
  const newReview = {
    id: nextID,
    restaurant_id: id,
    name: reviewer,
    createdAt: reviewDate,
    updatedAt: reviewDate,
    comments: review,
    rating: rating
  };
  return newReview;
}

/*
* display new review on page, reset the form
*/
showNewReview = (review) => {
  // dreate review html
  const li = createReviewHTML(review);
  const container = document.getElementById("reviews-list");
  // display it on page
  container.appendChild(li);
  // reset form
  document.getElementById("review-text").value = "";
  document.getElementById("reviewer").value = "";
  let radios = document.getElementsByName("rating");
  radios.forEach(radio => {
    radio.checked = false;
  });
}

/*
* cache new review to IDB
*/
saveReview = (review) => {
  DBHelper.reviewsDB.setItem(review.id.toString(), review);
}

/*
 * handle saving new review to API server
 */
uploadReview = (review) => {
  // pass the review to the DBHelper function
  DBHelper.saveReviewToAPI(review, error => {
    // handle errors
    if (error) {
      console.log(error);
      //TODO: retry
    }
  });
}
