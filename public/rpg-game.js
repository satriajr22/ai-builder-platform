const BLUE_PLAYERS = [
  { id: 'astra', name: 'Astra', role: 'Mage', side: 'player', archetype: 'mage' },
  { id: 'brann', name: 'Brann', role: 'Knight', side: 'player', archetype: 'warrior' },
  { id: 'lyra', name: 'Lyra', role: 'Ranger', side: 'player', archetype: 'ranger' },
];

const RED_PLAYERS = [
  { id: 'vex', name: 'Vex', role: 'Berserker', side: 'enemy', archetype: 'berserker' },
  { id: 'mira', name: 'Mira', role: 'Witch', side: 'enemy', archetype: 'witch' },
  { id: 'gore', name: 'Gore', role: 'Guardian', side: 'enemy', archetype: 'guardian' },
];

const UNIT_STATS = {
  mage: { hp: 92, maxHp: 92, mana: 18, maxMana: 18, attack: 20, defense: 5, speed: 12, shield: 0 },
  warrior: { hp: 120, maxHp: 120, mana: 12, maxMana: 12, attack: 24, defense: 8, speed: 8, shield: 0 },
  ranger: { hp: 100, maxHp: 100, mana: 14, maxMana: 14, attack: 22, defense: 6, speed: 15, shield: 0 },
  berserker: { hp: 118, maxHp: 118, mana: 10, maxMana: 10, attack: 26, defense: 5, speed: 11, shield: 0 },
  witch: { hp: 90, maxHp: 90, mana: 20, maxMana: 20, attack: 18, defense: 4, speed: 10, shield: 0 },
  guardian: { hp: 128, maxHp: 128, mana: 8, maxMana: 8, attack: 17, defense: 10, speed: 7, shield: 0 },
};

const state = {
  turn: 1,
  battleEnded: false,
  log: [],
  actorQueue: [],
  currentActor: null,
  autoFight: false,
};

let heroes = [];
let enemies = [];

const ui = {
  playerTeam: document.getElementById('playerTeam'),
  enemyTeam: document.getElementById('enemyTeam'),
  turnCount: document.getElementById('turnCount'),
  statusText: document.getElementById('statusText'),
  actorSelect: document.getElementById('actorSelect'),
  actionSelect: document.getElementById('actionSelect'),
  targetSelect: document.getElementById('targetSelect'),
  executeActionBtn: document.getElementById('executeActionBtn'),
  skipTurnBtn: document.getElementById('skipTurnBtn'),
  statsPanel: document.getElementById('statsPanel'),
  battleLog: document.getElementById('battleLog'),
  newBattleBtn: document.getElementById('newBattleBtn'),
  autoBattleBtn: document.getElementById('autoBattleBtn'),
};

function createUnit(config) {
  const base = UNIT_STATS[config.archetype];
  return {
    ...config,
    hp: base.hp,
    maxHp: base.maxHp,
    mana: base.mana,
    maxMana: base.maxMana,
    attack: base.attack,
    defense: base.defense,
    speed: base.speed,
    shield: 0,
    alive: true,
  };
}

function cloneTeam(team) {
  return team.map((unit) => createUnit(unit));
}

function resetBattle() {
  state.turn = 1;
  state.battleEnded = false;
  state.log = [];
  state.actorQueue = [];
  state.currentActor = null;
  state.autoFight = false;

  heroes = cloneTeam(BLUE_PLAYERS);
  enemies = cloneTeam(RED_PLAYERS);

  recordLog('Battle begins! Blue Squad enters the arena.');
  recordLog('Obsidian appears from the shadows.');
  buildTurnQueue();
  render();
}

function buildTurnQueue() {
  const participants = [...heroes, ...enemies].filter((unit) => unit.alive);
  state.actorQueue = participants.sort((a, b) => b.speed - a.speed);
  state.currentActor = state.actorQueue[0] || null;
  ui.statusText.textContent = state.currentActor
    ? `${state.currentActor.name} is ready to act.`
    : 'Battle complete';
}

