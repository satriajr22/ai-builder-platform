extends Control

@onready var turn_label: Label = $Margin/Content/ArenaRow/CenterPanel/TurnLabel
@onready var status_label: Label = $Margin/Content/ArenaRow/CenterPanel/StatusLabel
@onready var player_units: VBoxContainer = $Margin/Content/ArenaRow/PlayerPanel/PlayerUnits
@onready var enemy_units: VBoxContainer = $Margin/Content/ArenaRow/EnemyPanel/EnemyUnits
@onready var log_text: RichTextLabel = $Margin/Content/LogPanel/LogText
@onready var actor_option: OptionButton = $Margin/Content/BottomRow/ControlPanel/ControlVbox/ActorOption
@onready var action_option: OptionButton = $Margin/Content/BottomRow/ControlPanel/ControlVbox/ActionOption
@onready var target_option: OptionButton = $Margin/Content/BottomRow/ControlPanel/ControlVbox/TargetOption
@onready var execute_btn: Button = $Margin/Content/BottomRow/ControlPanel/ControlVbox/ExecuteBtn
@onready var new_battle_btn: Button = $Margin/Content/TopBar/NewBattleBtn
@onready var auto_btn: Button = $Margin/Content/TopBar/AutoBtn
@onready var stats_grid: GridContainer = $Margin/Content/BottomRow/StatsPanel/StatsVbox/StatsGrid

const CLASS_DATA = {
    "Knight": {"hp": 140, "mana": 12, "attack": 28, "defense": 10, "speed": 8, "skill": "Shield Bash"},
    "Mage": {"hp": 98, "mana": 20, "attack": 22, "defense": 5, "speed": 12, "skill": "Arc Nova"},
    "Ranger": {"hp": 110, "mana": 15, "attack": 24, "defense": 6, "speed": 15, "skill": "Piercing Shot"},
    "Guardian": {"hp": 132, "mana": 10, "attack": 18, "defense": 12, "speed": 7, "skill": "Aegis Guard"},
    "Berserker": {"hp": 122, "mana": 10, "attack": 26, "defense": 5, "speed": 11, "skill": "Rage Breaker"},
    "Witch": {"hp": 92, "mana": 22, "attack": 18, "defense": 4, "speed": 10, "skill": "Hex Pulse"},
}

var party: Array = []
var enemies: Array = []
var log_lines: Array = []
var current_turn: int = 1
var battle_over: bool = false
var gold: int = 150
var inventory: Array = ["Potion", "Mana Gem", "Iron Ore"]
var boss_defeated: int = 0
var save_path: String = "user://rpg_arena_save.json"

func _ready() -> void:
    action_option.clear()
    action_option.add_item("Attack")
    action_option.add_item("Skill")
    action_option.add_item("Guard")
    action_option.add_item("Heal")

    actor_option.item_selected.connect(_on_actor_changed)
    action_option.item_selected.connect(_on_action_changed)
    execute_btn.pressed.connect(_on_execute_pressed)
    new_battle_btn.pressed.connect(start_new_battle)
    auto_btn.pressed.connect(_on_auto_battle)

    load_game()
    if party.is_empty():
        create_default_party()
    if enemies.is_empty():
        create_enemy_team()
    refresh_all()

func create_default_party() -> void:
    party = [
        create_character("Astra", "Mage"),
        create_character("Brann", "Knight"),
        create_character("Lyra", "Ranger"),
    ]

func create_character(name: String, class_name: String) -> Dictionary:
    var stats = CLASS_DATA[class_name]
    return {
        "id": name.to_lower() + "_" + class_name.to_lower(),
        "name": name,
        "class_name": class_name,
        "level": 1,
        "xp": 0,
        "side": "player",
        "max_hp": stats["hp"],
        "hp": stats["hp"],
        "max_mana": stats["mana"],
        "mana": stats["mana"],
        "attack": stats["attack"],
        "defense": stats["defense"],
        "speed": stats["speed"],
        "skill_name": stats["skill"],
        "alive": true,
        "shield": 0,
    }

