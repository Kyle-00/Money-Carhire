/**
 * Vehicle Service – fetch vehicles.json
 */

const VEHICLES_URL = 'vehicles.json';

export async function loadVehicles() {
  const response = await fetch(VEHICLES_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data;
}

export function getVehicleById(vehicles, id) {
  return vehicles.find(v => v.id === id) || null;
}

export function getVehicleByName(vehicles, name) {
  return vehicles.find(v => v.name === name) || null;
}

export function getVehiclesByCategory(vehicles, category) {
  return vehicles.filter(v => v.category === category);
}

export function getFeaturedVehicles(vehicles) {
  return vehicles.filter(v => v.badge);
}