function getLivingUnits(side) {
  return (side === 'player' ? heroes : enemies).filter((unit) => unit.alive);
}

function getUnitById(unitId, side) {
  const team = side === 'player' ? heroes : enemies;
  return team.find((unit) => unit.id === unitId);
}

function recordLog(text) {
  state.log.unshift(text);
  if (state.log.length > 12) {
    state.log = state.log.slice(0, 12);
  }
}

function renderUnitCard(unit) {
  const isPlayer = unit.side === 'player';
  const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);
  const manaPercent = Math.max(0, (unit.mana / unit.maxMana) * 100);
  const activeClass = state.currentActor && state.currentActor.id === unit.id ? 'active' : '';
  const downClass = !unit.alive ? 'down' : '';

  const badges = [];
  if (unit.shield > 0) {
    badges.push('<span class="badge shield">Shield +'+ unit.shield + '</span>');
  }
  if (unit.alive) {
    badges.push('<span class="badge">' + unit.role + '</span>');
  }

  return `
    <div class="unit-card ${activeClass} ${downClass}" data-unit-id="${unit.id}" data-side="${unit.side}">
      <div class="unit-header">
        <div class="unit-name">${unit.name}</div>
        <div class="unit-role">${isPlayer ? 'Team' : 'Enemy'}</div>
      </div>

      <div class="hp-row">
        <span>HP</span>
        <strong>${unit.hp}/${unit.maxHp}</strong>
      </div>
      <div class="health-bar"><span style="width:${hpPercent}%"></span></div>

      <div class="mana-row">
        <span>Mana</span>
        <strong>${unit.mana}/${unit.maxMana}</strong>
      </div>
      <div class="mana-bar"><span style="width:${manaPercent}%"></span></div>

      <div class="unit-badges">
        ${badges.join('')}
      </div>
    </div>
  `;
}

function renderTeam(container, team) {
  container.innerHTML = team.map(renderUnitCard).join('');
}

function renderStats() {
  const playerAlive = getLivingUnits('player').length;
  const enemyAlive = getLivingUnits('enemy').length;

  ui.statsPanel.innerHTML = `
    <div class="stat-box">
      <span>Blue Alive</span>
      <strong>${playerAlive}</strong>
    </div>
    <div class="stat-box">
      <span>Enemy Alive</span>
      <strong>${enemyAlive}</strong>
    </div>
    <div class="stat-box">
      <span>Turn</span>
      <strong>${state.turn}</strong>
    </div>
    <div class="stat-box">
      <span>Winner</span>
      <strong>${state.battleEnded ? (playerAlive > 0 ? 'Blue Squad' : 'Obsidian') : 'Pending'}</strong>
    </div>
  `;
}

function renderLog() {
  ui.battleLog.innerHTML = state.log.map((line) => `<li>${line}</li>`).join('');
}

function renderActorOptions() {
  const playerUnits = getLivingUnits('player');
  const options = playerUnits.map((unit) => `
    <option value="${unit.id}">${unit.name} (${unit.role})</option>
  `).join('');

  if (!options) {
    ui.actorSelect.innerHTML = '<option value="">No fighter</option>';
    return;
  }

  ui.actorSelect.innerHTML = options;
  ui.actorSelect.value = playerUnits[0]?.id ?? '';
  refreshTargets();
}

function refreshTargets() {
  const actorId = ui.actorSelect.value;
  const actor = getUnitById(actorId, 'player');
  const actionType = ui.actionSelect.value;

  const targets = [];
  if (actionType === 'heal') {
    targets.push(...getLivingUnits('player'));
  } else {
    targets.push(...getLivingUnits('enemy'));
  }

  if (!targets.length) {
    ui.targetSelect.innerHTML = '<option value="">No target</option>';
    return;
  }

  ui.targetSelect.innerHTML = targets.map((unit) => `
    <option value="${unit.id}">${unit.name}</option>
  `).join('');

  const firstTarget = targets[0];
  ui.targetSelect.value = firstTarget.id;

  if (!actor) {
    return;
  }

  if (actionType === 'heal' && actor.mana < 6) {
    ui.statusText.textContent = `${actor.name} needs 6 mana to use Heal.`;
  }
}

