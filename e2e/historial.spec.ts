import { expect, irA, registrar, test } from './fixtures';
import { HOY } from './fixtures';

test.describe('historial, navegación y exportación', () => {
  test('navegar a un día anterior lo muestra vacío y se puede volver a hoy', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    await expect(page.getByRole('heading', { name: /12 de noviembre/ })).toBeVisible();

    await page.getByRole('button', { name: 'Día anterior' }).click();

    await expect(page.getByRole('heading', { name: /11 de noviembre/ })).toBeVisible();
    await expect(page.getByText('Nada por aquí todavía.').first()).toBeVisible();

    await page.getByRole('button', { name: 'Volver a hoy' }).click();
    await expect(page.getByRole('heading', { name: /12 de noviembre/ })).toBeVisible();
  });

  test('no se puede navegar al futuro', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Día siguiente' })).toBeDisabled();
  });

  /** La tabla oculta es lo que leen los lectores de pantalla: ahí se asertan los números. */
  test('la gráfica expone los mismos números en su tabla equivalente', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    await page.getByRole('button', { name: 'Entregado', exact: true }).click();

    await irA(page, 'Historial');
    await page.getByRole('group').getByText('Ver los números').click();

    const fila = page.getByRole('row').filter({ hasText: '12 de noviembre' });
    await expect(fila).toContainText('1');
    await expect(fila).toContainText('8');
  });

  test('el enlace directo al historial funciona tras recargar', async ({ page }) => {
    await page.goto(`/#/historial`);
    await expect(page.getByRole('heading', { name: 'Entregados por día' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Entregados por día' })).toBeVisible();
  });

  test('exportar descarga un CSV con los acentos intactos', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    await page.getByRole('textbox', { name: /Título del concepto/ }).fill('Campaña de otoño, v2');

    await irA(page, 'Historial');
    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const archivo = await descarga;

    expect(archivo.suggestedFilename()).toContain(HOY);
    const ruta = await archivo.path();
    const contenido = await (await import('node:fs/promises')).readFile(ruta, 'utf8');
    expect(contenido.startsWith('﻿')).toBe(true);
    expect(contenido).toContain('"Campaña de otoño, v2"');
    expect(contenido).toContain('En progreso');
  });
});
