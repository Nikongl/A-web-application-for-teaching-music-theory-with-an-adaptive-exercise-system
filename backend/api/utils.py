import random
from .models import UserProgress

# Константы, синхронизированные с фронтендом
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
INTERVALS = [
    {'semitones': 3, 'name': 'Малая терция'},
    {'semitones': 4, 'name': 'Большая терция'},
    {'semitones': 5, 'name': 'Кварта'},
    {'semitones': 7, 'name': 'Квинта'},
    {'semitones': 8, 'name': 'Малая секста'},
    {'semitones': 9, 'name': 'Большая секста'},
]
CHORD_TYPES = [
    {'name': 'Мажор', 'pattern': [0, 4, 7]},
    {'name': 'Минор', 'pattern': [0, 3, 7]},
]

def get_octave_range_from_difficulty(difficulty_name):
    name = difficulty_name.lower()
    if 'лёгкая' in name or 'easy' in name:
        return {'min': 4, 'max': 4}
    elif 'средняя' in name or 'medium' in name:
        return {'min': 3, 'max': 4}
    elif 'сложная' in name or 'hard' in name:
        return {'min': 2, 'max': 4}
    else:
        return {'min': 2, 'max': 4}

def get_allowed_notes(note_filter):
    if note_filter == 'white':
        return [n for n in NOTE_NAMES if '#' not in n]
    elif note_filter == 'black':
        return [n for n in NOTE_NAMES if '#' in n]
    else:
        return NOTE_NAMES[:]

# def generate_specific_interval(interval_name, settings, difficulty_name, octave_range):
#     interval = next(i for i in INTERVALS if i['name'] == interval_name)
#     semitones = interval['semitones']
#     min_oct = octave_range['min']
#     max_oct = octave_range['max']
#     if settings.get('min_octave'):
#         min_oct = settings['min_octave']
#     if settings.get('max_octave'):
#         max_oct = settings['max_octave']
#     octave = random.randint(min_oct, max_oct)
#     note_name = random.choice(get_allowed_notes('all'))
#     lower = f"{note_name}{octave}"
#     lower_name = lower[:-1]
#     lower_oct = int(lower[-1])
#     idx = NOTE_NAMES.index(lower_name)
#     new_idx = idx + semitones
#     new_oct = lower_oct
#     if new_idx >= len(NOTE_NAMES):
#         new_idx -= len(NOTE_NAMES)
#         new_oct += 1
#     upper = f"{NOTE_NAMES[new_idx]}{new_oct}"
#     return {'lower': lower, 'upper': upper}


def generate_specific_interval(interval_name, settings, difficulty_name, octave_range):
    # Находим интервал
    interval = None
    for i in INTERVALS:
        if i['name'] == interval_name:
            interval = i
            break
    if interval is None:
        interval = INTERVALS[0]
    semitones = interval['semitones']
    min_oct = octave_range['min']
    max_oct = octave_range['max']
    if settings.get('min_octave'):
        min_oct = settings['min_octave']
    if settings.get('max_octave'):
        max_oct = settings['max_octave']
    
    # Жёстко ограничиваем октавы 2-4 (5 октава недоступна)
    if max_oct > 4:
        max_oct = 4
    if min_oct < 2:
        min_oct = 2
    
    # Получаем список разрешённых нот в диапазоне
    allowed_notes = []
    for octave in range(min_oct, max_oct + 1):
        for note in get_allowed_notes('all'):
            allowed_notes.append(f"{note}{octave}")
    
    # Пытаемся найти подходящую пару нот
    max_attempts = 50
    for attempt in range(max_attempts):
        lower = random.choice(allowed_notes)
        lower_name = lower[:-1]
        lower_oct = int(lower[-1])
        idx = NOTE_NAMES.index(lower_name)
        new_idx = idx + semitones
        new_oct = lower_oct
        if new_idx >= len(NOTE_NAMES):
            new_idx -= len(NOTE_NAMES)
            new_oct += 1
        
        upper = f"{NOTE_NAMES[new_idx]}{new_oct}"
        upper_oct = int(upper[-1])
        
        # Проверяем, что обе ноты в диапазоне
        if min_oct <= lower_oct <= max_oct and min_oct <= upper_oct <= max_oct:
            return {'lower': lower, 'upper': upper}
    
    # Если не нашли за 50 попыток, возвращаем простой вариант в пределах одной октавы
    # Берём ноту C4 и строим интервал от неё
    lower = f"C{min_oct}"
    lower_name = "C"
    lower_oct = min_oct
    idx = NOTE_NAMES.index(lower_name)
    new_idx = idx + semitones
    new_oct = lower_oct
    if new_idx >= len(NOTE_NAMES):
        new_idx -= len(NOTE_NAMES)
        new_oct += 1
    
    # Если вышли за пределы, уменьшаем октаву
    if new_oct > max_oct:
        new_oct = max_oct
    upper = f"{NOTE_NAMES[new_idx]}{new_oct}"
    
    return {'lower': lower, 'upper': upper}

# def generate_specific_chord(chord_type, settings, difficulty_name, octave_range):
#     chord = next(c for c in CHORD_TYPES if c['name'] == chord_type)
#     pattern = chord['pattern']
#     min_oct = octave_range['min']
#     max_oct = octave_range['max']
#     if settings.get('min_octave'):
#         min_oct = settings['min_octave']
#     if settings.get('max_octave'):
#         max_oct = settings['max_octave']
#     octave = random.randint(min_oct, max_oct)
#     tonic_name = random.choice(get_allowed_notes('all'))
#     tonic = f"{tonic_name}{octave}"
#     tonic_letter = tonic_name
#     tonic_oct = octave
#     idx = NOTE_NAMES.index(tonic_letter)
#     chord_notes = []
#     for semitone in pattern:
#         new_idx = idx + semitone
#         new_oct = tonic_oct
#         if new_idx >= len(NOTE_NAMES):
#             new_idx -= len(NOTE_NAMES)
#             new_oct += 1
#         chord_notes.append(f"{NOTE_NAMES[new_idx]}{new_oct}")
#     chord_name = f"{tonic_letter} {chord_type}"
#     return {'tonic': tonic, 'chordNotes': chord_notes, 'chordName': chord_name}


def generate_specific_chord(chord_type, settings, difficulty_name, octave_range):
    # Находим тип аккорда, если не найден — берём первый из списка
    chord = None
    for c in CHORD_TYPES:
        if c['name'] == chord_type:
            chord = c
            break
    if chord is None:
        chord = CHORD_TYPES[0]
    pattern = chord['pattern']
    min_oct = octave_range['min']
    max_oct = octave_range['max']
    if settings.get('min_octave'):
        min_oct = settings['min_octave']
    if settings.get('max_octave'):
        max_oct = settings['max_octave']
    octave = random.randint(min_oct, max_oct)
    tonic_name = random.choice(get_allowed_notes('all'))
    tonic = f"{tonic_name}{octave}"
    tonic_letter = tonic_name
    tonic_oct = octave
    idx = NOTE_NAMES.index(tonic_letter)
    chord_notes = []
    for semitone in pattern:
        new_idx = idx + semitone
        new_oct = tonic_oct
        if new_idx >= len(NOTE_NAMES):
            new_idx -= len(NOTE_NAMES)
            new_oct += 1
        chord_notes.append(f"{NOTE_NAMES[new_idx]}{new_oct}")
    chord_name = f"{tonic_letter} {chord_type}"
    return {'tonic': tonic, 'chordNotes': chord_notes, 'chordName': chord_name}