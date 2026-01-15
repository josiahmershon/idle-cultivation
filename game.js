// ===== GAME STATE =====
const Game = {
    // Core Resources
    daoMarks: 0,
    qi: 0,
    maxQi: 100,
    insight: 0,
    prestige: 0,

    // Production Stats
    qiPerClick: 1,
    qiPerSecond: 0,
    marksPerClick: 0,
    marksPerSecond: 0,
    insightPerSecond: 0,
    tributePerSecond: 0,
    refineBonus: 0,
    refineCostReduction: 0,

    // Multipliers
    globalMultiplier: 1,
    qiMultiplier: 1,
    markMultiplier: 1,

    // Progression
    phase: 1,
    realm: 'Qi Condensation',
    totalMarksProduced: 0,
    totalClicks: 0,

    // Upgrades purchased
    upgrades: {},

    // Techniques unlocked
    techniques: {},

    // Actions
    actions: {},

    // Settings
    autosaveEnabled: true,
    soundEnabled: true,

    // Timing
    lastTick: Date.now(),
    lastSave: 0,
    gameStartTime: Date.now()
};

// ===== UPGRADE DEFINITIONS =====
const UPGRADES = {
    // Tier 0 - Very Early (Dao Mark upgrades)
    focusedBreathing: {
        id: 'focusedBreathing',
        name: 'Focused Breathing',
        description: 'Concentrate on each breath. Quality over quantity.',
        effect: '+1 Qi per click',
        baseCost: { daoMarks: 5 },
        maxLevel: 5,
        costMultiplier: 2,
        apply: (game, level) => {
            game.qiPerClick = 1 + level;
        }
    },

    manualRefinement: {
        id: 'manualRefinement',
        name: 'Manual Refinement',
        description: 'Learn to compress Qi into Dao Marks more efficiently.',
        effect: 'Refine Qi action gives +1 extra Dao Mark',
        baseCost: { daoMarks: 10 },
        maxLevel: 3,
        costMultiplier: 3,
        apply: (game, level) => {
            game.refineBonus = level;
        }
    },

    mentalClarity: {
        id: 'mentalClarity',
        name: 'Mental Clarity',
        description: 'A clear mind optimizes the breathing cycle.',
        effect: 'Reduce Refine Qi cost by 1',
        baseCost: { daoMarks: 15 },
        maxLevel: 3,
        costMultiplier: 2,
        apply: (game, level) => {
            game.refineCostReduction = level;
        }
    },

    // Tier 1 - Basic
    meridianDredging: {
        id: 'meridianDredging',
        name: 'Meridian Dredging',
        description: 'The pathways are clogged with mortal filth. Force them open with jagged Qi.',
        effect: '+1 Dao Mark per click',
        baseCost: { qi: 50 },
        maxLevel: 5,
        costMultiplier: 2,
        apply: (game, level) => {
            game.marksPerClick = level;
        }
    },

    breathingRhythm: {
        id: 'breathingRhythm',
        name: 'Breathing Rhythm',
        description: 'Establish a steady rhythm. The body remembers the pattern.',
        effect: '+0.5 Qi/sec',
        baseCost: { qi: 30, daoMarks: 10 },
        maxLevel: 5,
        costMultiplier: 1.8,
        apply: (game, level) => {
            game.qiPerSecond += level * 0.5;
        }
    },

    dantianExpansion: {
        id: 'dantianExpansion',
        name: 'Dantian Expansion',
        description: 'The Sea of Qi is a cup. Smash the cup. Make it a lake.',
        effect: '+50 Max Qi per level',
        baseCost: { qi: 80 },
        maxLevel: 10,
        costMultiplier: 1.5,
        apply: (game, level) => {
            game.maxQi = 100 + (level * 50);
        }
    },

    qiCompression: {
        id: 'qiCompression',
        name: 'Qi Compression',
        description: 'Compress Qi into denser forms. More output per breath.',
        effect: '+2 Qi per click',
        baseCost: { qi: 100, daoMarks: 25 },
        maxLevel: 3,
        costMultiplier: 2,
        apply: (game, level) => {
            game.qiPerClick += level * 2;
        }
    },

    autonomicCycling: {
        id: 'autonomicCycling',
        name: 'Autonomic Cycling',
        description: 'Conscious breathing is inefficient. Delegate the task to the spinal cord.',
        effect: 'Unlocks automatic Qi generation: +2 Qi/sec',
        baseCost: { qi: 200, daoMarks: 50 },
        maxLevel: 1,
        costMultiplier: 1,
        apply: (game, level) => {
            if (level >= 1) {
                game.qiPerSecond += 2;
            }
        }
    },

    // Tier 2 - Intermediate
    ironSkinChant: {
        id: 'ironSkinChant',
        name: 'Iron Skin Chant',
        description: 'Nerve endings are unnecessary sensors. Calcify the dermis.',
        effect: '+5% global production',
        baseCost: { qi: 1000 },
        maxLevel: 5,
        costMultiplier: 2.5,
        requires: { autonomicCycling: 1 },
        apply: (game, level) => {
            game.globalMultiplier += level * 0.05;
        }
    },

    goldenMarrowInjection: {
        id: 'goldenMarrowInjection',
        name: 'Golden Marrow Injection',
        description: 'Bone marrow produces weak blood. Replace it with molten gold essence.',
        effect: '2x Dao Mark production',
        baseCost: { qi: 5000, daoMarks: 100 },
        maxLevel: 3,
        costMultiplier: 5,
        requires: { ironSkinChant: 1 },
        apply: (game, level) => {
            game.markMultiplier *= Math.pow(2, level);
        }
    },

    fiveVisceraRemoval: {
        id: 'fiveVisceraRemoval',
        name: 'Five-Viscera Removal',
        description: 'Digestion wastes energy. Photosynthesize Qi directly.',
        effect: 'Qi generation +10/sec',
        baseCost: { qi: 10000, daoMarks: 500 },
        maxLevel: 1,
        costMultiplier: 1,
        requires: { goldenMarrowInjection: 1 },
        apply: (game, level) => {
            if (level >= 1) {
                game.qiPerSecond += 10;
            }
        }
    },

    // Tier 3 - Advanced
    voidPulseHeart: {
        id: 'voidPulseHeart',
        name: 'Void-Pulse Heart',
        description: 'The heart beats too slowly. Install a rhythmic void-pump.',
        effect: 'Qi generation x10',
        baseCost: { qi: 50000, daoMarks: 2000 },
        maxLevel: 1,
        costMultiplier: 1,
        requires: { fiveVisceraRemoval: 1 },
        apply: (game, level) => {
            if (level >= 1) {
                game.qiPerSecond *= 10;
            }
        }
    },

    divineSenseAwakening: {
        id: 'divineSenseAwakening',
        name: 'Divine Sense Awakening',
        description: 'Expand consciousness beyond the flesh. See the threads of causality.',
        effect: 'Unlocks Insight generation',
        baseCost: { daoMarks: 1000 },
        maxLevel: 1,
        costMultiplier: 1,
        requires: { voidPulseHeart: 1 },
        apply: (game, level) => {
            if (level >= 1) {
                game.insightPerSecond = 0.1;
                document.getElementById('insight-container').classList.remove('hidden');
                document.getElementById('stats-group').classList.remove('hidden');
                addLog('Your consciousness expands. You begin to perceive the underlying patterns.');
            }
        }
    }
};

