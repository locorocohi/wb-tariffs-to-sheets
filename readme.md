## Переменные окружения

Скопируйте `example.env` в `.env` и задайте значения.

- `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — подключение к PostgreSQL (для контейнера `app` хост задаётся в compose: `postgres`).
- `APP_PORT` — порт приложения (по умолчанию 5000).
- `WB_API_TOKEN` — токен для API Wildberries. Без токена запросы к WB не выполняются.
- `GOOGLE_CREDENTIALS_PATH` — путь к JSON-файлу ключа сервисного аккаунта Google (локально: `credentials/credentials.json`; в Docker: `/app/credentials/credentials.json` — папка `credentials/` монтируется в контейнер из корня проекта).
- `GOOGLE_SERVICE_ACCOUNT_JSON` — альтернатива: строка JSON с ключом сервисного аккаунта (удобно для Docker без монтирования файлов).
- `TARIFS_FETCH_INTERVAL_MS` — интервал запроса тарифов WB, мс (по умолчанию 3600000 = 1 раз в час).
- `SHEETS_SYNC_INTERVAL_MS` — интервал обновления Google-таблиц, мс (по умолчанию 1800000 = 1 раз в 30 минут).
- **`SPREADSHEET_IDS`** — идентификаторы Google-таблиц через запятую (ID из URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`). В каждой таблице должен быть лист с именем `stocks_coefs`.

Хотя бы один из `GOOGLE_CREDENTIALS_PATH` или `GOOGLE_SERVICE_ACCOUNT_JSON` нужен для синхронизации с Google Sheets.

---

## Google-таблицы
### Настройка доступа

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/).
2. Включите **Google Sheets API**. (APIs & Services → Google Sheets API → Enable)
3. Создайте сервисный аккаунт (Credentials → Create credentials → Service account), скачайте JSON-ключ.
4. Дайте доступ к таблице: в JSON найдите `client_email`, откройте Google-таблицу → Поделиться → добавьте этот email с правом «Редактор».

### Таблицы и лист
- Список таблиц задаётся в `.env` переменной **`SPREADSHEET_IDS`** (ID через запятую).
- В каждой таблице должен быть **лист с именем `stocks_coefs`** — в него записываются тарифы (заголовок + строки, отсортированные по возрастанию коэффициента).

Пример в `.env`:

```env
SPREADSHEET_IDS=abc123xyz,def456uvw
```

### Быстрый старт с одной таблицей
1. Создайте Google-таблицу, переименуйте первый лист в `stocks_coefs`.
2. Создайте сервисный аккаунт и JSON-ключ.
   - **Docker:** либо положите ключ в `credentials/credentials.json` в корне проекта, либо задайте в `.env` переменную `GOOGLE_SERVICE_ACCOUNT_JSON` (весь JSON одной строкой) — тогда файл не нужен.
3. Настроить доступ к таблице для email сервисного аккаунта (из JSON).
4. Скопируйте ID таблицы из URL и в `.env` добавьте: `SPREADSHEET_IDS=ваш_id`.
5. Выполнить команду

```bash
docker compose up --build     
```

После старта в логах должны быть сообщения о выполнении миграций и о запуске планировщика.
