import { expect, irA, registrar, tarjetasEn, test } from './fixtures';

test.describe('metas y editores', () => {
  test('cambiar la meta de 4 a 5 recalcula el faltante y la de equipo', async ({ page }) => {
    await irA(page, 'Ajustes');
    await page.getByRole('spinbutton', { name: 'Meta diaria' }).first().fill('5');

    await expect(page.getByText(/Se calcula sola/)).toContainText('9');

    await irA(page, 'Hoy');
    await expect(page.getByText('Faltan 5 conceptos').first()).toBeVisible();
  });

  test('agregar un editor sube la meta de equipo', async ({ page }) => {
    await irA(page, 'Ajustes');
    await page.getByRole('textbox', { name: 'Nombre del editor' }).fill('Carla');
    await page.getByRole('button', { name: 'Agregar editor' }).click();

    await expect(page.getByText(/Se calcula sola/)).toContainText('12');

    await irA(page, 'Hoy');
    await expect(page.getByRole('button', { name: '+1 concepto para Carla' })).toBeVisible();
  });

  test('desactivar un editor lo saca de la medición sin perder su trabajo', async ({ page }) => {
    await registrar(page, 'Editor 2', 1);
    await irA(page, 'Ajustes');
    await page.getByRole('button', { name: 'Desactivar' }).nth(1).click();

    await expect(page.getByText(/Se calcula sola/)).toContainText('4');

    await irA(page, 'Hoy');
    await expect(page.getByRole('img', { name: /Editor 2/ })).toHaveCount(0);
    // El concepto que entregó sigue en el tablero: desactivar no borra historial.
    await expect(tarjetasEn(page, 'En progreso')).toHaveCount(1);
  });

  test('fijar la meta de equipo a mano la independiza de la suma', async ({ page }) => {
    await irA(page, 'Ajustes');
    await page.getByRole('checkbox', { name: /Fijar la meta de equipo/ }).check();
    await page.getByRole('spinbutton', { name: 'Meta de equipo' }).fill('10');

    await irA(page, 'Hoy');
    await expect(page.getByRole('img', { name: 'Equipo: 0 de 10 entregados' })).toBeVisible();
  });
});