// ===== ACTIONS =====
const ACTIONS = {
    refineQi: {
        id: 'refineQi',
        name: 'Refine Qi → Dao Marks',
        description: 'Manually compress and crystallize your Qi into permanent Dao Marks.',
        getCost: (game) => {
            return { qi: Math.max(1, 10 - game.refineCostReduction) };
        },
        getEffect: (game) => {
            return `+${1 + game.refineBonus} Dao Mark${1 + game.refineBonus > 1 ? 's' : ''}`;
        },
        cooldown: 0,
        execute: (game) => {
            const cost = Math.max(1, 10 - game.refineCostReduction);
            if (game.qi >= cost) {
                game.qi -= cost;
                const marksGained = 1 + game.refineBonus;
                game.daoMarks += marksGained;
                game.totalMarksProduced += marksGained;
                return true;
            }
            return false;
        }
    },

    cultivateFace: {
        id: 'cultivateFace',
        name: 'Cultivate Face',
        description: 'Manifest a miracle to awe the mortals. Costs Qi, increases Prestige.',
        cost: { qi: 100 },
        effect: '+10 Face',
        cooldown: 5000,
        lastUsed: 0,
        requires: { divineSenseAwakening: 1 },
        execute: (game) => {
            const now = Date.now();
            if (game.qi >= 100 && now - (ACTIONS.cultivateFace.lastUsed || 0) >= 5000) {
                game.qi -= 100;
                game.prestige += 10;
                ACTIONS.cultivateFace.lastUsed = now;
                addLog('You part the clouds with a gesture. The villagers below prostrate themselves.');
                document.getElementById('prestige-container').classList.remove('hidden');
                document.getElementById('actions-section').classList.remove('hidden');
                return true;
            }
            return false;
        }
    }
};

