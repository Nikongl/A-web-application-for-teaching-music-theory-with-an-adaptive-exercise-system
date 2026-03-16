from django.test import TestCase
from rest_framework.test import APIClient
from .models import ExerciseType

class BasicApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        ExerciseType.objects.create(name="Test", order=1)

    def test_exercise_types_list(self):
        res = self.client.get("/api/exercise-types/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)