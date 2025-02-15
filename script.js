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

function searchShops() {
  const location = document.getElementById("locationInput").value;
  const radius = document.getElementById("radiusInput").value;
  const geocoder = new google.maps.Geocoder();

  // Validate inputs
  if (!location || !radius || isNaN(radius) || radius <= 0) {
    document.getElementById("results").innerHTML = "Please enter a valid location and radius.";
    return;
  }

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
      type: "car_repair"
    };

    service.nearbySearch(request, (results, status) => {
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = "";
      
      if (status !== "OK" || !results.length) {
        resultsDiv.innerHTML = "No car repair shops found in this area.";
        return;
      }

      // Process results
      results.sort((a, b) => 
        google.maps.geometry.spherical.computeDistanceBetween(userLocation, a.geometry.location) - 
        google.maps.geometry.spherical.computeDistanceBetween(userLocation, b.geometry.location)
      );

      // Display results
      resultsDiv.innerHTML = `<h2>Found ${results.length} Car Repair Shops:</h2>`;
      
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation); // Include user's location in bounds

      // Display ALL results (no slice limit)
      results.forEach((place, index) => {
        const distance = (google.maps.geometry.spherical.computeDistanceBetween(
          userLocation, place.geometry.location
        ) / 1000).toFixed(1);

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
            Rating: ${place.rating || 'Not available'}
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

