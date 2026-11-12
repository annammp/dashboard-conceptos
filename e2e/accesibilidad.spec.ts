import AxeBuilder from '@axe-core/playwright';
import { expect, registrar, test } from './fixtures';

const VISTAS = [
  { nombre: 'Hoy', hash: '#/hoy' },
  { nombre: 'Historial', hash: '#/historial' },
  { nombre: 'Ajustes', hash: '#/ajustes' },
];

test.describe('accesibilidad', () => {
  for (const vista of VISTAS) {
    test(`${vista.nombre} no tiene violaciones de axe`, async ({ page }) => {
      await registrar(page, 'Editor 1', 1);
      await page.goto(`/${vista.hash}`);
      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(resultado.violations).toEqual([]);
    });
  }

  test('se puede registrar y entregar un concepto solo con el teclado', async ({ page }) => {
    const agregar = page.getByRole('button', { name: '+1 concepto para Editor 1' });
    await agregar.focus();
    await expect(agregar).toBeFocused();
    await page.keyboard.press('Enter');

    const entregar = page.getByRole('button', { name: 'Entregado', exact: true });
    await entregar.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('img', { name: 'Editor 1: 1 de 4 entregados' })).toBeVisible();
  });

  test('se puede llegar a las tres pestañas con Tab', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Hoy', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Historial', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Ajustes', exact: true })).toBeFocused();
  });
});
