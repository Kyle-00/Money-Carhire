/**
 * Vehicle Class (OOP)
 */

export class Vehicle {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.price = data.price || 0;
    this.category = data.category || '';
    this.image = data.image || '';
    this.badge = data.badge || '';
    this.availability = 'available'; // will be set by FleetManager
  }

  getFormattedPrice() {
    return 'KSh ' + this.price.toLocaleString('en-KE');
  }

  getCategoryLabel() {
    const labels = { suv: 'SUV', sedan: 'Sedan', economy: 'Economy' };
    return labels[this.category] || this.category;
  }

  getEngineType() {
    const engines = { suv: 'V6', sedan: 'V6', economy: '1.5L' };
    return engines[this.category] || 'Automatic';
  }

  hasBadge() { return !!this.badge; }

  static fromJSON(jsonData) {
    return new Vehicle(jsonData);
  }

  static fromJSONArray(jsonArray) {
    return jsonArray.map(data => Vehicle.fromJSON(data));
  }
}