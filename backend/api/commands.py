from abc import ABC, abstractmethod

class ExerciseCommand(ABC):
    @abstractmethod
    def execute(self):
        pass

    @abstractmethod
    def undo(self):
        pass

class AnswerQuestionCommand(ExerciseCommand):
    def __init__(self, question, answer, session_facade):
        self.question = question
        self.answer = answer
        self.facade = session_facade
        self.previous_answer = question.user_answer
        self.was_correct = question.is_correct

    def execute(self):
        self.facade.submit_answer(self.question.id, self.answer)

    def undo(self):
        self.question.user_answer = self.previous_answer
        self.question.is_correct = self.was_correct
        self.question.save()
        session = self.question.session
        session.answered_questions -= 1
        if self.was_correct:
            session.correct_answers -= 1
        session.save()
