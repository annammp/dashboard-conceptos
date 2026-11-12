#!/usr/bin/env bash
# Comprueba que las fronteras entre capas se estén aplicando de verdad.
#
# Una regla de lint que nunca dispara da una falsa sensación de seguridad. Este
# script mete violaciones a propósito y exige que el lint FALLE en cada una.
# Es idempotente: siempre borra lo que creó, incluso si algo sale mal.
set -uo pipefail
cd "$(dirname "$0")/.."

TMP_FILES=()
cleanup() { for f in "${TMP_FILES[@]:-}"; do rm -f "$f"; done; }
trap cleanup EXIT

fallos=0

espera_error() {
  local descripcion="$1" archivo="$2" contenido="$3"
  mkdir -p "$(dirname "$archivo")"
  printf '%s\n' "$contenido" > "$archivo"
  TMP_FILES+=("$archivo")
  if npx eslint "$archivo" >/dev/null 2>&1; then
    printf '  ✗ %s — el lint NO falló, la frontera no se está aplicando\n' "$descripcion"
    fallos=$((fallos + 1))
  else
    printf '  ✓ %s\n' "$descripcion"
  fi
  rm -f "$archivo"
}

echo "Verificando que las fronteras de la arquitectura se apliquen:"

espera_error "el dominio no puede importar React" \
  "src/domain/__check.ts" \
  "import { useState } from 'react';
export const roto = useState;"

espera_error "el dominio no puede importar el SDK de Supabase" \
  "src/domain/__check.ts" \
  "import { createClient } from '@supabase/supabase-js';
export const roto = createClient;"

espera_error "el dominio no puede leer el reloj del sistema" \
  "src/domain/__check.ts" \
  "export const ahora = (): number => Date.now();"

espera_error "el dominio no puede generar aleatorios" \
  "src/domain/__check.ts" \
  "export const id = (): number => Math.random();"

espera_error "la UI no puede importar un adaptador de datos" \
  "src/ui/dashboard/__check.ts" \
  "import { algo } from '../../data/local/storage';
export const roto = algo;"

espera_error "la UI no puede importar el SDK de Supabase" \
  "src/ui/dashboard/__check.ts" \
  "import { createClient } from '@supabase/supabase-js';
export const roto = createClient;"

espera_error "el estado no puede importar un adaptador concreto" \
  "src/state/__check.ts" \
  "import { algo } from '../data/supabase/client';
export const roto = algo;"

espera_error "un puerto no puede depender de la UI" \
  "src/ports/__check.ts" \
  "import type { Algo } from '../ui/layout/AppShell';
export type Roto = Algo;"

if [ "$fallos" -gt 0 ]; then
  printf '\n%s frontera(s) sin aplicar.\n' "$fallos"
  exit 1
fi
printf '\nTodas las fronteras se están aplicando.\n'
