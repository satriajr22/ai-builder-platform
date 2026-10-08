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

var heroes: Array = []
var enemies: Array = []
var turn = 1
var battle_over = false
var current_actor = null
var log_lines: Array = []

const UNIT_STATS = {
    "warrior": {"hp": 120, "mana": 12, "attack": 24, "defense": 8, "speed": 8},
    "mage": {"hp": 92, "mana": 18, "attack": 20, "defense": 5, "speed": 12},
    "ranger": {"hp": 100, "mana": 14, "attack": 22, "defense": 6, "speed": 15},
    "berserker": {"hp": 118, "mana": 10, "attack": 26, "defense": 5, "speed": 11},
    "witch": {"hp": 90, "mana": 20, "attack": 18, "defense": 4, "speed": 10},
    "guardian": {"hp": 128, "mana": 8, "attack": 17, "defense": 10, "speed": 7},
}

func _ready():
    setup_actions()
    start_new_battle()

func setup_actions():
    action_option.clear()
    action_option.add_item("Attack")
    action_option.add_item("Skill")
    action_option.add_item("Guard")
    action_option.add_item("Heal")
    action_option.item_selected.connect(_on_action_changed)
    actor_option.item_selected.connect(_on_actor_changed)
    execute_btn.pressed.connect(_on_execute_pressed)
    new_battle_btn.pressed.connect(start_new_battle)
    auto_btn.pressed.connect(_on_auto_battle)

func start_new_battle():
    heroes = [
        create_unit("Astra", "mage", "player"),
        create_unit("Brann", "warrior", "player"),
        create_unit("Lyra", "ranger", "player"),
    ]
    enemies = [
        create_unit("Vex", "berserker", "enemy"),
        create_unit("Mira", "witch", "enemy"),
        create_unit("Gore", "guardian", "enemy"),
    ]
    turn = 1
    battle_over = false
    log_lines = []
    add_log("Battle begins! Blue Squad enters the arena.")
    add_log("Obsidian rises from the shadows.")
    refresh_all()

func create_unit(name: String, archetype: String, side: String) -> Dictionary:
    var stats = UNIT_STATS[archetype]
    return {
        "name": name,
        "archetype": archetype,
        "side": side,
        "hp": stats["hp"],
        "max_hp": stats["hp"],
        "mana": stats["mana"],
        "max_mana": stats["mana"],
        "attack": stats["attack"],
        "defense": stats["defense"],
        "speed": stats["speed"],
        "shield": 0,
        "alive": true,
        "id": name.to_lower() + "_" + side,
    }

func refresh_all():
    turn_label.text = "Turn: %s" % turn
    current_actor = get_first_alive_player()
    if current_actor == null:
        battle_over = true
    update_actor_options()
    update_target_options()
    render_units()
    render_stats()
    render_log()
    if battle_over:
        status_label.text = "Battle finished"
    elif current_actor != null:
        status_label.text = "%s is ready." % current_actor["name"]

func get_first_alive_player():
    for unit in heroes:
        if unit["alive"]:
            return unit
    return null

func get_living(team_name: String) -> Array:
    var team = heroes if team_name == "player" else enemies
    var result: Array = []
    for unit in team:
        if unit["alive"]:
            result.append(unit)
    return result

func get_unit_by_id(unit_id: String, team_name: String):
    var team = heroes if team_name == "player" else enemies
    for unit in team:
        if unit["id"] == unit_id:
            return unit
    return null

func update_actor_options():
    actor_option.clear()
    for unit in get_living("player"):
        actor_option.add_item(unit["name"], actor_option.item_count)
    if actor_option.item_count > 0:
        actor_option.select(0)
    update_target_options()

func update_target_options():
    target_option.clear()
    var action = action_option.selected
    var actor_name = actor_option.get_item_text(actor_option.selected)
    var actor = null
    for unit in get_living("player"):
        if unit["name"] == actor_name:
            actor = unit
            break
    var targets: Array = []
    if action == 3:
        targets = get_living("player")
    else:
        targets = get_living("enemy")
    for unit in targets:
        target_option.add_item(unit["name"])

func _on_action_changed(index: int):
    update_target_options()

func _on_actor_changed(index: int):
    update_target_options()

func render_units():
    render_team(player_units, heroes)
    render_team(enemy_units, enemies)

func render_team(container: VBoxContainer, team: Array):
    for child in container.get_children():
        child.queue_free()
    for unit in team:
        var panel = PanelContainer.new()
        var box = VBoxContainer.new()

        var title = Label.new()
        title.text = unit["name"] + "  " + unit["role"] if "role" in unit else unit["name"]
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

func render_stats():
    while stats_grid.get_child_count() > 0:
        var child = stats_grid.get_child(0)
        stats_grid.remove_child(child)
        child.queue_free()

    var player_alive = get_living("player").size()
    var enemy_alive = get_living("enemy").size()
    var labels = [
        ["Blue Alive", str(player_alive)],
        ["Enemy Alive", str(enemy_alive)],
        ["Turn", str(turn)],
        ["Winner", "Pending" if not battle_over else ("Blue Squad" if player_alive > 0 else "Obsidian")],
    ]

    for pair in labels:
        var title = Label.new()
        title.text = pair[0]
        var value = Label.new()
        value.text = pair[1]
        stats_grid.add_child(title)
        stats_grid.add_child(value)