// ===== TECHNIQUES (Research Projects) =====
const TECHNIQUES = {
    breathControl: {
        id: 'breathControl',
        name: 'Sutra of Eternal Breath',
        description: 'A meditation on the cyclical nature of respiration.',
        cost: { insight: 10 },
        effect: '+50% Qi generation',
        requires: { divineSenseAwakening: 1 },
        apply: (game) => {
            game.qiPerSecond *= 1.5;
            addLog('Understanding flows through you. Your breath becomes endless.');
        }
    }
};

// ===== SYSTEM LOG =====
const LOG_ENTRIES = [
    "The Qi in this cave is thin. I must breathe 10,000 times to condense a single drop of liquid mana. It is honest work.",
    "Each breath pulls fragments of the Dao closer. The process is manual. Tedious. Necessary.",
    "My meridians ache. The pathway from breath to power is inefficient. I must optimize.",
    "The villagers speak of a hermit in the mountain. They do not understand. I am not hiding. I am iterating.",
    "I have begun to view my body as a machine. Each organ: a component. Each cell: a subroutine.",
    "The path to immortality is paved with incremental gains. One breath at a time. One mark at a time.",
    "Today I forced my meridians open. The pain was irrelevant. The throughput increased 100%.",
    "I no longer need to focus on breathing. My spinal cord handles the calculation. My mind is free for higher functions.",
    "The magistrate sent tribute. He thinks I am divine. I am merely efficient.",
    "My disciples ask why I do not sleep. Sleep is a bug in mortal firmware. I have patched it out."
];

let logIndex = 0;

function addLog(message) {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = 'log-entry new';

    const timestamp = document.createElement('span');
    timestamp.className = 'log-timestamp';
    const elapsed = Math.floor((Date.now() - Game.gameStartTime) / 1000);
    timestamp.textContent = `[${elapsed}s]`;

    const text = document.createElement('span');
    text.textContent = message;

    entry.appendChild(timestamp);
    entry.appendChild(text);

    logContent.insertBefore(entry, logContent.firstChild);

    // Keep only last 20 entries
    while (logContent.children.length > 20) {
        logContent.removeChild(logContent.lastChild);
    }

    // Remove 'new' class after animation
    setTimeout(() => entry.classList.remove('new'), 500);
}

function addRandomLog() {
    if (logIndex < LOG_ENTRIES.length) {
        addLog(LOG_ENTRIES[logIndex]);
        logIndex++;
    }
}

// ===== CORE GAME LOGIC =====

function canAfford(cost) {
    if (cost.qi && Game.qi < cost.qi) return false;
    if (cost.daoMarks && Game.daoMarks < cost.daoMarks) return false;
    if (cost.insight && Game.insight < cost.insight) return false;
    return true;
}

function spendResources(cost) {
    if (cost.qi) Game.qi -= cost.qi;
    if (cost.daoMarks) Game.daoMarks -= cost.daoMarks;
    if (cost.insight) Game.insight -= cost.insight;
}

function calculateUpgradeCost(upgrade, currentLevel) {
    const cost = {};
    for (let [resource, baseAmount] of Object.entries(upgrade.baseCost)) {
        cost[resource] = Math.floor(baseAmount * Math.pow(upgrade.costMultiplier, currentLevel));
    }
    return cost;
}