func create_enemy_team() -> void:
    enemies = [
        create_enemy("Vex", "Berserker"),
        create_enemy("Mira", "Witch"),
        create_enemy("Gore", "Guardian"),
    ]

func create_enemy(name: String, class_name: String) -> Dictionary:
    var stats = CLASS_DATA[class_name]
    return {
        "id": name.to_lower() + "_enemy",
        "name": name,
        "class_name": class_name,
        "level": 1,
        "side": "enemy",
        "max_hp": stats["hp"],
        "hp": stats["hp"],
        "max_mana": stats["mana"],
        "mana": stats["mana"],
        "attack": stats["attack"],
        "defense": stats["defense"],
        "speed": stats["speed"],
        "skill_name": stats["skill"],
        "alive": true,
        "shield": 0,
    }

func start_new_battle() -> void:
    battle_over = false
    current_turn = 1
    log_lines.clear()
    create_enemy_team()
    if party.is_empty():
        create_default_party()
    for hero in party:
        hero["hp"] = hero["max_hp"]
        hero["mana"] = hero["max_mana"]
        hero["alive"] = true
        hero["shield"] = 0
    for enemy in enemies:
        enemy["hp"] = enemy["max_hp"]
        enemy["mana"] = enemy["max_mana"]
        enemy["alive"] = true
        enemy["shield"] = 0
    add_log("Battle begins! Blue Squad enters the arena.")
    add_log("Obsidian rises from the shadows.")
    refresh_all()
    save_game()

func refresh_all() -> void:
    turn_label.text = "Turn: %s" % current_turn
    if battle_over:
        status_label.text = "Battle finished"
    else:
        status_label.text = "Select a move"
    update_actor_options()
    update_target_options()
    render_units()
    render_stats()
    render_log()

func update_actor_options() -> void:
    actor_option.clear()
    for hero in get_living("player"):
        actor_option.add_item(hero["name"])
    if actor_option.item_count > 0:
        actor_option.select(0)
    update_target_options()

func update_target_options() -> void:
    target_option.clear()
    var actor_name = actor_option.get_item_text(actor_option.selected) if actor_option.item_count > 0 else ""
    var actor = get_unit_by_name(actor_name, "player")
    var action_index = action_option.selected
    var targets: Array = []
    if action_index == 3:
        targets = get_living("player")
    else:
        targets = get_living("enemy")

    for target in targets:
        target_option.add_item(target["name"])

    if target_option.item_count > 0:
        target_option.select(0)

func render_units() -> void:
    render_team(player_units, party)
    render_team(enemy_units, enemies)

func render_team(container: VBoxContainer, team: Array) -> void:
    for child in container.get_children():
        child.queue_free()

    for unit in team:
        var panel = PanelContainer.new()
        var box = VBoxContainer.new()

        var title = Label.new()
        title.text = "%s | Lv.%s %s" % [unit["name"], unit["level"], unit["class_name"]]
        box.add_child(title)

        var hp = Label.new()
        hp.text = "HP %s/%s" % [unit["hp"], unit["max_hp"]]
        box.add_child(hp)

        var mana = Label.new()
        mana.text = "Mana %s/%s" % [unit["mana"], unit["max_mana"]]
        box.add_child(mana)

        if unit["shield"] > 0:
            var shield = Label.new()
            shield.text = "Shield +%s" % unit["shield"]
            box.add_child(shield)

        panel.add_child(box)
        container.add_child(panel)

func render_stats() -> void:
    while stats_grid.get_child_count() > 0:
        var child = stats_grid.get_child(0)
        stats_grid.remove_child(child)
        child.queue_free()

    var labels = [
        ["Blue Alive", str(get_living("player").size())],
        ["Enemy Alive", str(get_living("enemy").size())],
        ["Turn", str(current_turn)],
        ["Gold", str(gold)],
        ["Bosses", str(boss_defeated)],
        ["Inventory", str(inventory.size())],
    ]

    for entry in labels:
        var key = Label.new()
        key.text = entry[0]
        var value = Label.new()
        value.text = entry[1]
        stats_grid.add_child(key)
        stats_grid.add_child(value)

