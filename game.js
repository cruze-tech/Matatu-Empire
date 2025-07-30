// Add this function at the top of the file before the Game class

function setupOrientationHandling() {
    function checkOrientation() {
        const orientationLock = document.getElementById('orientation-lock');
        const gameContainer = document.getElementById('game-container');
        
        if (!orientationLock || !gameContainer) return;
        
        const isMobile = window.innerWidth <= 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        // Only show orientation lock on mobile devices in portrait mode
        if (isMobile && isPortrait) {
            orientationLock.style.display = 'flex';
            gameContainer.style.display = 'none';
            document.body.classList.add('mobile-portrait');
        } else {
            orientationLock.style.display = 'none';
            gameContainer.style.display = 'flex';
            document.body.classList.remove('mobile-portrait');
        }
    }
    
    // Check immediately
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(checkOrientation, 100);
    });
    
    // Listen for resize events
    window.addEventListener('resize', checkOrientation);
    
    // Check when page visibility changes (for better mobile support)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(checkOrientation, 100);
        }
    });
}

import { RouteManager } from './logic/RouteManager.js';
import { VehicleManager } from './logic/VehicleManager.js';
import { Economy } from './logic/Economy.js';
import { WeatherManager } from './logic/WeatherManager.js';
import { EventManager } from './logic/EventManager.js';
import { DashboardUI } from './components/DashboardUI.js';
import { MapUI } from './components/MapUI.js';
import { EventPopupUI } from './components/EventPopupUI.js';
import { DriverMessages } from './components/DriverMessages.js';
import { WelcomeModal } from './components/WelcomeModal.js';

class Game {
    constructor() {
        this.gameState = {
            player: {
                cash: 50000,
                reputation: 50,
                dailyProfit: 0,
                totalEarningsAllTime: 0,
                businessStartDate: Date.now()
            },
            vehicles: [],
            nextVehicleId: 1,
            customRoutes: [],
            gameTime: 0,
            isPaused: false,
            lastSave: Date.now()
        };
        
        this.managers = {};
        this.components = {};
        this.isInitialized = false;
        this.lastTime = 0;
    }