function canBuyUpgrade(upgrade) {
    const currentLevel = Game.upgrades[upgrade.id] || 0;
    if (currentLevel >= upgrade.maxLevel) return false;

    // Check requirements
    if (upgrade.requires) {
        for (let [reqId, reqLevel] of Object.entries(upgrade.requires)) {
            if ((Game.upgrades[reqId] || 0) < reqLevel) return false;
        }
    }

    const cost = calculateUpgradeCost(upgrade, currentLevel);
    return canAfford(cost);
}

function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return false;

    if (!canBuyUpgrade(upgrade)) return false;

    const currentLevel = Game.upgrades[upgradeId] || 0;
    const cost = calculateUpgradeCost(upgrade, currentLevel);

    spendResources(cost);
    Game.upgrades[upgradeId] = currentLevel + 1;

    // Log the purchase
    addLog(`Purchased: ${upgrade.name} (Level ${Game.upgrades[upgradeId]})`);

    recalculateStats();
    updateUI();
    renderUpgrades();

    return true;
}

function recalculateStats() {
    // Reset to base values
    Game.qiPerClick = 1;
    Game.qiPerSecond = 0;
    Game.marksPerSecond = 0;
    Game.marksPerClick = 0;
    Game.globalMultiplier = 1;
    Game.qiMultiplier = 1;
    Game.markMultiplier = 1;
    Game.refineBonus = 0;
    Game.refineCostReduction = 0;

    // Apply all upgrades
    for (let [upgradeId, level] of Object.entries(Game.upgrades)) {
        const upgrade = UPGRADES[upgradeId];
        if (upgrade && upgrade.apply) {
            upgrade.apply(Game, level);
        }
    }

    // Apply techniques
    for (let techniqueId of Object.keys(Game.techniques)) {
        const technique = TECHNIQUES[techniqueId];
        if (technique && technique.apply) {
            technique.apply(Game);
        }
    }

    // Apply multipliers
    Game.qiPerSecond *= Game.qiMultiplier * Game.globalMultiplier;
    Game.marksPerSecond *= Game.markMultiplier * Game.globalMultiplier;
    Game.marksPerClick *= Game.markMultiplier * Game.globalMultiplier;

    // Tribute from prestige
    if (Game.prestige > 0) {
        Game.tributePerSecond = Math.floor(Game.prestige / 10);
        Game.qiPerSecond += Game.tributePerSecond;
    }
}

// ===== CULTIVATION (CLICKING) =====
function cultivate() {
    Game.totalClicks++;

    // Generate Qi
    const qiGained = Game.qiPerClick;
    Game.qi = Math.min(Game.qi + qiGained, Game.maxQi);

    // Generate Dao Marks if unlocked
    if (Game.marksPerClick > 0) {
        const marksGained = Game.marksPerClick;
        Game.daoMarks += marksGained;
        Game.totalMarksProduced += marksGained;
    }

    // Visual feedback
    const enso = document.querySelector('.enso');
    enso.classList.add('pulse');
    setTimeout(() => enso.classList.remove('pulse'), 500);

    // Random log every 50 clicks
    if (Game.totalClicks % 50 === 0) {
        addRandomLog();
    }

    updateUI();
}

// ===== GAME LOOP =====
function gameTick() {
    const now = Date.now();
    const deltaTime = (now - Game.lastTick) / 1000; // seconds
    Game.lastTick = now;

    // Generate resources per second
    const qiGenerated = Game.qiPerSecond * deltaTime;
    Game.qi = Math.min(Game.qi + qiGenerated, Game.maxQi);

    const marksGenerated = Game.marksPerSecond * deltaTime;
    if (marksGenerated > 0) {
        Game.daoMarks += marksGenerated;
        Game.totalMarksProduced += marksGenerated;
    }

    const insightGenerated = Game.insightPerSecond * deltaTime;
    if (insightGenerated > 0) {
        Game.insight += insightGenerated;
    }

    updateUI();

    // Check for phase transitions
    checkPhaseTransition();
}

function checkPhaseTransition() {
    if (Game.phase === 1 && Game.totalMarksProduced >= 10000) {
        // Ready for Phase II transition (not implemented yet)
        // For now, just log it
        if (!Game.phase2Warning) {
            addLog('The vessel is perfected. The next step beckons: a Sect to command.');
            Game.phase2Warning = true;
        }
    }
}

