from .models import Question

class ExerciseFactory:
    @staticmethod
    def create_exercise(exercise_type_code, session, question_data, correct_answer):
        if exercise_type_code == 'notes':
            return Question.objects.create(
                session=session,
                question_data=question_data,
                correct_answer=correct_answer
            )
        elif exercise_type_code == 'intervals':
            return Question.objects.create(
                session=session,
                question_data=question_data,
                correct_answer=correct_answer
            )
        elif exercise_type_code == 'chords':
            return Question.objects.create(
                session=session,
                question_data=question_data,
                correct_answer=correct_answer
            )
        else:
            raise ValueError(f"Unknown exercise type: {exercise_type_code}")
