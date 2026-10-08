extends Node3D

const CLASS_DATA = {
    "Knight": {"hp": 140, "mana": 12, "attack": 28, "defense": 10, "speed": 8},
    "Mage": {"hp": 98, "mana": 20, "attack": 22, "defense": 5, "speed": 12},
    "Ranger": {"hp": 110, "mana": 15, "attack": 24, "defense": 6, "speed": 15},
    "Guardian": {"hp": 132, "mana": 10, "attack": 18, "defense": 12, "speed": 7},
    "Berserker": {"hp": 122, "mana": 10, "attack": 26, "defense": 5, "speed": 11},
    "Witch": {"hp": 92, "mana": 22, "attack": 18, "defense": 4, "speed": 10},
}

@onready var camera = $Camera3D
@onready var player_spawn = $Arena/PlayerTeamSpawn
@onready var enemy_spawn = $Arena/EnemyTeamSpawn
@onready var effects_layer = $EffectsLayer
@onready var battle_log = $UI/Panel/BattleLog
@onready var actor_option = $UI/ControlPanel/VBoxContainer/ActorOption
@onready var action_option = $UI/ControlPanel/VBoxContainer/ActionOption
@onready var target_option = $UI/ControlPanel/VBoxContainer/TargetOption
@onready var execute_btn = $UI/ControlPanel/VBoxContainer/ExecuteBtn
@onready var auto_btn = $UI/ControlPanel/VBoxContainer/AutoBtn
@onready var stats_vbox = $UI/StatsPanelUI/StatsVBox

var party: Array = []
var enemies: Array = []
var battle_over: bool = false
var current_turn: int = 1
var log_lines: Array = []
var character_meshes: Dictionary = {}

func _ready() -> void:
    action_option.clear()
    action_option.add_item("Attack")
    action_option.add_item("Skill")
    action_option.add_item("Guard")
    action_option.add_item("Heal")

    actor_option.item_selected.connect(_on_actor_changed)
    action_option.item_selected.connect(_on_action_changed)
    execute_btn.pressed.connect(_on_execute_pressed)
    auto_btn.pressed.connect(_on_auto_battle)

    create_party_from_selection()
    create_enemy_team()
    spawn_characters()
    setup_camera_animation()
    refresh_all()

func create_party_from_selection() -> void:
    var classes = GameState.player_classes if GameState.player_classes else ["Mage", "Knight", "Ranger"]
    var names = ["Astra", "Brann", "Lyra"]
    for i in range(min(3, classes.size())):
        party.append(create_character(names[i], classes[i], "player"))

func create_character(name: String, class_name: String, side: String) -> Dictionary:
    var stats = CLASS_DATA[class_name]
    return {
        "id": name.to_lower() + "_" + side,
        "name": name,
        "class_name": class_name,
        "level": 1,
        "side": side,
        "max_hp": stats["hp"],
        "hp": stats["hp"],
        "max_mana": stats["mana"],
        "mana": stats["mana"],
        "attack": stats["attack"],
        "defense": stats["defense"],
        "speed": stats["speed"],
        "alive": true,
        "shield": 0,
        "mesh_node": null,
    }

func create_enemy_team() -> void:
    var enemy_classes = ["Berserker", "Witch", "Guardian"]
    var enemy_names = ["Vex", "Mira", "Gore"]
    for i in range(3):
        enemies.append(create_character(enemy_names[i], enemy_classes[i], "enemy"))

func spawn_characters() -> void:
    var player_positions = [Vector3(-8, 0, -2), Vector3(-6, 0, 0), Vector3(-8, 0, 2)]
    for i in range(party.size()):
        var char = party[i]
        var mesh = create_character_mesh(char)
        mesh.position = player_positions[i]
        player_spawn.add_child(mesh)
        char["mesh_node"] = mesh
        character_meshes[char["id"]] = mesh

    var enemy_positions = [Vector3(8, 0, -2), Vector3(6, 0, 0), Vector3(8, 0, 2)]
    for i in range(enemies.size()):
        var char = enemies[i]
        var mesh = create_character_mesh(char)
        mesh.position = enemy_positions[i]
        enemy_spawn.add_child(mesh)
        char["mesh_node"] = mesh
        character_meshes[char["id"]] = mesh

func create_character_mesh(character: Dictionary) -> MeshInstance3D:
    var mesh_instance = MeshInstance3D.new()
    var capsule = CapsuleMesh.new()
    capsule.radius = 0.5
    capsule.height = 2.0
    mesh_instance.mesh = capsule

    var material = StandardMaterial3D.new()
    if character["side"] == "player":
        material.albedo_color = Color.BLUE
    else:
        material.albedo_color = Color.RED
    mesh_instance.material_override = material
    mesh_instance.name = character["name"]
    return mesh_instance

func setup_camera_animation() -> void:
    var tween = create_tween()
    tween.set_ease(Tween.EASE_IN_OUT)
    tween.set_trans(Tween.TRANS_CUBIC)
    tween.tween_property(camera, "position", Vector3(0, 4, 10), 2.0)

func refresh_all() -> void:
    update_actor_options()
    update_target_options()
    update_stats_display()
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

func update_stats_display() -> void:
    while stats_vbox.get_child_count() > 0:
        var child = stats_vbox.get_child(0)
        stats_vbox.remove_child(child)
        child.queue_free()

    var stats = [
        "Turn: %d" % current_turn,
        "Alive (Blue): %d" % get_living("player").size(),
        "Alive (Red): %d" % get_living("enemy").size(),
    ]
    for stat in stats:
        var label = Label.new()
        label.text = stat
        stats_vbox.add_child(label)