function applyDamage(target, amount) {
  let remaining = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    target.hp = Math.max(0, target.hp - remaining);
  }

  if (target.hp <= 0) {
    target.alive = false;
    target.hp = 0;
  }
}

function executeAction(actor, actionType, target) {
  if (!actor || !target || state.battleEnded) {
    return;
  }

  const actorTeam = actor.side;
  const targetTeam = target.side;

  if (actionType === 'attack') {
    const damage = Math.max(8, actor.attack + Math.floor(Math.random() * 12) - target.defense);
    applyDamage(target, damage);
    recordLog(`${actor.name} hits ${target.name} for ${damage} damage.`);
  }

  if (actionType === 'skill') {
    if (actor.mana < 6) {
      recordLog(`${actor.name} is out of mana.`);
      return;
    }
    actor.mana = Math.max(0, actor.mana - 6);
    const damage = Math.max(12, actor.attack + 16 + Math.floor(Math.random() * 14) - target.defense);
    applyDamage(target, damage);
    recordLog(`${actor.name} unleashes a skill on ${target.name} for ${damage} damage.`);
  }

  if (actionType === 'guard') {
    actor.shield = Math.min(20, (actor.shield || 0) + 12);
    recordLog(`${actor.name} raises a shield and gains +12 armor.`);
  }

  if (actionType === 'heal') {
    if (actor.mana < 6) {
      recordLog(`${actor.name} doesn't have enough mana to cast Heal.`);
      return;
    }
    actor.mana = Math.max(0, actor.mana - 6);
    const healAmount = 22 + Math.floor(Math.random() * 14);
    const ally = target;
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
    recordLog(`${actor.name} heals ${ally.name} for ${healAmount} HP.`);
  }

  if (actorTeam === 'player') {
    actor.mana = Math.min(actor.maxMana, actor.mana + 2);
  }

  checkVictory();
  if (!state.battleEnded) {
    advanceTurn();
  }
}

function enemyTurn(unit) {
  const livingPlayer = getLivingUnits('player');
  const livingEnemy = getLivingUnits('enemy');

  if (!livingPlayer.length || !livingEnemy.length) {
    return;
  }

  if (unit.hp <= 0 || !unit.alive) {
    return;
  }

  const shouldHeal = unit.hp < unit.maxHp * 0.4 && unit.mana >= 6 && Math.random() > 0.5;
  if (shouldHeal) {
    const healAmount = 18 + Math.floor(Math.random() * 12);
    unit.hp = Math.min(unit.maxHp, unit.hp + healAmount);
    unit.mana = Math.max(0, unit.mana - 6);
    recordLog(`${unit.name} restores ${healAmount} HP using a recovery spell.`);
    return;
  }

  const target = livingPlayer[Math.floor(Math.random() * livingPlayer.length)];
  const isSkill = unit.mana >= 6 && Math.random() > 0.45;

  if (isSkill) {
    unit.mana = Math.max(0, unit.mana - 6);
    const damage = Math.max(10, unit.attack + 12 + Math.floor(Math.random() * 18) - target.defense);
    applyDamage(target, damage);
    recordLog(`${unit.name} strikes with a dark arc for ${damage}.`);
  } else {
    const damage = Math.max(8, unit.attack + Math.floor(Math.random() * 10) - target.defense);
    applyDamage(target, damage);
    recordLog(`${unit.name} attacks ${target.name} for ${damage}.`);
  }

  if (unit.side === 'enemy') {
    unit.mana = Math.min(unit.maxMana, unit.mana + 3);
  }
}

