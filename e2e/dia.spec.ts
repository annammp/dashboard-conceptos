import { abrirEnSoloLectura, columna, expect, registrar, tarjetasEn, test } from './fixtures';

test.describe('el día de trabajo', () => {
  test('registrar cuatro conceptos y entregarlos cumple la meta del editor', async ({ page }) => {
    await registrar(page, 'Editor 1', 4);
    await expect(tarjetasEn(page, 'En progreso')).toHaveCount(4);

    const entregar = page.getByRole('button', { name: 'Entregado', exact: true });
    for (let i = 0; i < 4; i += 1) await entregar.first().click();

    await expect(page.getByText('¡Meta cumplida!')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Editor 1: 4 de 4 entregados' })).toBeVisible();
  });

  test('la frase de aliento cambia de nivel al avanzar', async ({ page }) => {
    await expect(page.getByText(/Arranca el día/)).toBeVisible();

    await registrar(page, 'Editor 1', 4);
    await registrar(page, 'Editor 2', 4);
    const entregar = page.getByRole('button', { name: 'Entregado', exact: true });
    for (let i = 0; i < 4; i += 1) await entregar.first().click();

    await expect(page.getByText(/mitad de camino/)).toBeVisible();

    for (let i = 0; i < 4; i += 1) await entregar.first().click();
    await expect(page.getByText('¡Meta del equipo cumplida! Gran trabajo.')).toBeVisible();
  });

  test('un concepto recorre los tres estados y el faltante lo sigue', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    await expect(page.getByText('Faltan 4 conceptos').first()).toBeVisible();

    await page.getByRole('button', { name: 'Entregado', exact: true }).click();
    await expect(page.getByText('Faltan 3 conceptos').first()).toBeVisible();

    await page.getByRole('button', { name: 'En ajustes', exact: true }).click();
    await expect(tarjetasEn(page, 'En ajustes')).toHaveCount(1);
    await expect(page.getByText('Faltan 4 conceptos').first()).toBeVisible();
  });

  test('superar la meta no muestra faltantes negativos', async ({ page }) => {
    await registrar(page, 'Editor 1', 4);
    await registrar(page, 'Editor 1', 4);
    const entregar = page.getByRole('button', { name: 'Entregado', exact: true });
    for (let i = 0; i < 8; i += 1) await entregar.first().click();

    await expect(page.getByRole('img', { name: 'Editor 1: 8 de 4 entregados' })).toBeVisible();
    await expect(page.getByText('-4')).toHaveCount(0);
  });

  test('ponerle título a un concepto lo conserva al recargar', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    const titulo = page.getByRole('textbox', { name: /Título del concepto/ });
    await titulo.fill('Reel de la campaña');

    await page.reload();

    await expect(page.getByRole('textbox', { name: /Título del concepto/ })).toHaveValue(
      'Reel de la campaña',
    );
  });

  test('quien solo lee ve el avance pero no los controles de edición', async ({ page }) => {
    await registrar(page, 'Editor 1', 1);
    await abrirEnSoloLectura(page);

    await expect(page.getByText('Solo lectura')).toBeVisible();
    await expect(columna(page, 'En progreso')).toContainText('Editor 1');
    await expect(page.getByRole('button', { name: /Agregar un concepto/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Entregado', exact: true })).toHaveCount(0);
  });
});