    async init() {
        try {
            console.log('🎮 Initializing Matatu Empire...');
            
            // Wait for DOM to be fully ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }
            
            // Initialize managers first
            await this.initializeManagers();
            
            // Check for saved game BEFORE initializing components
            const hasExistingGame = this.loadGame();
            
            // Wait a bit more for routes to load completely
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Initialize components after managers are ready
            this.initializeComponents();
            this.setupEventListeners();
            this.startGameSystems();
            
            console.log('✅ Game initialization complete!');
            
            // Show welcome modal with appropriate content
            setTimeout(() => {
                if (this.components.welcomeModal) {
                    this.components.welcomeModal.show(!hasExistingGame);
                }
            }, 300);
            
            this.isInitialized = true;
            
            // Make game instance globally available for debugging
            window.gameInstance = this;
            
            // Force initial dashboard update
            setTimeout(() => {
                if (this.components.dashboard) {
                    this.components.dashboard.update();
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeManagers() {
        console.log('🔧 Initializing managers...');
        
        this.managers.route = new RouteManager();
        this.managers.vehicle = new VehicleManager();
        this.managers.economy = new Economy(this.gameState.player);
        this.managers.weather = new WeatherManager(this);
        this.managers.event = new EventManager(this);
        
        // Wait for async loading to complete
        await Promise.all([
            this.managers.route.loadRoutes(),
            this.managers.vehicle.loadVehicleTypes()
        ]);
        
        console.log('✅ Managers initialized');
        console.log('Routes available:', this.getAllRoutes().length);
        console.log('Vehicle types available:', this.managers.vehicle.getVehicleTypes().length);
    }

    initializeComponents() {
        console.log('🎨 Initializing UI components...');
        
        try {
            // Initialize dashboard first
            this.components.dashboard = new DashboardUI(this);
            
            // Initialize welcome modal
            this.components.welcomeModal = new WelcomeModal(this);
            
            // Get all routes safely
            const allRoutes = this.getAllRoutes();
            console.log('Available routes for map:', allRoutes.length);
            
            // Initialize map with proper error handling
            this.components.map = new MapUI(
                allRoutes,
                this.managers.vehicle,
                (routeId) => {
                    try {
                        const route = this.managers.route.getRouteById(routeId);
                        if (route && this.components.dashboard) {
                            this.components.dashboard.showRouteDetails(route);
                        }
                    } catch (error) {
                        console.error('Error showing route details:', error);
                    }
                }
            );
            
            // Initialize other components
            this.components.eventPopup = new EventPopupUI((choice) => {
                if (this.managers.event) {
                    this.managers.event.resolveCurrentEvent(choice);
                }
            });
            
            this.components.driverMessages = new DriverMessages(this);
            
            console.log('✅ UI components initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing components:', error);
            throw error; // Re-throw to be caught by main init
        }
    }

    setupEventListeners() {
        // Game controls
        const saveBtn = document.getElementById('save-game');
        const resetBtn = document.getElementById('reset-game');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveGame());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());
        
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleRuntimeError(e.error);
        });
        
        console.log('✅ Event listeners setup');
    }

    startGameSystems() {
        // Start game loop
        this.startGameLoop();
        
        // Start autosave
        setInterval(() => this.saveGame(), 30000);
        
        console.log('🚀 Game systems started');
    }

    // Game state management
    getAllRoutes() {
        const standardRoutes = this.managers.route.getStandardRoutes() || [];
        const customRoutes = this.managers.route.getCustomRoutes() || [];
        return [...standardRoutes, ...customRoutes];
    }

    get vehicleManager() { return this.managers.vehicle; }
    get routeManager() { return this.managers.route; }
    get economy() { return this.managers.economy; }
    get weatherManager() { return this.managers.weather; }
    get eventManager() { return this.managers.event; }
    get dashboardUI() { return this.components.dashboard; }
    get driverMessages() { return this.components.driverMessages; }
    get eventPopupUI() { return this.components.eventPopup; }

    // Game loop
    startGameLoop() {
        this.lastTime = performance.now();
        this.runGameLoop();
    }

    runGameLoop() {
        try {
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            this.update(deltaTime);
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        requestAnimationFrame(() => this.runGameLoop());
    }

    update(delta) {
        if (!this.gameState || !this.isInitialized) return;
        
        // Throttle updates to prevent performance issues
        if ((this.gameState.gameTime += delta) < 1) return;
        this.gameState.gameTime = 0;

        try {
            const vehicles = this.managers.vehicle.getVehicles();
            let hasUpdates = false;
            
            vehicles.forEach(vehicle => {
                if (vehicle.status === 'running' && vehicle.routeId) {
                    const route = this.managers.route.getRouteById(vehicle.routeId);
                    if (route) {
                        const { profit, fuelConsumed, conditionWear } = this.managers.economy.calculateTick(vehicle, route, 1);
                        
                        const updatedVehicle = this.managers.vehicle.updateVehicleState(vehicle.id, -fuelConsumed, -conditionWear, profit);
                        
                        if (updatedVehicle && updatedVehicle.status === 'running') {
                            this.managers.economy.addCash(profit);
                            this.managers.economy.updateDailyProfit(profit);
                            hasUpdates = true;
                        } else if (updatedVehicle && updatedVehicle.status !== 'running') {
                            // Handle breakdown
                            if (this.components.driverMessages) {
                                this.components.driverMessages.showMessage(
                                    updatedVehicle.name,
                                    `Vehicle ${updatedVehicle.status === 'breakdown' ? 'broke down' : 'ran out of fuel'}! Need immediate attention.`,
                                    'error'
                                );
                            }
                            hasUpdates = true;
                        }
                    }
                }
            });
            
            // Update systems
            if (this.managers.weather) {
                this.managers.weather.update(delta);
            }
            
            if (this.managers.event) {
                this.managers.event.update(delta);
            }
            
            // Only update UI if there were actual changes
            if (hasUpdates) {
                if (this.components.dashboard) {
                    this.components.dashboard.update();
                }
            }
            
            // Always update map and driver messages (they have their own throttling)
            if (this.components.map) {
                this.components.map.updateVehiclePositions();
            }
            
            if (this.components.driverMessages) {
                this.components.driverMessages.update();
            }
        } catch (error) {
            console.error('Error in game update loop:', error);
        }
    }

    assignVehicleToRoute(vehicleId, routeId) {
        try {
            const vehicle = this.managers.vehicle.getVehicleById(vehicleId);
            const route = this.managers.route.getRouteById(routeId);
            
            if (!vehicle || !route) {
                console.error('Vehicle or route not found');
                return;
            }
            
            // Update vehicle
            vehicle.routeId = routeId;
            vehicle.status = 'running';
            
            // Update route
            if (!route.assignedVehicles) {
                route.assignedVehicles = [];
            }
            if (!route.assignedVehicles.includes(vehicleId)) {
                route.assignedVehicles.push(vehicleId);
            }
            
            if (this.components.dashboard) {
                this.components.dashboard.showToast(`${vehicle.name} assigned to ${route.name}`, 'success');
                this.components.dashboard.update();
            }
            
            console.log(`✅ Vehicle ${vehicleId} assigned to route ${routeId}`);
        } catch (error) {
            console.error('Error assigning vehicle:', error);
        }
    }

    unassignVehicleFromRoute(vehicleId, routeId) {
        try {
            const vehicle = this.managers.vehicle.getVehicleById(vehicleId);
            const route = this.managers.route.getRouteById(routeId);
            
            if (!vehicle) {
                console.error('Vehicle not found');
                return;
            }
            
            // Update vehicle
            vehicle.routeId = null;
            vehicle.status = 'idle';
            
            // Update route
            if (route && route.assignedVehicles) {
                route.assignedVehicles = route.assignedVehicles.filter(id => id !== vehicleId);
            }
            
            if (this.components.dashboard) {
                this.components.dashboard.showToast(`${vehicle.name} unassigned from route`, 'info');
                this.components.dashboard.update();
            }
            
            console.log(`✅ Vehicle ${vehicleId} unassigned from route`);
        } catch (error) {
            console.error('Error unassigning vehicle:', error);
        }
    }

    // Save/Load system
    saveGame() {
        if (!this.managers.economy) return;
        
        const gameData = {
            player: this.managers.economy.getPlayerState(),
            vehicles: this.managers.vehicle.getVehicles(),
            nextVehicleId: this.managers.vehicle.getNextVehicleId(),
            customRoutes: this.managers.route.getCustomRoutes(),
            currentWeather: this.managers.weather ? this.managers.weather.getCurrentWeather() : 'sunny',
            timestamp: Date.now()
        };
        
        localStorage.setItem('matatuEmpireGameState', JSON.stringify(gameData));
        
        if (this.components.dashboard) {
            this.components.dashboard.showToast('Game saved successfully!', 'success');
        }
        
        console.log('Game saved:', gameData);
    }

    loadGame() {
        try {
            const savedData = localStorage.getItem('matatuEmpireGameState');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Load player state
                this.gameState.player = {
                    cash: data.player?.cash || 50000,
                    reputation: data.player?.reputation || 50,
                    dailyProfit: data.player?.dailyProfit || 0,
                    totalEarningsAllTime: data.player?.totalEarningsAllTime || 0,
                    businessStartDate: data.player?.businessStartDate || Date.now(),
                };
                
                // Load vehicles and ensure they have nicknames
                this.gameState.vehicles = (data.vehicles || []).map(vehicle => {
                    if (!vehicle.nickname) {
                        vehicle.nickname = this.generateDefaultNickname(vehicle.name);
                    }
                    return vehicle;
                });
                
                this.gameState.nextVehicleId = data.nextVehicleId || 1;
                this.gameState.customRoutes = data.customRoutes || [];
                
                // Update managers
                this.managers.economy.player = this.gameState.player;
                this.managers.vehicle.initializeVehicles(this.gameState.vehicles);
                this.managers.vehicle.nextVehicleId = this.gameState.nextVehicleId;
                this.managers.route.initializeCustomRoutes(this.gameState.customRoutes);
                
                console.log('Game loaded successfully with vehicle nicknames:', {
                    cash: this.gameState.player.cash,
                    vehicles: this.gameState.vehicles.length,
                    customRoutes: this.gameState.customRoutes.length
                });
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        
        this.initNewGame();
        return false;
    }

    initNewGame() {
        console.log("🆕 Initializing a new game...");
        
        // Reset game state
        this.gameState = {
            player: {
                cash: 50000,
                reputation: 50,
                dailyProfit: 0,
                totalEarningsAllTime: 0,
                businessStartDate: Date.now(),
            },
            vehicles: [],
            nextVehicleId: 1,
            customRoutes: [],
            gameTime: 0,
        };
        
        // Start with one basic matatu with nickname
        const startingVehicle = {
            id: this.gameState.nextVehicleId++,
            typeId: "matatu_old",
            name: "Old Reliable",
            nickname: "OR", // Default nickname
            fuel: 100,
            condition: 80,
            routeId: null,
            status: 'idle',
            passengers: 0,
            totalEarnings: 0
        };
        
        this.gameState.vehicles.push(startingVehicle);
        
        // Update managers with new game data
        if (this.managers.economy) {
            this.managers.economy.player = this.gameState.player;
        }
        
        if (this.managers.vehicle) {
            this.managers.vehicle.initializeVehicles(this.gameState.vehicles);
            this.managers.vehicle.nextVehicleId = this.gameState.nextVehicleId;
        }
        
        if (this.managers.route) {
            this.managers.route.initializeCustomRoutes(this.gameState.customRoutes);
        }
        
        console.log("✅ New game initialized with starting vehicle:", startingVehicle);
    }

    resetGame() {
        if (confirm('Are you sure you want to reset your game? This will delete all progress!')) {
            localStorage.removeItem('matatuEmpireGameState');
            window.location.reload();
        }
    }

    handleInitializationError(error) {
        console.error('Game initialization failed:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 9999;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Game Failed to Load</h3>
            <p>Please refresh the page and try again.</p>
            <p>Error: ${error.message}</p>
        `;
        document.body.appendChild(errorDiv);
    }

    handleRuntimeError(error) {
        console.error('Runtime error handled:', error);
        if (this.components.dashboard) {
            this.components.dashboard.showToast('An error occurred. Game auto-saving...', 'error');
            setTimeout(() => this.saveGame(), 1000);
        }
    }

    generateDefaultNickname(fullName) {
        const words = fullName.split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
        } else {
            return fullName.substring(0, 3).toUpperCase();
        }
    }

    debugUIState() {
        console.log('🔍 UI Debug Info:');
        console.log('Dashboard container:', this.components.dashboard?.dashboardContainer);
        console.log('Fleet container:', this.components.dashboard?.fleetContainer);
        console.log('Route details container:', this.components.dashboard?.routeDetailsContainer);
        console.log('Vehicles:', this.managers.vehicle?.getVehicles()?.length);
        console.log('Routes:', this.getAllRoutes()?.length);
        console.log('Game initialized:', this.isInitialized);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Setup orientation handling first
    setupOrientationHandling();
    
    // Then initialize the game
    const game = new Game();
    game.init();
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    if (window.gameInstance && window.gameInstance.isInitialized) {
        e.preventDefault();
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
    }
});