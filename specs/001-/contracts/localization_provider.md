# Contract: LocalizationProvider

## Responsibility
Serve localized interface strings.

## Interface
```python
def load(locale: str) -> None: ...
def t(key: str, locale: str | None = None) -> str: ...
```

## Rules
- Fallback to 'en' if key missing in target locale
- Resource files stored under `i18n/{locale}.json`

## Tests
- Missing key fallback
- Locale switch does not require restart
