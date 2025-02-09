let map;
let marker;
let geocoder;

// This function is called by the Google Maps API when it loads
function initMap() {
  // Default map centered on the geographic center of the USA
  const defaultLocation = { lat: 39.8283, lng: -98.5795 };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: defaultLocation,
    mapTypeControl: false
  });
  geocoder = new google.maps.Geocoder();
}

function searchShops() {
  const locationInput = document.getElementById('locationInput').value;
  const radiusInput = document.getElementById('radiusInput').value;
  const resultsDiv = document.getElementById('results');
  const searchContainer = document.querySelector('.search-container');

  if (locationInput && radiusInput) {
    // Optionally adjust the search container layout if needed
    searchContainer.style.justifyContent = 'flex-start';

    // Theoretical data for auto repair shops with a maintenance cost
    const shops = [
      { name: "Quick Fix Auto", address: "123 Main St", distance: 1.2, maintenanceCost: "$50" },
      { name: "Speedy Repairs", address: "456 Elm Ave", distance: 2.3, maintenanceCost: "$60" },
      { name: "Auto Care Center", address: "789 Oak Ln", distance: 3.1, maintenanceCost: "$55" },
      { name: "Expert Auto Service", address: "101 Pine St", distance: 4.5, maintenanceCost: "$65" },
      { name: "Premier Auto Repair", address: "222 Maple Dr", distance: 5.2, maintenanceCost: "$70" }
    ];

    // Filter shops based on the provided radius
    const filteredShops = shops.filter(shop => shop.distance <= radiusInput);

    // Build HTML output with shop details
    let resultsHTML = `<h2>Auto Repair Shops near ${locationInput} (within ${radiusInput} km):</h2><ul>`;
    if (filteredShops.length > 0) {
      filteredShops.forEach(shop => {
        resultsHTML += `<li>${shop.name} - ${shop.address} (${shop.distance} km away) - Maintenance Cost: ${shop.maintenanceCost}</li>`;
      });
    } else {
      resultsHTML += "<li>No auto repair shops found within the specified radius.</li>";
    }
    resultsHTML += "</ul>";

    resultsDiv.innerHTML = resultsHTML;

    // Geocode the entered location to update the map
    geocoder.geocode({ 'address': locationInput }, function(results, status) {
      if (status === 'OK') {
        // Center the map on the geocoded location
        map.setCenter(results[0].geometry.location);
        map.setZoom(12); // Zoom in for detail
        // Place a marker at the location
        if (marker) {
          marker.setMap(null);
        }
        marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
        });
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
      }
    });
  } else {
    resultsDiv.innerHTML = "Please enter both location and search radius.";
  }
}


