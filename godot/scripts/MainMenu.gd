extends Control

@onready var new_game_btn: Button = $VBoxContainer/NewGameBtn
@onready var load_game_btn: Button = $VBoxContainer/LoadGameBtn
@onready var quit_btn: Button = $VBoxContainer/QuitBtn

func _ready() -> void:
    new_game_btn.pressed.connect(_on_new_game)
    load_game_btn.pressed.connect(_on_load_game)
    quit_btn.pressed.connect(_on_quit)

func _on_new_game() -> void:
    get_tree().change_scene_to_file("res://scenes/ClassSelection.tscn")

func _on_load_game() -> void:
    get_tree().change_scene_to_file("res://scenes/BattleArena3D.tscn")

func _on_quit() -> void:
    get_tree().quit()
