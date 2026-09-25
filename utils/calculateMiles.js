const calculateMiles = (origin, destination) => {
    const toRadians = degrees => (degrees * Math.PI) / 180;
  
    const { latitude: lat1, longitude: lon1 } = origin;
    const { latitude: lat2, longitude: lon2 } = destination;
  
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    // Convert miles to meters (1 mile = 1609.34 meters)
    return R * c * 1609.34;
  };
  
  export {
    calculateMiles
  }