// ===== UI UPDATES =====
function updateUI() {
    // Resources
    document.getElementById('dao-marks').textContent = formatNumber(Game.daoMarks);
    document.getElementById('qi-current').textContent = formatNumber(Game.qi);
    document.getElementById('qi-max').textContent = formatNumber(Game.maxQi);
    document.getElementById('insight').textContent = formatNumber(Game.insight, 1);
    document.getElementById('prestige').textContent = formatNumber(Game.prestige);

    // Production stats
    document.getElementById('marks-per-sec').textContent = formatNumber(Game.marksPerSecond, 2);
    document.getElementById('qi-per-click').textContent = formatNumber(Game.qiPerClick, 1);

    // Realm
    document.getElementById('realm-display').textContent = Game.realm;

    // Update button text based on progression
    updateButtonText();
}

function updateButtonText() {
    const btnText = document.getElementById('btn-text');
    const btnSubtext = document.getElementById('btn-subtext');

    if (Game.marksPerClick > 0) {
        btnText.textContent = '道';
        btnSubtext.textContent = 'Cultivate';
    } else {
        btnText.textContent = '吸';
        btnSubtext.textContent = 'Breathe';
    }
}

function formatNumber(num, decimals = 0) {
    if (num < 1000) {
        return num.toFixed(decimals);
    } else if (num < 1000000) {
        return (num / 1000).toFixed(1) + 'K';
    } else if (num < 1000000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num < 1000000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else {
        return (num / 1000000000000).toFixed(1) + 'T';
    }
}

// ===== RENDER UPGRADES =====
function renderUpgrades() {
    const upgradesList = document.getElementById('upgrades-list');
    upgradesList.innerHTML = '';

    for (let upgrade of Object.values(UPGRADES)) {
        const currentLevel = Game.upgrades[upgrade.id] || 0;

        // Check if upgrade should be visible
        let visible = true;
        if (upgrade.requires) {
            for (let [reqId, reqLevel] of Object.entries(upgrade.requires)) {
                if ((Game.upgrades[reqId] || 0) < reqLevel) {
                    visible = false;
                    break;
                }
            }
        }

        if (!visible) continue;

        const item = document.createElement('div');
        item.className = 'upgrade-item';

        const canBuy = canBuyUpgrade(upgrade);
        const maxed = currentLevel >= upgrade.maxLevel;

        if (!canBuy || maxed) {
            item.classList.add('locked');
        }

        const cost = calculateUpgradeCost(upgrade, currentLevel);
        const costText = Object.entries(cost)
            .map(([resource, amount]) => `${formatNumber(amount)} ${resource}`)
            .join(', ');

        item.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name} ${currentLevel > 0 ? `(${currentLevel}/${upgrade.maxLevel})` : ''}</span>
                <span class="upgrade-cost">${maxed ? 'MAX' : costText}</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-effect">${upgrade.effect}</div>
        `;

        if (canBuy && !maxed) {
            item.addEventListener('click', () => buyUpgrade(upgrade.id));
        }

        upgradesList.appendChild(item);
    }
}

function renderActions() {
    const actionsList = document.getElementById('actions-list');
    actionsList.innerHTML = '';

    // Always show actions section if there are any actions to show
    let hasVisibleActions = false;

    for (let action of Object.values(ACTIONS)) {
        // Check requirements
        if (action.requires) {
            let visible = true;
            for (let [reqId, reqLevel] of Object.entries(action.requires)) {
                if ((Game.upgrades[reqId] || 0) < reqLevel) {
                    visible = false;
                    break;
                }
            }
            if (!visible) continue;
        }

        hasVisibleActions = true;

        const item = document.createElement('div');
        item.className = 'action-item';

        // Get dynamic cost and effect if functions exist
        const cost = action.getCost ? action.getCost(Game) : action.cost;
        const effect = action.getEffect ? action.getEffect(Game) : action.effect;

        const canUse = canAfford(cost);
        if (!canUse) {
            item.classList.add('locked');
        }

        const costText = Object.entries(cost)
            .map(([resource, amount]) => `${formatNumber(amount)} ${resource}`)
            .join(', ');

        item.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${action.name}</span>
                <span class="upgrade-cost">${costText}</span>
            </div>
            <div class="upgrade-description">${action.description}</div>
            <div class="upgrade-effect">${effect}</div>
        `;

        if (canUse) {
            item.addEventListener('click', () => {
                if (action.execute(Game)) {
                    updateUI();
                    renderActions();
                }
            });
        }

        actionsList.appendChild(item);
    }

    // Show/hide actions section
    if (hasVisibleActions) {
        document.getElementById('actions-section').classList.remove('hidden');
    }
}

