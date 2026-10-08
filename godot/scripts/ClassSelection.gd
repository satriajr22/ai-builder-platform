extends Control

const CLASSES = ["Knight", "Mage", "Ranger", "Guardian", "Berserker", "Witch"]
const CLASS_DESCRIPTIONS = {
    "Knight": "High HP, tank build",
    "Mage": "Spell burst specialist",
    "Ranger": "Fast burst damage",
    "Guardian": "Defense anchor",
    "Berserker": "Heavy melee damage",
    "Witch": "Mana control caster",
}

var selected_classes: Array = []
var class_buttons: Dictionary = {}

@onready var grid: GridContainer = $GridContainer
@onready var confirm_btn: Button = $ConfirmBtn

func _ready() -> void:
    for class_name in CLASSES:
        var btn = Button.new()
        btn.text = class_name + "\n" + CLASS_DESCRIPTIONS[class_name]
        btn.custom_minimum_size = Vector2(260, 170)
        btn.pressed.connect(_on_class_selected.bind(class_name))
        grid.add_child(btn)
        class_buttons[class_name] = btn

    confirm_btn.pressed.connect(_on_start_battle)

func _on_class_selected(class_name: String) -> void:
    if class_name in selected_classes:
        selected_classes.erase(class_name)
        class_buttons[class_name].modulate = Color.WHITE
        return

    if selected_classes.size() >= 3:
        return

    selected_classes.append(class_name)
    class_buttons[class_name].modulate = Color.GOLD

func _on_start_battle() -> void:
    if selected_classes.size() != 3:
        return

    GameState.player_classes = selected_classes
    GameState.save_game()
    get_tree().change_scene_to_file("res://scenes/WorldMap.tscn")
