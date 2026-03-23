# В patterns.py добавим фабрику для создания упражнений
class ExerciseFactory:
    @staticmethod
    def create_exercise(exercise_type, **kwargs):
        if exercise_type == 'note':
            return NoteExercise.objects.create(**kwargs)
        elif exercise_type == 'interval':
            return IntervalExercise.objects.create(**kwargs)
        elif exercise_type == 'chord':
            return ChordExercise.objects.create(**kwargs)
        raise ValueError(f"Unknown exercise type: {exercise_type}")