function searchShops() {
  const locationInput = document.getElementById('locationInput').value;
  const radiusInput = document.getElementById('radiusInput').value;
  const resultsDiv = document.getElementById('results');
  const searchContainer = document.querySelector('.search-container');

  if (locationInput && radiusInput) {
    // Move search container to the top (if desired)
    searchContainer.style.justifyContent = 'flex-start';

    // Define theoretical auto repair shops with maintenance cost
    const shops = [
      { name: "Quick Fix Auto", address: "123 Main St", distance: 1.2, maintenanceCost: "$50" },
      { name: "Speedy Repairs", address: "456 Elm Ave", distance: 2.3, maintenanceCost: "$60" },
      { name: "Auto Care Center", address: "789 Oak Ln", distance: 3.1, maintenanceCost: "$55" },
      { name: "Expert Auto Service", address: "101 Pine St", distance: 4.5, maintenanceCost: "$65" },
      { name: "Premier Auto Repair", address: "222 Maple Dr", distance: 5.2, maintenanceCost: "$70" }
    ];

    // Filter shops based on the input radius
    const filteredShops = shops.filter(shop => shop.distance <= radiusInput);

    // Build HTML output to display each shop's details including maintenance cost
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
  } else {
    resultsDiv.innerHTML = "Please enter both location and search radius.";
  }
}

