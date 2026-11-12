# 0003 — Aritmética de fechas sin `Date`

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

Un concepto pertenece a un **día**. El atajo habitual,
`new Date().toISOString().slice(0, 10)`, devuelve la fecha en UTC: a las 7 de la
noche en CDMX eso ya es el día siguiente, así que un concepto entregado de noche
caería en el día equivocado y la meta del día se vería incumplida.

## Decisión

`IsoDate` es un tipo *branded* y toda la aritmética usa el algoritmo de días
civiles de Hinnant: enteros, sin construir un solo `Date`. El único contacto con
el reloj es `todayIso(now: Date)`, que lee los componentes **locales** del `Date`
que recibe desde fuera. El lint prohíbe `new Date`, `Date.now` y `Math.random`
dentro de `src/domain/`.

## Consecuencias

- No hay zonas horarias ni horario de verano por los que colarse.
- La suite de fechas corre con `TZ=America/Mexico_City` y `TZ=UTC` en CI;
  se verificó además con `Asia/Tokyo` y `Pacific/Kiritimati` (UTC+14).
- `delivered_at` sí es un instante absoluto, pero es solo para auditoría: nunca
  se usa para agrupar por día.
- Validar una fecha es un viaje redondo: `2026-02-30` normaliza a otra fecha y
  por eso se detecta, sin necesidad de comprobar rangos a mano.