func render_log() -> void:
    var text = ""
    for line in log_lines:
        text += "- " + line + "\n"
    log_text.text = text

func add_log(message: String) -> void:
    log_lines.insert(0, message)
    if log_lines.size() > 12:
        log_lines.resize(12)

func get_living(team_name: String) -> Array:
    var team = party if team_name == "player" else enemies
    var result: Array = []
    for unit in team:
        if unit["alive"]:
            result.append(unit)
    return result

func get_unit_by_name(name: String, team_name: String): Dictionary:
    var team = party if team_name == "player" else enemies
    for unit in team:
        if unit["name"] == name:
            return unit
    return {}

func _on_action_changed(_index: int) -> void:
    update_target_options()

func _on_actor_changed(_index: int) -> void:
    update_target_options()

func _on_execute_pressed() -> void:
    if battle_over:
        return

    var actor_name = actor_option.get_item_text(actor_option.selected) if actor_option.item_count > 0 else ""
    var actor = get_unit_by_name(actor_name, "player")
    if actor.is_empty():
        return

    var action_index = action_option.selected
    var target_name = target_option.get_item_text(target_option.selected) if target_option.item_count > 0 else ""
    var target: Dictionary = {}
    if action_index == 3:
        target = get_unit_by_name(target_name, "player")
    else:
        target = get_unit_by_name(target_name, "enemy")

    if target.is_empty():
        return

    execute_action(actor, action_index, target)
    if not battle_over:
        enemy_turn_phase()
        refresh_all()
        save_game()

func execute_action(actor: Dictionary, action_index: int, target: Dictionary) -> void:
    if action_index == 0:
        var damage = max(8, actor["attack"] + randi_range(0, 12) - target["defense"])
        apply_damage(target, damage)
        add_log("%s attacks %s for %s damage." % [actor["name"], target["name"], damage])
        actor["mana"] = min(actor["max_mana"], actor["mana"] + 2)
    elif action_index == 1:
        if actor["mana"] < 6:
            add_log("%s is out of mana." % actor["name"])
            return
        actor["mana"] -= 6
        var damage = max(12, actor["attack"] + 16 + randi_range(0, 14) - target["defense"])
        apply_damage(target, damage)
        add_log("%s uses %s on %s for %s damage." % [actor["name"], actor["skill_name"], target["name"], damage])
    elif action_index == 2:
        actor["shield"] += 12
        add_log("%s raises a guard and gains +12 shield." % actor["name"])
    elif action_index == 3:
        if actor["mana"] < 6:
            add_log("%s cannot cast Heal." % actor["name"])
            return
        actor["mana"] -= 6
        var heal = 22 + randi_range(0, 14)
        target["hp"] = min(target["max_hp"], target["hp"] + heal)
        add_log("%s heals %s for %s HP." % [actor["name"], target["name"], heal])

    if target["hp"] <= 0:
        target["alive"] = false
        target["hp"] = 0
        add_log("%s falls in battle." % target["name"])

    if check_victory():
        return

func enemy_turn_phase() -> void:
    if battle_over:
        return

    for enemy in get_living("enemy"):
        if not enemy["alive"]:
            continue
        if enemy["hp"] < enemy["max_hp"] * 0.45 and enemy["mana"] >= 6 and randi_range(0, 100) > 35:
            var ally = null
            for candidate in get_living("enemy"):
                if candidate["hp"] < candidate["max_hp"] * 0.75:
                    ally = candidate
                    break
            if ally != null:
                enemy["mana"] -= 6
                var heal = 18 + randi_range(0, 10)
                ally["hp"] = min(ally["max_hp"], ally["hp"] + heal)
                add_log("%s restores %s with %s." % [enemy["name"], ally["name"], enemy["skill_name"]])
                continue

        var target = get_living("player")[0]
        var damage = max(8, enemy["attack"] + randi_range(0, 12) - target["defense"])
        if enemy["mana"] >= 6 and randi_range(0, 100) > 50:
            enemy["mana"] -= 6
            damage = max(12, enemy["attack"] + 14 + randi_range(0, 18) - target["defense"])
            add_log("%s unleashes %s on %s for %s damage." % [enemy["name"], enemy["skill_name"], target["name"], damage])
        else:
            add_log("%s hits %s for %s damage." % [enemy["name"], target["name"], damage])

        apply_damage(target, damage)
        if target["hp"] <= 0:
            target["alive"] = false
            target["hp"] = 0
            add_log("%s falls in battle." % target["name"])

        if check_victory():
            return

    current_turn += 1
    turn_label.text = "Turn: %s" % current_turn
    if not battle_over:
        status_label.text = "Enemy turn resolved."

