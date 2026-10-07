# lms-platform

## Ochrona rejestracji

Rejestracja jest chroniona przez blokadę jednorazowych domen email oraz limity prób:

- maksymalnie 5 prób z jednego adresu IP w ciągu 15 minut,
- maksymalnie 3 próby dla jednego adresu email w ciągu 15 minut,
- codziennie aktualizowaną listę domen tymczasowych oraz lokalną listę awaryjną.

Limity można zmienić zmiennymi backendu:

```text
REGISTRATION_RATE_LIMIT_WINDOW_MINUTES=15
REGISTRATION_RATE_LIMIT_MAX_PER_IP=5
REGISTRATION_RATE_LIMIT_MAX_PER_EMAIL=3
DISPOSABLE_EMAIL_BLOCKING_ENABLED=true
```

Dodatkowe domeny rozdzielaj przecinkami w `DISPOSABLE_EMAIL_EXTRA_BLOCKED`. Wyjątki,
które mimo obecności na liście mają być dozwolone, dodaj do `DISPOSABLE_EMAIL_ALLOWED`.

## Naturalne głosy dialogów (ElevenLabs)

Dialogi językowe korzystają z dwóch stałych głosów: kobiecego i męskiego. Backend
generuje nagranie tylko przy pierwszym odsłuchaniu danej wypowiedzi, a następnie
zapisuje plik MP3 w MySQL. Kolejne odsłuchania nie zużywają kredytów ElevenLabs.

W panelu hostingu backendu ustaw:

```text
ELEVENLABS_API_KEY=...
ELEVENLABS_FEMALE_VOICE_ID=...   # identyfikator głosu Vanessa
ELEVENLABS_MALE_VOICE_ID=...     # identyfikator głosu Jacob
```

Opcjonalne ustawienia:

```text
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.50
ELEVENLABS_SIMILARITY_BOOST=0.75
ELEVENLABS_STYLE=0.0
ELEVENLABS_SPEED=0.95
ELEVENLABS_SPEAKER_BOOST=true
```

Do zmiennych należy wkleić **Voice ID**, a nie widoczną nazwę głosu. Klucza API
nie zapisuj w repozytorium ani we frontendzie. Gdy konfiguracji brakuje albo usługa
chwilowo nie działa, odtwarzacz automatycznie używa głosu dostępnego w przeglądarce.
