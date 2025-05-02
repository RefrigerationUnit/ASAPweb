let map;
let service;
let userMarker;
let shops = [];
let nextPageToken = null;
let currentUser = null; // Moved to top for better organization

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
  const showInspections = document.getElementById('inspectionToggle').checked;

  if (!location || !radius || isNaN(radius) || radius <= 0) {
    document.getElementById("results").innerHTML = "Please enter a valid location and radius.";
    return;
  }

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

    if (userMarker) userMarker.setMap(null);
    shops.forEach(m => m.setMap(null));
    shops = [];
    nextPageToken = null;

    userMarker = new google.maps.Marker({
      map: map,
      position: userLocation,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
    });

    // Pass showInspections to performSearch
    performSearch(userLocation, radius, sortBy, resultsLimit, showInspections);
  });
}

// Added showInspections parameter
function performSearch(userLocation, radius, sortBy, resultsLimit, showInspections, accumulatedResults = []) {
  const request = {
    location: userLocation,
    radius: radius * 1000,
    type: "car_repair",
    keyword: showInspections ? "" : "-vehicle technical inspection",
    rankBy: google.maps.places.RankBy.PROMINENCE,
    pageToken: nextPageToken
  };

  service.nearbySearch(request, (results, status, pagination) => {
    if (status !== "OK") {
      document.getElementById("results").innerHTML = "No car repair shops found in this area.";
      return;
    }

    results.forEach(place => {
      place.distance = google.maps.geometry.spherical.computeDistanceBetween(
        userLocation, place.geometry.location
      );
    });

    accumulatedResults = accumulatedResults.concat(results);

    if (pagination.hasNextPage && accumulatedResults.length < resultsLimit) {
      nextPageToken = pagination.nextPageToken;
      setTimeout(() => {
        performSearch(userLocation, radius, sortBy, resultsLimit, showInspections, accumulatedResults);
      }, 2000);
    } else {
      // Pass showInspections to processResults
      processResults(accumulatedResults, userLocation, sortBy, resultsLimit, showInspections);
    }
  });
}

// Added showInspections parameter
function processResults(results, userLocation, sortBy, resultsLimit, showInspections) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  // Client-side filtering moved to start of processing
  if (!showInspections) {
    results = results.filter(place => 
      !place.name.toLowerCase().includes('technical inspection') &&
      !place.name.toLowerCase().includes('vehicle inspection')
    );
  }

  switch (sortBy) {
    case "rating":
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "reviews":
      results.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
      break;
    default:
      results.sort((a, b) => a.distance - b.distance);
  }

  const displayedResults = Math.min(results.length, resultsLimit);
  const resultsHeader = displayedResults === 1
    ? "Found 1 Car Repair Shop"
    : `Found ${displayedResults} Car Repair Shops`;

  resultsDiv.innerHTML = `<h2>${resultsHeader}</h2>`;

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(userLocation);

  results.slice(0, resultsLimit).forEach((place, index) => {
    const distance = (place.distance / 1000).toFixed(1);
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      label: (index + 1).toString(),
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }
    });
    shops.push(marker);
    bounds.extend(place.geometry.location);

    const shopElement = document.createElement("div");
    shopElement.className = "shop";
    shopElement.innerHTML = `
      <div class="shop-details">
        <strong>${index + 1}. ${place.name}</strong><br>
        ${place.vicinity}<br>
        Distance: ${distance} km<br>
        Rating: ${place.rating || 'Not available'}<br>
        Reviews: ${place.user_ratings_total || 'Not available'}
      </div>
      <div class="click-here">Click here</div>
    `;

    shopElement.addEventListener("click", () => {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}+${encodeURIComponent(place.vicinity)}`;
      window.open(mapsUrl, "_blank");
    });

    resultsDiv.appendChild(shopElement);
  });

  map.fitBounds(bounds, {
    top: 50,
    bottom: 50,
    left: 20,
    right: 20
  });

  const minZoomLevel = 12;
  google.maps.event.addListenerOnce(map, "bounds_changed", () => {
    if (map.getZoom() > minZoomLevel) {
      map.setZoom(minZoomLevel);
    }
  });
}

// Authentication functions
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

  // Removed duplicate localStorage calls
  localStorage.setItem('user', JSON.stringify({ email }));
  currentUser = email;
  updateNav();
  showUserSection();
  toggleAuthModal();
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  localStorage.setItem('user', JSON.stringify({ email }));
  currentUser = email;
  updateNav();
  showUserSection();
  toggleAuthModal();
}

// User section functions
function showUserSection() {
  document.getElementById('userSection').classList.remove('hidden');
  document.querySelector('.container').classList.add('hidden');
}

function goHome() {
  document.getElementById('userSection').classList.add('hidden');
  document.querySelector('.container').classList.remove('hidden');
}

function logout() {
  localStorage.removeItem('user');
  currentUser = null;
  updateNav();
  goHome();
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

// Initialization
window.onload = function() {
  const user = localStorage.getItem('user');
  if (user) {
    currentUser = JSON.parse(user).email;
    updateNav();
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('authModal');
  if (event.target === modal) {
    toggleAuthModal();
  }
}

// Repair Cost Estimation
function estimateCost() {
  const brand = document.getElementById('carBrand').value;
  const model = document.getElementById('carModel').value;
  const year = document.getElementById('carYear').value;
  const issue = document.getElementById('carIssue').value;

  if (!brand || !model || !year || !issue) {
    alert("Please fill all car details");
    return;
  }

  const minCost = 500;
  const maxCost = 10000;
  const randomCost = Math.floor(Math.random() * (maxCost - minCost + 1)) + minCost;
  document.getElementById('costDisplay').textContent = `€${randomCost.toFixed(2)}`;
}