func render_log():
    var text = ""
    for line in log_lines:
        text += "- " + line + "\n"
    log_text.text = text

func add_log(message: String):
    log_lines.insert(0, message)
    if log_lines.size() > 12:
        log_lines.resize(12)

func _on_execute_pressed():
    if battle_over:
        return
    var actor_name = actor_option.get_item_text(actor_option.selected)
    var actor = null
    for unit in get_living("player"):
        if unit["name"] == actor_name:
            actor = unit
            break
    if actor == null:
        return

    var action = action_option.selected
    var target_name = target_option.get_item_text(target_option.selected)
    var target = null
    if action == 3:
        target = get_unit_by_name(target_name, "player")
    else:
        target = get_unit_by_name(target_name, "enemy")

    if target == null:
        return

    execute_action(actor, action, target)
    end_turn_and_advance()

func get_unit_by_name(unit_name: String, team_name: String):
    var team = heroes if team_name == "player" else enemies
    for unit in team:
        if unit["name"] == unit_name:
            return unit
    return null

func execute_action(actor: Dictionary, action_id: int, target: Dictionary):
    if action_id == 0:
        var damage = max(8, actor["attack"] + randi_range(0, 12) - target["defense"])
        apply_damage(target, damage)
        add_log("%s attacks %s for %s damage." % [actor["name"], target["name"], damage])
        actor["mana"] = min(actor["max_mana"], actor["mana"] + 2)
    elif action_id == 1:
        if actor["mana"] < 6:
            add_log("%s is out of mana." % actor["name"])
            return
        actor["mana"] -= 6
        var damage = max(12, actor["attack"] + 16 + randi_range(0, 14) - target["defense"])
        apply_damage(target, damage)
        add_log("%s uses Skill Burst on %s for %s damage." % [actor["name"], target["name"], damage])
    elif action_id == 2:
        actor["shield"] += 12
        add_log("%s raises a guard and gains +12 shield." % actor["name"])
    elif action_id == 3:
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
    render_all_after_action()

func render_all_after_action():
    update_actor_options()
    update_target_options()
    render_units()
    render_stats()
    render_log()

func apply_damage(target: Dictionary, amount: int):
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
        return true
    if enemy_alive == 0:
        battle_over = true
        add_log("Blue Squad wins the battle!")
        status_label.text = "Victory! Arena conquered."
        return true
    return false

func end_turn_and_advance():
    if battle_over:
        return
    turn += 1
    turn_label.text = "Turn: %s" % turn
    refresh_all()
    if not battle_over:
        enemy_phase()

func enemy_phase():
    if battle_over:
        return
    var enemies_alive = get_living("enemy")
    if enemies_alive.is_empty():
        return
    for enemy in enemies_alive:
        if not enemy["alive"]:
            continue
        if randi_range(0, 100) < 35 and enemy["mana"] >= 6:
            var ally = null
            for candidate in enemies_alive:
                if candidate["hp"] < candidate["max_hp"] * 0.65:
                    ally = candidate
                    break
            if ally != null:
                enemy["mana"] -= 6
                var heal = 18 + randi_range(0, 12)
                ally["hp"] = min(ally["max_hp"], ally["hp"] + heal)
                add_log("%s casts a recovery spell on %s." % [enemy["name"], ally["name"]])
                render_all_after_action()
                continue
        var target = get_living("player")[0]
        var damage = max(8, enemy["attack"] + randi_range(0, 10) - target["defense"])
        if enemy["mana"] >= 6 and randi_range(0, 100) > 50:
            enemy["mana"] -= 6
            damage = max(12, enemy["attack"] + 14 + randi_range(0, 18) - target["defense"])
            add_log("%s unleashes Dark Burst on %s for %s damage." % [enemy["name"], target["name"], damage])
        else:
            add_log("%s strikes %s for %s damage." % [enemy["name"], target["name"], damage])
        apply_damage(target, damage)
        enemy["mana"] = min(enemy["max_mana"], enemy["mana"] + 2)
        if target["hp"] <= 0:
            target["alive"] = false
            add_log("%s falls in battle." % target["name"])
        if check_victory():
            return
    render_all_after_action()
    refresh_all()

func _on_auto_battle():
    if battle_over:
        return
    var player_living = get_living("player")
    if player_living.is_empty():
        return
    var actor = player_living[0]
    var action = 0
    var target = get_living("enemy")[0]
    if actor["mana"] >= 6 and randi_range(0, 100) > 45:
        action = 1
    elif actor["hp"] < actor["max_hp"] * 0.5 and randi_range(0, 100) > 50:
        action = 2
    elif actor["mana"] >= 6 and randi_range(0, 100) > 50:
        action = 3
    execute_action(actor, action, target if action != 3 else actor)
    if action == 3:
        target = actor
    if not battle_over:
        end_turn_and_advance()

