extends Node3D

var particle_scene = preload("res://scenes/HitEffect.tscn")

func spawn_hit_effect(position: Vector3) -> void:
    var effect = particle_scene.instantiate()
    effect.position = position
    add_child(effect)
    effect.emitting = true
    await get_tree().create_timer(2.0).timeout
    effect.queue_free()

func spawn_heal_effect(position: Vector3) -> void:
    var effect = particle_scene.instantiate()
    effect.position = position
    effect.modulate = Color.GREEN
    add_child(effect)
    effect.emitting = true
    await get_tree().create_timer(2.0).timeout
    effect.queue_free()

func spawn_shield_effect(position: Vector3) -> void:
    var effect = particle_scene.instantiate()
    effect.position = position
    effect.modulate = Color.YELLOW
    add_child(effect)
    effect.emitting = true
    await get_tree().create_timer(2.0).timeout
    effect.queue_free()
