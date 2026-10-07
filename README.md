# lms-platform

## Hasła i ochrona repozytorium

Hasła poczty i bazy danych oraz klucze API ustawiaj wyłącznie w zmiennych
środowiska backendu. Konfiguracja poczty odczytuje `MAIL_USERNAME` i
`MAIL_PASSWORD`. Pliki `.env` i `.env.*` są ignorowane przez Git; przykłady
z końcówką `.example` mogą zawierać tylko puste pola lub nazwy zmiennych.

Włącz lokalne sprawdzanie zmian przed commitem:

```sh
sh scripts/install-gitleaks.sh
git config core.hooksPath .githooks
```

Skaner Gitleaks sprawdza dodawane zmiany, w tym hasła SMTP, i ukrywa wartości
sekretów w wynikach. GitHub sprawdza całą historię pod kątem haseł SMTP oraz
wszystkie nowe zmiany pod kątem pozostałych sekretów, przy każdym pushu
i zgłoszeniu zmian. Starsza historia zawiera także dawny klucz JWT; jeżeli
jest nadal używany jako `JWT_SECRET`, trzeba go zmienić w hostingu backendu.
Skan nie zastępuje unieważnienia ujawnionego hasła
ani ochrony przed pushem w ustawieniach GitHub.

Jeżeli hasło aplikacji Gmail wyciekło, usuń stare hasło w ustawieniach konta Google
(`Bezpieczeństwo → Hasła aplikacji`), wygeneruj nowe i ustaw je jako
`MAIL_PASSWORD` w panelu hostingu backendu. Następnie sprawdź wysyłanie wiadomości.
Nie wklejaj nowego hasła do kodu, dokumentacji ani czatu.

Po oczyszczeniu historii używaj świeżych klonów na innych komputerach i w
automatyzacjach. Połączenie starej historii z nową może przywrócić wyciek.
GitHub może nadal przechowywać stare commity w pamięci podręcznej; samo
przepisanie historii nie unieważnia hasła i nie czyści cudzych kopii repozytorium.

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

## Płatności 30-dniowe (Stripe Checkout)

Tryb kursu `30 dni` pozwala uczniowi wybrać:

- jednorazowy dostęp na 30 dni bez odnowienia,
- abonament odnawiany automatycznie co miesiąc.

Backend wymaga poniższych sekretów:

```text
STRIPE_API_KEY=...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://edu-hub.com.pl
```

W Stripe Dashboard włącz metody płatności: karty, Apple Pay, BLIK i Revolut Pay.
Checkout sam pokazuje klientowi tylko metody obsługiwane dla jego urządzenia,
waluty i rodzaju płatności. BLIK jest przeznaczony głównie do płatności
jednorazowej i może nie pojawić się przy abonamencie.

Webhook powinien wskazywać publiczny adres backendu:

```text
https://ADRES-BACKENDU/api/payments/stripe/webhook
```

Zdarzenia wymagane przez webhook:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
invoice.paid
invoice.payment_failed
customer.subscription.deleted
```

Klucza API oraz sekretu webhooka nigdy nie umieszczaj we frontendzie ani w Git.
