let map;
let service;
let userMarker;
let shops = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.8283, lng: -98.5795 },
    zoom: 4
  });
  service = new google.maps.places.PlacesService(map);
}

function estimateCost() {
  const brand = document.getElementById("carBrand").value;
  const model = document.getElementById("carModel").value;
  const year = document.getElementById("carYear").value;
  const issue = document.getElementById("carIssue").value;

  if (!brand || !model || !year || !issue) {
    alert("Please fill all car details");
    return;
  }

  // Generate random cost between 500 and 10000
  const minCost = 500;
  const maxCost = 10000;
  const randomCost = Math.floor(Math.random() * (maxCost - minCost + 1)) + minCost;
  
  document.getElementById("costDisplay").textContent = `€${randomCost.toFixed(2)}`;
}

function searchShops() {
  const location = document.getElementById("locationInput").value;
  const radius = document.getElementById("radiusInput").value;
  const sortBy = document.getElementById("sortBy").value;
  const resultsLimitInput = document.getElementById("resultsLimit").value;
  const geocoder = new google.maps.Geocoder();

  // Validate inputs
  if (!location || !radius || isNaN(radius) || radius <= 0) {
    document.getElementById("results").innerHTML = "Please enter a valid location and radius.";
    return;
  }

  // Set default results limit to 30 if input is empty or invalid
  const resultsLimit = resultsLimitInput && !isNaN(resultsLimitInput) && resultsLimitInput > 0
    ? parseInt(resultsLimitInput, 10)
    : 30;

  geocoder.geocode({ address: location }, (results, status) => {
    if (status !== "OK") {
      document.getElementById("results").innerHTML = "Location not found. Please try again.";
      return;
    }

    const userLocation = results[0].geometry.location;
    map.setCenter(userLocation);
    map.setZoom(13);

    // Clear previous markers
    if (userMarker) userMarker.setMap(null);
    shops.forEach(m => m.setMap(null));
    shops = [];

    // Create user marker
    userMarker = new google.maps.Marker({
      map: map,
      position: userLocation,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
    });

    // Car repair shop search request
    const request = {
      location: userLocation,
      radius: radius * 1000,
      type: "car_repair",
      rankBy: google.maps.places.RankBy.PROMINENCE // Ensure we get up to 30 results
    };

    service.nearbySearch(request, (results, status) => {
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = "";
      
      if (status !== "OK" || !results.length) {
        resultsDiv.innerHTML = "No car repair shops found in this area.";
        return;
      }

      // Add distance to each result
      results.forEach(place => {
        place.distance = google.maps.geometry.spherical.computeDistanceBetween(
          userLocation, place.geometry.location
        );
      });

      // Sort results based on selected option
      switch (sortBy) {
        case "rating":
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "reviews":
          results.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
          break;
        case "distance":
        default:
          results.sort((a, b) => a.distance - b.distance);
          break;
      }

      // Display results (up to the specified limit or 30 by default)
      const displayedResults = Math.min(results.length, resultsLimit); // Ensure we don't exceed the limit

      // Handle singular/plural for the results header
      const resultsHeader = displayedResults === 1
        ? "Found 1 Car Repair Shop"
        : `Found ${displayedResults} Car Repair Shops`;

      resultsDiv.innerHTML = `<h2>${resultsHeader}</h2>`;
      
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation); // Include user's location in bounds

      // Display up to the specified number of results
      results.slice(0, resultsLimit).forEach((place, index) => {
        const distance = (place.distance / 1000).toFixed(1);

        // Create marker
        const marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location,
          label: (index + 1).toString(),
          icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }
        });
        shops.push(marker);

        // Extend bounds to include this marker
        bounds.extend(place.geometry.location);

        // Add to results list
        resultsDiv.innerHTML += `
          <div class="shop">
            <strong>${index + 1}. ${place.name}</strong><br>
            ${place.vicinity}<br>
            Distance: ${distance} km<br>
            Rating: ${place.rating || 'Not available'}<br>
            Reviews: ${place.user_ratings_total || 'Not available'}
          </div><br>`;
      });

      // Fit the map to the bounds with padding and zoom constraints
      map.fitBounds(bounds, {
        top: 50,   // Reduced padding for the new layout
        bottom: 50,
        left: 20,
        right: 20
      });

      // Set a minimum zoom level to prevent the map from zooming out too far
      const minZoomLevel = 12;
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > minZoomLevel) {
          map.setZoom(minZoomLevel);
        }
      });
    });
  });
}
