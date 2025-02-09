function searchShops() {
    const locationInput = document.getElementById('locationInput').value;
    const radiusInput = document.getElementById('radiusInput').value;
    const resultsDiv = document.getElementById('results');
    const searchContainer = document.querySelector('.search-container');
    
    if (locationInput && radiusInput) {
        // Move search container to the top
        searchContainer.style.justifyContent = 'flex-start';
        
        // Generate theoretical auto repair shops data
        const shops = [
            { name: "Quick Fix Auto", address: "123 Main St", distance: 1.2 },
            { name: "Speedy Repairs", address: "456 Elm Ave", distance: 2.3 },
            { name: "Auto Care Center", address: "789 Oak Ln", distance: 3.1 },
            { name: "Expert Auto Service", address: "101 Pine St", distance: 4.5 },
            { name: "Premier Auto Repair", address: "222 Maple Dr", distance: 5.2 }
        ];
        
        // Filter shops within the specified radius
        const filteredShops = shops.filter(shop => shop.distance <= radiusInput);
        
        // Generate HTML for the filtered shops list
        let resultsHTML = `<h2>Auto Repair Shops near ${locationInput} (within ${radiusInput} km):</h2><ul>`;
        
        if (filteredShops.length > 0) {
            filteredShops.forEach(shop => {
                resultsHTML += `<li>${shop.name} - ${shop.address} (${shop.distance} km away)</li>`;
            });
        } else {
            resultsHTML += "<li>No auto repair shops found within the specified radius.</li>";
        }
        
        resultsHTML += "</ul>";
        
        // Display the results
        resultsDiv.innerHTML = resultsHTML;
    } else {
        resultsDiv.innerHTML = "Please enter both location and search radius.";
    }
}
