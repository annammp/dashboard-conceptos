import { expect, registrar, test } from './fixtures';

/**
 * Dos pestañas del mismo contexto a propósito: el evento `storage` no cruza
 * perfiles de navegador. Esto ejercita el mismo camino que usará el tiempo
 * real de Supabase, porque ambos entran por el mismo puerto.
 */
test('un cambio en una pestaña aparece en la otra', async ({ page, context }) => {
  const otra = await context.newPage();
  await otra.clock.setFixedTime(new Date('2026-11-12T18:00:00.000Z'));
  await otra.goto('/');

  await expect(otra.getByRole('img', { name: 'Equipo: 0 de 8 entregados' })).toBeVisible();

  await registrar(page, 'Editor 1', 1);
  await page.getByRole('button', { name: 'Entregado', exact: true }).click();

  await expect(otra.getByRole('img', { name: 'Equipo: 1 de 8 entregados' })).toBeVisible({
    timeout: 5000,
  });
});
