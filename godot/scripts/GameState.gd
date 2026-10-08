extends Node

const SAVE_PATH = "user://rpg_full_save.json"

var player_classes: Array = []
var party_names: Array = ["Astra", "Brann", "Lyra"]
var gold: int = 150
var inventory: Array = ["Potion", "Mana Gem", "Iron Ore"]
var boss_defeated: int = 0
var arena_wins: int = 0
var level: int = 1
var xp: int = 0
var selected_region: String = "Crystal Ruins"
var last_battle_result: String = "None"
var last_message: String = "Ready for battle."

func _ready() -> void:
    load_game()

func reset_progress() -> void:
    player_classes.clear()
    gold = 150
    inventory = ["Potion", "Mana Gem", "Iron Ore"]
    boss_defeated = 0
    arena_wins = 0
    level = 1
    xp = 0
    selected_region = "Crystal Ruins"
    last_battle_result = "None"
    last_message = "Ready for battle."
    save_game()

func save_game() -> void:
    var data = {
        "player_classes": player_classes,
        "party_names": party_names,
        "gold": gold,
        "inventory": inventory,
        "boss_defeated": boss_defeated,
        "arena_wins": arena_wins,
        "level": level,
        "xp": xp,
        "selected_region": selected_region,
        "last_battle_result": last_battle_result,
        "last_message": last_message,
    }
    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file:
        file.store_string(JSON.stringify(data))
        file.close()

func load_game() -> void:
    if not FileAccess.file_exists(SAVE_PATH):
        return

    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    if file == null:
        return

    var text = file.get_as_text()
    file.close()

    if text.strip_edges() == "":
        return

    var parsed = JSON.parse_string(text)
    if typeof(parsed) != TYPE_DICTIONARY:
        return

    player_classes = parsed.get("player_classes", [])
    party_names = parsed.get("party_names", ["Astra", "Brann", "Lyra"])
    gold = int(parsed.get("gold", 150))
    inventory = parsed.get("inventory", ["Potion", "Mana Gem", "Iron Ore"])
    boss_defeated = int(parsed.get("boss_defeated", 0))
    arena_wins = int(parsed.get("arena_wins", 0))
    level = int(parsed.get("level", 1))
    xp = int(parsed.get("xp", 0))
    selected_region = str(parsed.get("selected_region", "Crystal Ruins"))
    last_battle_result = str(parsed.get("last_battle_result", "None"))
    last_message = str(parsed.get("last_message", "Ready for battle."))

func add_xp(amount: int) -> void:
    xp += amount
    while xp >= 100:
        xp -= 100
        level += 1
        gold += 25
    save_game()

func add_inventory(item: String) -> void:
    if not inventory.has(item):
        inventory.append(item)
    save_game()

func award_victory() -> void:
    arena_wins += 1
    gold += 120
    add_xp(35)
    last_battle_result = "Victory"
    last_message = "Victory! Reward claimed."
    save_game()

func award_defeat() -> void:
    gold = max(0, gold - 25)
    last_battle_result = "Defeat"
    last_message = "Defeat. Training grounds require another push."
    save_game()

func set_region(region: String) -> void:
    selected_region = region
    save_game()