func apply_damage(target: Dictionary, amount: int) -> void:
    if target.is_empty():
        return

    var remaining = amount
    if target["shield"] > 0:
        var absorbed = min(target["shield"], remaining)
        target["shield"] -= absorbed
        remaining -= absorbed
    if remaining > 0:
        target["hp"] = max(0, target["hp"] - remaining)
    if target["hp"] <= 0:
        target["alive"] = false

func check_victory() -> bool:
    var player_alive = get_living("player").size()
    var enemy_alive = get_living("enemy").size()

    if player_alive == 0:
        battle_over = true
        add_log("Obsidian wins the battle.")
        status_label.text = "Defeat. Press New Battle to try again."
        reward_loss()
        return true

    if enemy_alive == 0:
        battle_over = true
        add_log("Blue Squad wins the battle!")
        status_label.text = "Victory! The arena is conquered."
        reward_victory()
        return true

    return false

func reward_victory() -> void:
    gold += 80
    inventory.append("Potion")
    if inventory.size() > 8:
        inventory = inventory.slice(0, 8)
    boss_defeated += 1
    save_game()

func reward_loss() -> void:
    gold = max(0, gold - 20)
    if inventory.has("Potion"):
        inventory.erase("Potion")
    save_game()

func _on_auto_battle() -> void:
    if battle_over:
        return

    var actor = get_living("player")[0] if not get_living("player").is_empty() else null
    if actor == null:
        return

    var action_index = 0
    var target = get_living("enemy")[0] if not get_living("enemy").is_empty() else null
    if actor["hp"] < actor["max_hp"] * 0.5 and randi_range(0, 100) > 35:
        action_index = 2
    elif actor["mana"] >= 6 and randi_range(0, 100) > 45:
        action_index = 1
    elif actor["mana"] >= 6 and randi_range(0, 100) > 50:
        action_index = 3
        target = actor

    if target == null:
        return

    execute_action(actor, action_index, target)
    if not battle_over:
        enemy_turn_phase()
        refresh_all()
        save_game()

func save_game() -> void:
    var data = {
        "gold": gold,
        "boss_defeated": boss_defeated,
        "inventory": inventory,
        "party": party,
        "current_turn": current_turn,
    }
    var file = FileAccess.open(save_path, FileAccess.WRITE)
    if file != null:
        file.store_string(JSON.stringify(data))
        file.close()

func load_game() -> void:
    if not FileAccess.file_exists(save_path):
        return

    var file = FileAccess.open(save_path, FileAccess.READ)
    if file == null:
        return

    var text = file.get_as_text()
    file.close()
    if text.strip_edges() == "":
        return

    var parsed = JSON.parse_string(text)
    if typeof(parsed) != TYPE_DICTIONARY:
        return

    gold = int(parsed.get("gold", 150))
    boss_defeated = int(parsed.get("boss_defeated", 0))
    inventory = parsed.get("inventory", ["Potion", "Mana Gem", "Iron Ore"])
    party = parsed.get("party", [])
    current_turn = int(parsed.get("current_turn", 1))

    if party.is_empty():
        create_default_party()

    for hero in party:
        if hero.has("max_hp"):
            hero["hp"] = min(hero["hp"], hero["max_hp"])
            hero["mana"] = min(hero["mana"], hero["max_mana"])
            hero["alive"] = hero["hp"] > 0

    if enemies.is_empty():
        create_enemy_team()

    save_game()