function renderTechniques() {
    const techniquesList = document.getElementById('techniques-list');
    techniquesList.innerHTML = '';

    for (let technique of Object.values(TECHNIQUES)) {
        // Check requirements
        if (technique.requires) {
            let visible = true;
            for (let [reqId, reqLevel] of Object.entries(technique.requires)) {
                if ((Game.upgrades[reqId] || 0) < reqLevel) {
                    visible = false;
                    break;
                }
            }
            if (!visible) continue;
        }

        // Skip if already researched
        if (Game.techniques[technique.id]) continue;

        document.getElementById('techniques-section').classList.remove('hidden');

        const item = document.createElement('div');
        item.className = 'technique-item';

        const canResearch = canAfford(technique.cost);
        if (!canResearch) {
            item.classList.add('locked');
        }

        const costText = Object.entries(technique.cost)
            .map(([resource, amount]) => `${formatNumber(amount)} ${resource}`)
            .join(', ');

        item.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${technique.name}</span>
                <span class="upgrade-cost">${costText}</span>
            </div>
            <div class="upgrade-description">${technique.description}</div>
            <div class="upgrade-effect">${technique.effect}</div>
        `;

        if (canResearch) {
            item.addEventListener('click', () => {
                spendResources(technique.cost);
                Game.techniques[technique.id] = true;
                technique.apply(Game);
                recalculateStats();
                updateUI();
                renderTechniques();
            });
        }

        techniquesList.appendChild(item);
    }
}

// ===== SAVE/LOAD =====
function saveGame() {
    const saveData = {
        version: 1,
        game: Game,
        timestamp: Date.now()
    };

    localStorage.setItem('daoOfZeroSave', JSON.stringify(saveData));
    Game.lastSave = Date.now();

    document.getElementById('autosave-indicator').textContent =
        `Last saved: ${new Date().toLocaleTimeString()}`;

    addLog('Progress saved.');
}

function loadGame() {
    const saveData = localStorage.getItem('daoOfZeroSave');
    if (!saveData) return false;

    try {
        const data = JSON.parse(saveData);
        Object.assign(Game, data.game);

        // Recalculate derived stats
        recalculateStats();

        addLog('Progress loaded. The cycle continues.');
        return true;
    } catch (e) {
        console.error('Failed to load save:', e);
        return false;
    }
}

function resetGame() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem('daoOfZeroSave');
        location.reload();
    }
}

function exportSave() {
    const saveData = localStorage.getItem('daoOfZeroSave');
    if (!saveData) {
        alert('No save data found!');
        return;
    }

    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dao-of-zero-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const saveData = event.target.result;
                localStorage.setItem('daoOfZeroSave', saveData);
                location.reload();
            } catch (e) {
                alert('Failed to import save file!');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== INITIALIZATION =====
function init() {
    // Load saved game
    const loaded = loadGame();
    if (!loaded) {
        addLog('You open your eyes in a dark cave. The air is thin. The path begins here.');
    }

    // Set up event listeners
    document.getElementById('cultivate-btn').addEventListener('click', cultivate);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-modal').classList.remove('hidden');
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        document.getElementById('settings-modal').classList.add('hidden');
    });
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('export-save-btn').addEventListener('click', exportSave);
    document.getElementById('import-save-btn').addEventListener('click', importSave);

    // Initial render
    recalculateStats();
    updateUI();
    renderUpgrades();
    renderActions();
    renderTechniques();

    // Start game loop (10 FPS)
    setInterval(gameTick, 100);

    // Render loop (to update UI for available upgrades)
    setInterval(() => {
        renderUpgrades();
        renderActions();
        renderTechniques();
    }, 500);

    // Autosave every 30 seconds
    setInterval(() => {
        if (Game.autosaveEnabled) {
            saveGame();
        }
    }, 30000);

    console.log('The Dao of Zero initialized. The optimization begins.');
}

// Start the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
