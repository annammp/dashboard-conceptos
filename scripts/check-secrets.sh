#!/usr/bin/env bash
# Comprueba que no se haya colado una llave de servicio de Supabase.
#
# Dos capas, y ninguna es la obvia:
#
#  1. La palabra literal SOLO en `src/`. En la documentación se menciona a
#     propósito (para advertir que no debe estar) y en `dist/` la menciona el
#     propio SDK de Supabase en su código. Buscarla en todo el repo hace que
#     el check se encuentre a sí mismo y no detecte nada útil.
#
#  2. Un JWT cuyo payload diga `service_role`. Esto es lo único que de verdad
#     peligra, y la búsqueda por palabra NO lo encontraría: el rol viaja
#     codificado en base64 dentro del token.
set -uo pipefail
cd "$(dirname "$0")/.."

fallos=0

if [ -d src ] && grep -rIlq 'service_role' src 2>/dev/null; then
  printf '  ✗ "service_role" aparece en estos archivos de src/:\n'
  grep -rIl 'service_role' src | sed 's/^/      /'
  fallos=$((fallos + 1))
fi

decodifica_payload() {
  local payload="$1"
  while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="${payload}="; done
  printf '%s' "$payload" | tr '_-' '/+' | base64 -d 2>/dev/null || true
}

jwts=$(grep -rIoh -E 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}' \
         src dist .env.local .env 2>/dev/null | sort -u || true)

if [ -n "$jwts" ]; then
  while IFS= read -r jwt; do
    [ -z "$jwt" ] && continue
    if decodifica_payload "${jwt#*.}" | grep -q 'service_role'; then
      printf '  ✗ Hay un JWT con rol service_role (empieza por %s…)\n' "${jwt:0:16}"
      fallos=$((fallos + 1))
    fi
  done <<< "$jwts"
fi

if [ "$fallos" -gt 0 ]; then
  printf '\nLa llave service_role nunca va al repo ni al bundle. Quítala y rota la llave.\n'
  exit 1
fi
printf '  ✓ Sin llaves de servicio en el código ni en el bundle.\n'
