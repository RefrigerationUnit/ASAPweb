let map;
let marker;
let geocoder;

function initMap() {
  // Default map centered on the geographic center of the USA
  const defaultLocation = { lat: 39.8283, lng: -98.5795 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: defaultLocation,
    mapTypeControl: false,
  });
  geocoder = new google.maps.Geocoder();
}

function searchShops() {
  const locationInput = document.getElementById("locationInput").value;
  const radiusInput = document.getElementById("radiusInput").value;
  const resultsDiv = document.getElementById("results");
  const searchContainer = document.querySelector(".search-container");

  if (locationInput && radiusInput) {
    // Optionally adjust the search container layout if needed
    searchContainer.style.justifyContent = "flex-start";

    // Geocode the user-specified location
    geocoder.geocode({ address: locationInput }, function (results, status) {
      if (status === "OK") {
        const userLocation = results[0].geometry.location;
        
        // Center and zoom the map on the location
        map.setCenter(userLocation);
        map.setZoom(13);

        // Place a marker on the specified location
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
          map: map,
          position: userLocation,
        });

        // Prepare the PlacesService request
        const request = {
          location: userLocation,
          radius: radiusInput * 1000, // converting km to meters
          type: ["car_repair"],
        };

        const service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function (results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Sort the results by rating descending (best to worst)
            results.sort(function (a, b) {
              return (b.rating || 0) - (a.rating || 0);
            });

            // Build the HTML output with place details
            let resultsHTML = `<h2>Auto Repair Shops near ${locationInput}</h2>`;
            results.forEach(function (place) {
              resultsHTML += `<div class="shop">
                                <strong>${place.name}</strong><br>
                                ${place.vicinity ? place.vicinity + "<br>" : ""}
                                ${place.rating ? "Rating: " + place.rating : "No rating available"}
                              </div><br>`;
            });
            resultsDiv.innerHTML = resultsHTML;
          } else {
            resultsDiv.innerHTML = "Error retrieving places: " + status;
          }
        });
      } else {
        resultsDiv.innerHTML =
          "Geocode was not successful for the following reason: " + status;
      }
    });
  }
}




