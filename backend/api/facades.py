# facades.py
from .models import ExerciseSession, Question
from .services import ExperienceService, AchievementService  # напишем ниже
from .factories import ExerciseFactory

class ExerciseFacade:
    """Фасад для упрощённого управления сессией упражнений."""
    
    def __init__(self, session):
        self.session = session
        self.exp_service = ExperienceService()
        self.achievement_service = AchievementService()
    
    def submit_answer(self, question_id, user_answer):
        """Обрабатывает ответ пользователя."""
        question = Question.objects.get(id=question_id, session=self.session)
        is_correct = (question.correct_answer == user_answer)
        
        # Обновляем статистику сессии
        question.user_answer = user_answer
        question.is_correct = is_correct
        question.save()
        
        self.session.answered_questions += 1
        if is_correct:
            self.session.correct_answers += 1
        self.session.save()
        
        # Начисляем опыт и проверяем достижения
        self.exp_service.award_experience(self.session.user, 10 if is_correct else 2)
        self.achievement_service.check_achievements(self.session.user)
        
        return is_correct
    
    def get_next_question(self):
        """Возвращает следующий неотвеченный вопрос."""
        return self.session.questions.filter(user_answer__isnull=True).first()
    
    def finish_session(self):
        """Завершает сессию."""
        self.session.status = 'completed'
        self.session.completed_at = timezone.now()
        self.session.save()