function advanceTurn() {
  const participants = [...heroes, ...enemies].filter((unit) => unit.alive).sort((a, b) => b.speed - a.speed);
  if (!participants.length) {
    state.battleEnded = true;
    return;
  }

  const next = participants[0];
  state.currentActor = next;
  state.turn += 1;
  ui.turnCount.textContent = String(state.turn);

  if (next.side === 'player') {
    ui.statusText.textContent = `${next.name} is ready to act.`;
    renderActorOptions();
  } else {
    ui.statusText.textContent = `${next.name} is acting...`;
    setTimeout(() => {
      enemyTurn(next);
      checkVictory();
      if (!state.battleEnded) {
        state.turn += 1;
        ui.turnCount.textContent = String(state.turn);
        buildTurnQueue();
        render();
      }
    }, 500);
  }

  render();
}

function checkVictory() {
  const playerAlive = getLivingUnits('player').length;
  const enemyAlive = getLivingUnits('enemy').length;

  if (playerAlive === 0) {
    state.battleEnded = true;
    recordLog('Obsidian wins the battle.');
    ui.statusText.textContent = 'Defeat. Press New Battle to try again.';
    return;
  }

  if (enemyAlive === 0) {
    state.battleEnded = true;
    recordLog('Blue Squad wins the battle!');
    ui.statusText.textContent = 'Victory! Your squad dominates the arena.';
    return;
  }
}

function executePlayerAction() {
  if (state.battleEnded) {
    return;
  }

  const actorId = ui.actorSelect.value;
  const actor = getUnitById(actorId, 'player');
  const actionType = ui.actionSelect.value;
  const targetId = ui.targetSelect.value;
  const target = actionType === 'heal'
    ? getUnitById(targetId, 'player')
    : getUnitById(targetId, 'enemy');

  if (!actor || !target) {
    return;
  }

  executeAction(actor, actionType, target);
  render();
}

function autoResolveCurrentTurn() {
  if (state.battleEnded) {
    return;
  }

  const actor = state.currentActor;
  if (!actor || actor.side !== 'player') {
    return;
  }

  const livingEnemies = getLivingUnits('enemy');
  const livingAllies = getLivingUnits('player');

  let actionType = 'attack';
  let target = livingEnemies[0];

  const weakAlly = livingAllies.find((unit) => unit.hp < unit.maxHp * 0.55);
  if (actor.mana >= 6 && weakAlly && Math.random() > 0.45) {
    actionType = 'heal';
    target = weakAlly;
  } else if (actor.mana >= 6 && Math.random() > 0.55) {
    actionType = 'skill';
    target = livingEnemies[0];
  } else if (actor.hp < actor.maxHp * 0.5 && Math.random() > 0.35) {
    actionType = 'guard';
    target = actor;
  }

  executeAction(actor, actionType, target);
  render();
}

function handleActionSelectChange() {
  refreshTargets();
}

ui.actionSelect.addEventListener('change', handleActionSelectChange);
ui.actorSelect.addEventListener('change', refreshTargets);
ui.executeActionBtn.addEventListener('click', executePlayerAction);
ui.skipTurnBtn.addEventListener('click', () => {
  recordLog(`${state.currentActor?.name || 'Current fighter'} skips the turn.`);
  state.turn += 1;
  ui.turnCount.textContent = String(state.turn);
  buildTurnQueue();
  render();
});
ui.newBattleBtn.addEventListener('click', resetBattle);
ui.autoBattleBtn.addEventListener('click', autoResolveCurrentTurn);

function render() {
  renderTeam(ui.playerTeam, heroes);
  renderTeam(ui.enemyTeam, enemies);
  renderStats();
  renderLog();
  renderActorOptions();
  ui.turnCount.textContent = String(state.turn);

  if (state.currentActor && state.currentActor.side === 'player') {
    ui.statusText.textContent = `${state.currentActor.name} is ready to act.`;
  }

  if (state.battleEnded) {
    ui.statusText.textContent = ui.statusText.textContent;
  }
}

resetBattle();
