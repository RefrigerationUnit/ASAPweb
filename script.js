let map;
let marker;
let geocoder;

function initMap() {
  const defaultLocation = { lat: 39.8283, lng: -98.5795 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: defaultLocation,
    mapTypeControl: false,
  });
  geocoder = new google.maps.Geocoder();
}

function calculateDistance(p1, p2) {
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
}

function searchShops() {
  const locationInput = document.getElementById("locationInput").value;
  const radiusInput = document.getElementById("radiusInput").value;
  const resultsDiv = document.getElementById("results");
  const searchContainer = document.querySelector(".search-container");

  if (locationInput && radiusInput) {
    searchContainer.style.justifyContent = "flex-start";
    
    geocoder.geocode({ address: locationInput }, function (results, status) {
      if (status === "OK") {
        const userLocation = results[0].geometry.location;
        
        map.setCenter(userLocation);
        map.setZoom(13);
        
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
          map: map,
          position: userLocation,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          }
        });

        const request = {
          location: userLocation,
          radius: radiusInput * 1000,
          type: ["car_repair"],
        };

        const service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function (results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Add distance to each result
            results.forEach(place => {
              place.distance = calculateDistance(
                userLocation,
                place.geometry.location
              );
            });

            // Sort by distance
            results.sort((a, b) => a.distance - b.distance);

            // Take only the closest 10 shops
            const closestShops = results.slice(0, 10);

            // Clear existing markers
            clearMarkers();

            let resultsHTML = `<h2>10 Closest Auto Repair Shops to ${locationInput}</h2>`;
            
            // Create markers array to store shop markers
            const markers = [];

            closestShops.forEach((place, index) => {
              // Create marker for each shop
              const shopMarker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                label: (index + 1).toString(),
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                }
              });
              
              markers.push(shopMarker);

              // Add info window for each marker
              const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color: black;">
                           <strong>${place.name}</strong><br>
                           ${place.vicinity}<br>
                           Distance: ${(place.distance / 1000).toFixed(2)} km
                           ${place.rating ? '<br>Rating: ' + place.rating : ''}
                         </div>`
              });

              shopMarker.addListener('click', () => {
                infoWindow.open(map, shopMarker);
              });

              // Add to results list
              resultsHTML += `
                <div class="shop">
                  <strong>${index + 1}. ${place.name}</strong><br>
                  ${place.vicinity}<br>
                  Distance: ${(place.distance / 1000).toFixed(2)} km
                  ${place.rating ? '<br>Rating: ' + place.rating + '/5' : '<br>No rating available'}
                </div><br>`;
            });

            resultsDiv.innerHTML = resultsHTML;

            // Fit map bounds to include all markers
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(userLocation);
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);

          } else {
            resultsDiv.innerHTML = "Error retrieving places: " + status;
          }
        });
      } else {
        resultsDiv.innerHTML = "Geocode was not successful for the following reason: " + status;
      }
    });
  }
}

// Function to clear all markers from the map
function clearMarkers() {
  if (window.shopMarkers) {
    window.shopMarkers.forEach(marker => marker.setMap(null));
  }
  window.shopMarkers = [];
}




