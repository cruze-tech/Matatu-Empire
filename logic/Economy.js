export class Economy {
    constructor(player) {
        this.player = player;
        this.basePassengerRate = 0.8;
        this.baseFuelConsumption = 0.6;
        this.baseConditionWear = 0.4;
    }

    calculateTick(vehicle, route, deltaTime) {
        const vehicleType = this.getVehicleType(vehicle.typeId);
        if (!vehicleType) return { profit: 0, fuelConsumed: 0, conditionWear: 0 };

        // Weather effects
        let weatherMultiplier = 1.0;
        let fuelMultiplier = 1.0;
        let breakdownMultiplier = 1.0;
        
        if (window.gameInstance && window.gameInstance.weatherManager) {
            const weatherEffects = window.gameInstance.weatherManager.getCurrentWeatherEffects();
            if (weatherEffects) {
                weatherMultiplier = weatherEffects.passengerMultiplier || 1.0;
                fuelMultiplier = weatherEffects.fuelMultiplier || 1.0;
                breakdownMultiplier = weatherEffects.breakdownChance || 1.0;
            }
        }

        // Calculate passengers
        let passengerRate = this.basePassengerRate * weatherMultiplier;
        passengerRate *= (vehicle.condition / 100); // Condition affects passenger attraction
        passengerRate *= (vehicleType.capacity / 14); // Normalize by capacity
        
        const passengers = Math.min(
            Math.floor(passengerRate * deltaTime * 10),
            vehicleType.capacity
        );

        // Calculate earnings
        const farePerPassenger = route.fare || 50;
        const revenue = passengers * farePerPassenger;
        
        // Calculate fuel consumption - FIXED: Use let instead of const
        let fuelConsumed = this.baseFuelConsumption * fuelMultiplier * deltaTime;
        fuelConsumed *= (1 + (vehicleType.capacity / 20)); // Larger vehicles use more fuel
        fuelConsumed *= (1.5 - (vehicle.condition / 200)); // Poor condition increases fuel use
        
        // Calculate condition wear - FIXED: Use let instead of const
        let conditionWear = this.baseConditionWear * breakdownMultiplier * deltaTime;
        conditionWear *= (1 + Math.random() * 0.5); // Random wear variation
        conditionWear *= (1 + (vehicleType.capacity / 30)); // Larger vehicles wear faster
        
        // Operating costs
        const operatingCost = revenue * 0.15; // 15% operating costs
        const profit = revenue - operatingCost;

        return {
            profit: Math.max(0, profit),
            fuelConsumed: Math.min(fuelConsumed, vehicle.fuel),
            conditionWear: Math.min(conditionWear, vehicle.condition),
            passengers
        };
    }

    getVehicleType(typeId) {
        if (window.gameInstance && window.gameInstance.vehicleManager) {
            return window.gameInstance.vehicleManager.getVehicleTypeById(typeId);
        }
        return null;
    }

    addCash(amount) {
        this.player.cash += amount;
        
        // Track total earnings (only positive amounts)
        if (amount > 0) {
            if (!this.player.totalEarningsAllTime) {
                this.player.totalEarningsAllTime = 0;
            }
            this.player.totalEarningsAllTime += amount;
        }
    }

    spendCash(amount) {
        if (this.player.cash >= amount) {
            this.player.cash -= amount;
            return true;
        }
        return false;
    }

    getPlayerState() {
        return { ...this.player };
    }

    updateDailyProfit(amount) {
        this.player.dailyProfit += amount;
    }
}