export class VehicleManager {
    constructor() {
        this.vehicles = [];
        this.vehicleTypes = [];
        this.nextVehicleId = 1;
        this.loadVehicleTypes();
    }

    async loadVehicleTypes() {
        try {
            const response = await fetch('./data/vehicles.json');
            this.vehicleTypes = await response.json();
            console.log('Vehicle types loaded:', this.vehicleTypes.length);
        } catch (error) {
            console.error('Failed to load vehicle types:', error);
            // Fallback vehicle types
            this.vehicleTypes = this.getDefaultVehicleTypes();
        }
    }

    getDefaultVehicleTypes() {
        return [
            {
                "id": "matatu_old",
                "name": "Old Reliable",
                "description": "A beat-up but functional 14-seater. Slow and prone to breakdowns, but it gets the job done.",
                "cost": 0,
                "capacity": 14,
                "speed": 5,
                "fuelCapacity": 40,
                "reliability": 4,
                "fuelEfficiency": 4,
                "maxDistance": 50
            },
            {
                "id": "matatu_sound",
                "name": "Modified Sound Matatu",
                "description": "A pimped-out ride with massive subwoofers and graffiti art. Attracts younger crowds but also police attention.",
                "cost": 120000,
                "capacity": 18,
                "speed": 7,
                "fuelCapacity": 60,
                "reliability": 6,
                "fuelEfficiency": 6,
                "maxDistance": 80
            },
            {
                "id": "matatu_modern",
                "name": "Modern Shuttle",
                "description": "A newer, more comfortable vehicle with better fuel efficiency and reliability.",
                "cost": 250000,
                "capacity": 20,
                "speed": 8,
                "fuelCapacity": 70,
                "reliability": 8,
                "fuelEfficiency": 8,
                "maxDistance": 120
            }
        ];
    }

    initializeVehicles(savedVehicles) {
        if (savedVehicles && Array.isArray(savedVehicles)) {
            this.vehicles = savedVehicles;
            // Update nextVehicleId to be higher than any existing vehicle
            if (this.vehicles.length > 0) {
                this.nextVehicleId = Math.max(...this.vehicles.map(v => v.id || 0)) + 1;
            }
        } else {
            this.vehicles = [];
        }
        console.log('Vehicles initialized:', this.vehicles.length);
    }

    // Update getVehicles to return a copy for safety
    getVehicles() {
        return [...this.vehicles];
    }

    getVehicleById(id) {
        if (!this.vehicles || !Array.isArray(this.vehicles)) {
            console.warn('Vehicles array not initialized');
            return null;
        }
        return this.vehicles.find(v => v && v.id === parseInt(id));
    }

    getNextVehicleId() {
        return this.nextVehicleId;
    }

    getVehicleTypes() {
        return this.vehicleTypes || [];
    }

    getVehicleType(typeId) {
        return this.vehicleTypes.find(vt => vt.id === typeId);
    }

    getVehicleTypeById(typeId) {
        return this.vehicleTypes.find(vt => vt.id === typeId);
    }

    // Add safety check to updateVehicleState
    updateVehicleState(vehicleId, fuelChange, conditionChange, earnings) {
        const vehicle = this.getVehicleById(vehicleId);
        if (!vehicle) {
            console.error(`Vehicle ${vehicleId} not found`);
            return null;
        }

        // Store previous values for comparison
        const prevFuel = vehicle.fuel || 100;
        const prevCondition = vehicle.condition || 100;
        const prevStatus = vehicle.status;

        // Update vehicle properties safely
        vehicle.fuel = Math.max(0, Math.min(100, prevFuel + fuelChange));
        vehicle.condition = Math.max(0, Math.min(100, prevCondition + conditionChange));
        
        // Update earnings
        if (earnings > 0) {
            vehicle.totalEarnings = (vehicle.totalEarnings || 0) + earnings;
        }
        
        // Update status based on condition and fuel
        if (vehicle.fuel <= 0) {
            vehicle.status = 'out_of_fuel';
            vehicle.routeId = null; // Unassign from route
            console.log(`Vehicle ${vehicle.name} ran out of fuel!`);
        } else if (vehicle.condition <= 20) {
            vehicle.status = 'breakdown';
            vehicle.routeId = null; // Unassign from route
            console.log(`Vehicle ${vehicle.name} broke down!`);
        } else if (vehicle.routeId && vehicle.status !== 'running') {
            vehicle.status = 'running';
        } else if (!vehicle.routeId && vehicle.status === 'running') {
            vehicle.status = 'idle';
        }

        // Only log significant changes to reduce console spam
        if (Math.abs(prevFuel - vehicle.fuel) > 5 || Math.abs(prevCondition - vehicle.condition) > 5 || prevStatus !== vehicle.status) {
            console.log(`Vehicle ${vehicle.name} updated: Fuel ${Math.round(vehicle.fuel)}%, Condition ${Math.round(vehicle.condition)}%, Status: ${vehicle.status}`);
        }

        return vehicle;
    }

    buyVehicle(typeId, customName) {
        const vehicleType = this.vehicleTypes.find(vt => vt.id === typeId);
        if (!vehicleType) {
            console.error('Vehicle type not found:', typeId);
            return null;
        }

        const vehicleName = customName || vehicleType.name;
        const defaultNickname = this.generateDefaultNickname(vehicleName);

        const newVehicle = {
            id: this.nextVehicleId++,
            typeId: typeId,
            name: vehicleName,
            nickname: defaultNickname,
            fuel: 100,
            condition: 100,
            routeId: null,
            status: 'idle',
            passengers: 0,
            totalEarnings: 0,
            purchaseDate: Date.now()
        };

        this.vehicles.push(newVehicle);
        console.log('New vehicle purchased:', newVehicle);
        return newVehicle;
    }

    // Add helper method for nickname generation
    generateDefaultNickname(fullName) {
        const words = fullName.split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
        } else {
            return fullName.substring(0, 3).toUpperCase();
        }
    }

    sellVehicle(vehicleId) {
        const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex === -1) {
            console.error('Vehicle not found for selling:', vehicleId);
            return false;
        }
        
        const vehicle = this.vehicles[vehicleIndex];
        
        // Check if vehicle is currently running
        if (vehicle.status === 'running' && vehicle.routeId) {
            console.error('Cannot sell vehicle while it\'s running on a route');
            return false;
        }
        
        // Remove vehicle from array
        this.vehicles.splice(vehicleIndex, 1);
        
        console.log(`Vehicle ${vehicle.name} sold successfully`);
        return true;
    }

    // Add remove vehicle method
    removeVehicle(vehicleId) {
        const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex === -1) {
            console.error('Vehicle not found for removal:', vehicleId);
            return false;
        }
        
        const vehicle = this.vehicles[vehicleIndex];
        
        // Remove from vehicles array
        this.vehicles.splice(vehicleIndex, 1);
        
        console.log(`Vehicle ${vehicle.name} (ID: ${vehicleId}) removed from fleet`);
        return true;
    }
}