extends Control

@onready var stats_vbox: VBoxContainer = $StatsPanel/StatsVBox
@onready var arena_btn: Button = $RegionButtons/ArenaBtn
@onready var boss_btn: Button = $RegionButtons/BossBtn
@onready var guild_btn: Button = $RegionButtons/GuildBtn
@onready var battle_btn: Button = $". /BattleBtn"

var selected_region: String = "Crystal Ruins"

func _ready() -> void:
    GameState.load_game()
    selected_region = GameState.selected_region
    arena_btn.pressed.connect(_on_select_region.bind("Crystal Ruins"))
    boss_btn.pressed.connect(_on_select_region.bind("Eclipse Fortress"))
    guild_btn.pressed.connect(_on_select_region.bind("Sky Market"))
    battle_btn.pressed.connect(_on_enter_battle)
    _refresh_ui()

func _on_select_region(region: String) -> void:
    selected_region = region
    GameState.set_region(region)
    _refresh_ui()

func _on_enter_battle() -> void:
    get_tree().change_scene_to_file("res://scenes/BattleArena3D.tscn")

func _refresh_ui() -> void:
    while stats_vbox.get_child_count() > 0:
        var child = stats_vbox.get_child(0)
        stats_vbox.remove_child(child)
        child.queue_free()

    var labels = [
        "Hero Level: %s" % GameState.level,
        "XP: %s/100" % GameState.xp,
        "Gold: %s" % GameState.gold,
        "Bosses Defeated: %s" % GameState.boss_defeated,
        "Arena Wins: %s" % GameState.arena_wins,
        "Region: %s" % selected_region,
        "Inventory: %s" % ", ".join(GameState.inventory)
    ]

    for text in labels:
        var label = Label.new()
        label.text = text
        stats_vbox.add_child(label)
