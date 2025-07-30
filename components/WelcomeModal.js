export class WelcomeModal {
    constructor(game) {
        this.game = game;
        this.modal = document.getElementById('welcome-modal');
        this.content = this.modal.querySelector('.modal-content');
        this.isNewPlayer = true;
        
        this.tips = [
            {
                title: "💡 Route Management",
                content: "Click on different routes to compare their profitability. Some routes earn more but may have higher fuel costs!",
                icon: "🗺️"
            },
            {
                title: "💡 Vehicle Maintenance", 
                content: "Keep your vehicles above 70% condition. Poor condition means fewer passengers and higher fuel consumption!",
                icon: "🔧"
            },
            {
                title: "💡 Weather Strategies",
                content: "Rainy weather brings more passengers but increases breakdown risk. Sunny days are perfect for long routes!",
                icon: "🌦️"
            },
            {
                title: "💡 Fleet Expansion",
                content: "Buy different vehicle types strategically. Larger vehicles earn more but cost more to maintain!",
                icon: "🚌"
            },
            {
                title: "💡 Route Creation",
                content: "Use the 'Create Route' button to build custom routes between city points for maximum profit!",
                icon: "✏️"
            },
            {
                title: "💡 Economic Strategy",
                content: "Monitor your daily profit. If it's negative, consider unassigning vehicles from unprofitable routes!",
                icon: "📊"
            }
        ];
    }

    show(isNewPlayer = true) {
        this.isNewPlayer = isNewPlayer;
        this.renderContent();
        this.modal.classList.remove('hidden');
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    renderContent() {
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        
        this.content.innerHTML = `
            <div style="position: relative;">
                <button onclick="window.gameInstance.components.welcomeModal.hide()" 
                        style="position: absolute; top: -10px; right: -10px; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 1.2rem; z-index: 10;">×</button>
                
                <div class="welcome-content">
                    ${this.isNewPlayer ? this.renderNewPlayerContent() : this.renderReturningPlayerContent(randomTip)}
                </div>
            </div>
        `;
    }

    renderNewPlayerContent() {
        return `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🚌</div>
                <h1 style="color: var(--primary-color); margin-bottom: 0.5rem; font-size: 2.2rem;">Welcome to Matatu Empire!</h1>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">Build your public transport empire in Kenya</p>
            </div>

            <div style="background: linear-gradient(135deg, var(--bg-light), var(--bg-dark)); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid var(--border-color);">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center;">🚀 Quick Start Guide</h2>
                <ol style="color: var(--text-primary); font-size: 1rem; line-height: 1.6; padding-left: 0; list-style: none; counter-reset: step-counter;">
                    <li style="counter-increment: step-counter; margin-bottom: 1rem; padding-left: 2rem; position: relative;">
                        <span style="position: absolute; left: 0; top: 0; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">1</span>
                        <strong>🗺️ Choose a Route:</strong> Click on a route on the map to see its details
                    </li>
                    <li style="counter-increment: step-counter; margin-bottom: 1rem; padding-left: 2rem; position: relative;">
                        <span style="position: absolute; left: 0; top: 0; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">2</span>
                        <strong>✅ Assign Vehicle:</strong> Put "Old Reliable" to work on the route
                    </li>
                    <li style="counter-increment: step-counter; margin-bottom: 1rem; padding-left: 2rem; position: relative;">
                        <span style="position: absolute; left: 0; top: 0; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">3</span>
                        <strong>💰 Earn & Expand:</strong> Watch profits roll in and buy more vehicles
                    </li>
                    <li style="counter-increment: step-counter; margin-bottom: 0; padding-left: 2rem; position: relative;">
                        <span style="position: absolute; left: 0; top: 0; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">4</span>
                        <strong>🏆 Build Empire:</strong> Create custom routes and dominate the city!
                    </li>
                </ol>
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h3 style="color: var(--secondary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>💡</span> Pro Tip
                </h3>
                <p style="color: var(--text-secondary); margin: 0; line-height: 1.5;">
                    Start with the <strong style="color: var(--primary-color);">Downtown > Industrial</strong> route - 
                    it's profitable and has low risk, perfect for beginners!
                </p>
            </div>

            <div style="text-align: center;">
                <button onclick="window.gameInstance.components.welcomeModal.hide()" 
                        style="background: var(--primary-color); color: var(--bg-dark); border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1.1rem; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                    🚀 Start Building My Empire!
                </button>
            </div>
        `;
    }

    renderReturningPlayerContent(tip) {
        const playerState = this.game.managers.economy.getPlayerState();
        const vehicles = this.game.managers.vehicle.getVehicles();
        const activeVehicles = vehicles.filter(v => v.status === 'running').length;
        
        return `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h1 style="color: var(--primary-color); margin-bottom: 0.5rem;">Welcome Back, Boss!</h1>
                <p style="color: var(--text-secondary);">Your matatu empire awaits your return</p>
            </div>

            <div style="background: linear-gradient(135deg, var(--bg-light), var(--bg-dark)); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid var(--border-color);">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center;">📊 Empire Status</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center; padding: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">💰</div>
                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Cash</div>
                        <div style="color: var(--primary-color); font-weight: bold;">Ksh ${playerState.cash.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; padding: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">🚐</div>
                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Fleet</div>
                        <div style="color: var(--secondary-color); font-weight: bold;">${vehicles.length} vehicles</div>
                    </div>
                    <div style="text-align: center; padding: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">🏃</div>
                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Active</div>
                        <div style="color: var(--info-color); font-weight: bold;">${activeVehicles} running</div>
                    </div>
                </div>
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h3 style="color: var(--secondary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${tip.icon}</span> ${tip.title}
                </h3>
                <p style="color: var(--text-secondary); margin: 0; line-height: 1.5;">
                    ${tip.content}
                </p>
            </div>

            <div style="text-align: center;">
                <button onclick="window.gameInstance.components.welcomeModal.hide()" 
                        style="background: var(--primary-color); color: var(--bg-dark); border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1.1rem; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                    💼 Continue Managing Empire
                </button>
            </div>
        `;
    }
}