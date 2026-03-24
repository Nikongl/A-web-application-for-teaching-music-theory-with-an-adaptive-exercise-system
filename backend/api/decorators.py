class QuestionDecorator:
    def __init__(self, question):
        self.question = question

    def get_display_text(self):
        return self.question.question_data.get('text', '')

    def get_hint(self):
        return None

class HintDecorator(QuestionDecorator):
    def __init__(self, question, hint_text):
        super().__init__(question)
        self.hint_text = hint_text

    def get_hint(self):
        return self.hint_text

    def get_display_text(self):
        return f"{self.question.question_data.get('text', '')} (подсказка: {self.hint_text})"

class TimeLimitedDecorator(QuestionDecorator):
    def __init__(self, question, time_limit_seconds):
        super().__init__(question)
        self.time_limit = time_limit_seconds

    def get_time_limit(self):
        return self.time_limit
