from abc import ABC, abstractmethod

class SessionState(ABC):
    @abstractmethod
    def start(self, session):
        pass

    @abstractmethod
    def answer(self, session, question, answer):
        pass

    @abstractmethod
    def complete(self, session):
        pass

class InProgressState(SessionState):
    def start(self, session):
        pass

    def answer(self, session, question, answer):
        return True

    def complete(self, session):
        session.status = 'completed'
        session.save()
        session.state = CompletedState()

class CompletedState(SessionState):
    def start(self, session):
        raise Exception("Сессия уже завершена")

    def answer(self, session, question, answer):
        raise Exception("Сессия завершена, нельзя отвечать")

    def complete(self, session):
        pass
