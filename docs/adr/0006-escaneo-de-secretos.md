# 0006 — Cómo se escanea la llave de servicio

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

El primer intento fue un `grep -r 'service_role'` sobre todo el repo. Falló en
el primer despliegue, y por dos razones distintas:

1. **Se encontró a sí mismo.** La documentación menciona `service_role` justo
   para advertir que no debe subirse, igual que los comentarios del SQL.
2. **No detectaba lo peligroso.** Una llave real es un JWT: el rol viaja
   codificado en base64 dentro del payload, así que la palabra nunca aparece
   en claro. Y en `dist/` la palabra sí aparece, pero porque el propio SDK de
   Supabase la menciona en su código.

Es decir: fallaba siempre, y por los motivos equivocados. Un check así acaba
desactivado por ruidoso, que es lo peor que le puede pasar a una barrera.

## Decisión

`scripts/check-secrets.sh`, con dos capas:

1. La palabra literal **solo en `src/`**, que es código nuestro.
2. Cualquier JWT en `src/`, `dist/` y `.env*` se **decodifica** y se revisa su
   payload. Esto es lo que atrapa una llave de verdad pegada por descuido.

El script se verifica en los dos sentidos: con el repo limpio debe pasar, y
con un JWT de servicio falso debe fallar.

## Consecuencias

- Detecta lo que importa y no grita por documentación.
- Corre en `npm run verify` y en CI después de construir, para que también vea
  el bundle.
- Si algún día cambia el formato de las llaves de Supabase, este script hay
  que revisarlo: asume un JWT de tres partes.