func render_log() -> void:
    var text = ""
    for line in log_lines:
        text += "- " + line + "\n"
    battle_log.text = text

func add_log(message: String) -> void:
    log_lines.insert(0, message)
    if log_lines.size() > 10:
        log_lines.resize(10)
    render_log()

func get_living(team_name: String) -> Array:
    var team = party if team_name == "player" else enemies
    var result: Array = []
    for unit in team:
        if unit["alive"]:
            result.append(unit)
    return result

func get_unit_by_name(name: String, team_name: String) -> Dictionary:
    var team = party if team_name == "player" else enemies
    for unit in team:
        if unit["name"] == name:
            return unit
    return {}

func _on_actor_changed(_index: int) -> void:
    update_target_options()

func _on_action_changed(_index: int) -> void:
    update_target_options()

func _on_execute_pressed() -> void:
    if battle_over or get_living("player").is_empty():
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

    if not target.is_empty():
        execute_action(actor, action_index, target)
        animate_attack(actor, target)
        if not battle_over:
            await get_tree().create_timer(1.0).timeout
            enemy_turn_phase()
            refresh_all()

func execute_action(actor: Dictionary, action_index: int, target: Dictionary) -> void:
    if action_index == 0:
        var damage = max(8, actor["attack"] + randi_range(0, 12) - target["defense"])
        apply_damage(target, damage)
        add_log("%s attacks %s for %s damage." % [actor["name"], target["name"], damage])
    elif action_index == 1:
        if actor["mana"] < 6:
            add_log("%s is out of mana." % actor["name"])
            return
        actor["mana"] -= 6
        var damage = max(12, actor["attack"] + 16 + randi_range(0, 14) - target["defense"])
        apply_damage(target, damage)
        add_log("%s uses Skill on %s for %s damage." % [actor["name"], target["name"], damage])
    elif action_index == 2:
        actor["shield"] += 12
        add_log("%s raises a guard." % actor["name"])
    elif action_index == 3:
        if actor["mana"] < 6:
            add_log("%s cannot cast Heal." % actor["name"])
            return
        actor["mana"] -= 6
        var heal = 22 + randi_range(0, 14)
        target["hp"] = min(target["max_hp"], target["hp"] + heal)
        add_log("%s heals %s for %s." % [actor["name"], target["name"], heal])

    if target["hp"] <= 0:
        target["alive"] = false
        target["hp"] = 0
        add_log("%s has been defeated." % target["name"])
        if target["mesh_node"]:
            animate_death(target)

    check_victory()

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

func animate_attack(attacker: Dictionary, target: Dictionary) -> void:
    if not attacker.get("mesh_node") or not target.get("mesh_node"):
        return

    var attacker_mesh = attacker["mesh_node"]
    var target_mesh = target["mesh_node"]
    var original_pos = attacker_mesh.position

    var tween = create_tween()
    tween.set_ease(Tween.EASE_IN_OUT)
    tween.set_trans(Tween.TRANS_QUAD)
    tween.tween_property(attacker_mesh, "position", target_mesh.position + (attacker_mesh.position - target_mesh.position).normalized() * 0.5, 0.3)
    tween.tween_property(attacker_mesh, "position", original_pos, 0.3)

    effects_layer.spawn_hit_effect(target_mesh.position)

func animate_death(character: Dictionary) -> void:
    if not character.get("mesh_node"):
        return
    var mesh = character["mesh_node"]
    var tween = create_tween()
    tween.set_ease(Tween.EASE_IN)
    tween.set_trans(Tween.TRANS_QUAD)
    tween.tween_property(mesh, "position", mesh.position + Vector3(0, -2, 0), 1.0)
    tween.tween_property(mesh, "modulate", Color.TRANSPARENT, 0.5)

func enemy_turn_phase() -> void:
    if battle_over:
        return
    for enemy in get_living("enemy"):
        if not enemy["alive"]:
            continue
        var target = get_living("player")[0]
        var damage = max(8, enemy["attack"] + randi_range(0, 12) - target["defense"])
        apply_damage(target, damage)
        add_log("%s attacks %s for %s damage." % [enemy["name"], target["name"], damage])
        animate_attack(enemy, target)
        if target["hp"] <= 0:
            target["alive"] = false
            if target["mesh_node"]:
                animate_death(target)
        if check_victory():
            return
        await get_tree().create_timer(0.8).timeout
    current_turn += 1

func check_victory() -> bool:
    var player_alive = get_living("player").size()
    var enemy_alive = get_living("enemy").size()

    if player_alive == 0:
        battle_over = true
        add_log("Defeat!")
        return true

    if enemy_alive == 0:
        battle_over = true
        add_log("Victory!")
        return true

    return false

func _on_auto_battle() -> void:
    if battle_over or get_living("player").is_empty():
        return

    var actor = get_living("player")[0]
    var action_index = 0
    var target = get_living("enemy")[0]
    if actor["hp"] < actor["max_hp"] * 0.5:
        action_index = 2
    elif actor["mana"] >= 6 and randi_range(0, 100) > 50:
        action_index = 1

    execute_action(actor, action_index, target)
    animate_attack(actor, target)
    await get_tree().create_timer(1.0).timeout
    if not battle_over:
        enemy_turn_phase()
        refresh_all()
