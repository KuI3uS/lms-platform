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
