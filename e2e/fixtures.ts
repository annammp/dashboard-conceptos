/**
 * Base de las pruebas end-to-end.
 *
 * El reloj se fija y la zona horaria se declara en la config, así que "hoy" es
 * siempre el mismo día: una prueba no se rompe por correr a medianoche. Cada
 * caso arranca con un contexto limpio, así que el almacenamiento parte vacío y
 * la app se siembra sola con dos editores de meta 4.
 */

import { test as base, expect, type Page } from '@playwright/test';

export const HOY = '2026-11-12';
const MEDIODIA_EN_CDMX = new Date('2026-11-12T18:00:00.000Z');

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(MEDIODIA_EN_CDMX);
    await page.goto('/');
    await use(page);
  },
});

/** Abre la app como alguien del equipo: ve todo, no puede editar nada. */
export const abrirEnSoloLectura = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    window.localStorage.setItem('conceptos.readonly', '1');
  });
  await page.goto('/');
};

export const registrar = async (page: Page, editor: string, cantidad: 1 | 4): Promise<void> => {
  const etiqueta =
    cantidad === 1 ? `+1 concepto para ${editor}` : `+4 conceptos para ${editor}`;
  await page.getByRole('button', { name: etiqueta }).click();
};

export const columna = (page: Page, nombre: string) =>
  page.getByRole('region', { name: nombre });

/**
 * Siempre con nombre exacto: "Ajustes" en modo laxo también casa con el botón
 * "En ajustes" de las tarjetas, y "Hoy" con "Volver a hoy".
 */
export const irA = async (page: Page, vista: 'Hoy' | 'Historial' | 'Ajustes'): Promise<void> => {
  await page.getByRole('button', { name: vista, exact: true }).click();
};

/** Las tarjetas se cuentan por su campo de título, que es lo que las distingue. */
export const tarjetasEn = (page: Page, nombreColumna: string) =>
  columna(page, nombreColumna).getByRole('textbox', { name: /Título del concepto/ });

export { expect };
