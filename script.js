let map;
let service;
let userMarker;
let shops = [];
let nextPageToken = null; // Store the next page token for pagination

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

    // Clear previous markers and reset nextPageToken
    if (userMarker) userMarker.setMap(null);
    shops.forEach(m => m.setMap(null));
    shops = [];
    nextPageToken = null;

    // Create user marker
    userMarker = new google.maps.Marker({
      map: map,
      position: userLocation,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
    });

    // Start the search process
    performSearch(userLocation, radius, sortBy, resultsLimit);
  });
}

function performSearch(userLocation, radius, sortBy, resultsLimit, accumulatedResults = []) {
  const request = {
    location: userLocation,
    radius: radius * 1000,
    type: "car_repair",
    rankBy: google.maps.places.RankBy.PROMINENCE,
    pageToken: nextPageToken // Use the next page token for pagination
  };

  service.nearbySearch(request, (results, status, pagination) => {
    if (status !== "OK") {
      document.getElementById("results").innerHTML = "No car repair shops found in this area.";
      return;
    }

    // Add distance to each result
    results.forEach(place => {
      place.distance = google.maps.geometry.spherical.computeDistanceBetween(
        userLocation, place.geometry.location
      );
    });

    // Accumulate results
    accumulatedResults = accumulatedResults.concat(results);

    // Check if we have more results and need to fetch the next page
    if (pagination.hasNextPage && accumulatedResults.length < resultsLimit) {
      nextPageToken = pagination.nextPageToken;

      // Delay the next request to respect Google's API rate limits
      setTimeout(() => {
        performSearch(userLocation, radius, sortBy, resultsLimit, accumulatedResults);
      }, 2000); // Wait 2 seconds before making the next request
    } else {
      // We've fetched all results or reached the limit
      processResults(accumulatedResults, userLocation, sortBy, resultsLimit);
    }
  });
}

function processResults(results, userLocation, sortBy, resultsLimit) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

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

  // Display results (up to the specified limit)
  const displayedResults = Math.min(results.length, resultsLimit);

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
}

// Repair Cost Estimation Function
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

// Add to script.js
let currentUser = null;

function toggleAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function toggleForms() {
  document.getElementById('signupForm').classList.toggle('hidden');
  document.getElementById('loginForm').classList.toggle('hidden');
}

function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (password !== confirm) {
    alert('Passwords do not match!');
    return;
  }

  // In real implementation, send to backend
  localStorage.setItem('user', JSON.stringify({ email }));
  currentUser = email;
  updateNav();
  toggleAuthModal();
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  // In real implementation, verify credentials
  currentUser = email;
  localStorage.setItem('user', JSON.stringify({ email }));
  updateNav();
  toggleAuthModal();
}

function logout() {
  localStorage.removeItem('user');
  currentUser = null;
  updateNav();
}

function updateNav() {
  const authButton = document.getElementById('authButton');
  const logoutButton = document.getElementById('logoutButton');
  const navMiddle = document.getElementById('navMiddle');

  if (currentUser) {
    authButton.classList.add('hidden');
    logoutButton.classList.remove('hidden');
    navMiddle.innerHTML = `Welcome, ${currentUser}`;
  } else {
    authButton.classList.remove('hidden');
    logoutButton.classList.add('hidden');
    navMiddle.innerHTML = '';
  }
}

// Check login status on page load
window.onload = function() {
  const user = localStorage.getItem('user');
  if (user) {
    currentUser = JSON.parse(user).email;
    updateNav();
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('authModal');
  if (event.target === modal) {
    toggleAuthModal();
  }
}
