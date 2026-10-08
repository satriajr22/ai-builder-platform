extends Control

const CLASSES = ["Knight", "Mage", "Ranger", "Guardian", "Berserker", "Witch"]
const CLASS_DESCRIPTIONS = {
    "Knight": "High HP, balanced attack/defense",
    "Mage": "High mana, powerful spells",
    "Ranger": "Fast, high attack speed",
    "Guardian": "Highest defense",
    "Berserker": "Highest attack power",
    "Witch": "Versatile spellcaster",
}

var selected_classes: Array = []
var class_buttons: Dictionary = {}

@onready var grid: GridContainer = $GridContainer
@onready var confirm_btn: Button = $ConfirmBtn

func _ready() -> void:
    for class_name in CLASSES:
        var btn = Button.new()
        btn.text = class_name + "\n" + CLASS_DESCRIPTIONS[class_name]
        btn.custom_minimum_size = Vector2(300, 200)
        btn.pressed.connect(_on_class_selected.bindv([class_name]))
        grid.add_child(btn)
        class_buttons[class_name] = btn
    
    confirm_btn.pressed.connect(_on_start_battle)

func _on_class_selected(class_name: String) -> void:
    if class_name in selected_classes:
        selected_classes.erase(class_name)
        class_buttons[class_name].modulate = Color.WHITE
    else:
        if selected_classes.size() < 3:
            selected_classes.append(class_name)
            class_buttons[class_name].modulate = Color.YELLOW

func _on_start_battle() -> void:
    if selected_classes.size() == 3:
        GameState.player_classes = selected_classes
        get_tree().change_scene_to_file("res://scenes/BattleArena3D.tscn")
