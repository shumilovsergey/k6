тестовый стенд

Развернуть docker-compose.yml со службами:

frontend: Nginx раздаёт статический HTML c одной кнопкой «Read», одной «Write».

back-go: HTTP-API с /read, /write, connection pool к БД.

back-python HTTP-API с /read, /write, connection pool к БД.

пусть в docker-composed будет два back end с одинаковыми портами - один сервис пусть будет закомментирован 

чтобы можно было выбирать

postgres: одиночный экземпляр, примитивная схема (таблица items(id, payload, created_at)), индексы по id/created_at.

(опц.) pgbouncer перед БД (stand-by, выключен по умолчанию).

---

test 

Подготовить k6-скрипт, прогнать 3 профиля (90/10, 70/30, 50/50).

Рампа: 0 → X VUs за 2–3 мин, плато 5–10 мин, спад 1–2 мин.

Снять метрики: k6 summary, docker stats, pg_stat_statements, pg_locks, iowait.

Артефакт: таблица результатов «1 VDS».

---

runing 

  Test Python:
  ./test-backend.sh python

  Test Go:
  ./test-backend.sh go

  Test Go + pgbouncer:
  ./test-backend.sh pgbouncer