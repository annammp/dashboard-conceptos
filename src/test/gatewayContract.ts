/**
 * El contrato que todo `DataGateway` debe cumplir, escrito una sola vez.
 *
 * Corre contra el adaptador local en cada CI y contra Supabase bajo demanda.
 * Es la garantía *real* —no la intención— de que son intercambiables: si
 * cambiar de driver rompiera algo, se rompe aquí y no en producción.
 */

import { describe, expect, it } from 'vitest';
import { asConceptoId, asEditorId, parseIsoDate, type DateRange, type IsoDate } from '../domain';
import type { ChangeEvent, DataGateway } from '../ports';

const asDate = (raw: string): IsoDate => {
  const parsed = parseIsoDate(raw);
  if (!parsed.ok) throw new Error(`fecha inválida: ${raw}`);
  return parsed.value;
};

const HOY = asDate('2026-11-12');
const AYER = asDate('2026-11-11');
const SEMANA: DateRange = { from: asDate('2026-11-06'), to: HOY };

const unwrap = <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!result.ok) throw new Error(`se esperaba ok, llegó ${JSON.stringify(result.error)}`);
  return result.value;
};

export const describeGatewayContract = (
  nombre: string,
  crearGateway: () => Promise<DataGateway> | DataGateway,
): void => {
  describe(`contrato de DataGateway: ${nombre}`, () => {
    const setup = async (): Promise<DataGateway> => await crearGateway();

    describe('editores', () => {
      it('arranca con dos editores activos de meta 4', async () => {
        const gateway = await setup();
        const editors = unwrap(await gateway.editors.list());
        expect(editors).toHaveLength(2);
        expect(editors.every((editor) => editor.active)).toBe(true);
        expect(editors.every((editor) => editor.dailyGoal === 4)).toBe(true);
      });

      it('agrega un editor', async () => {
        const gateway = await setup();
        const creado = unwrap(await gateway.editors.create({ name: 'Nuevo', dailyGoal: 3 }));
        expect(creado).toMatchObject({ name: 'Nuevo', dailyGoal: 3, active: true });
        expect(unwrap(await gateway.editors.list())).toHaveLength(3);
      });

      it('cambia la meta de un editor', async () => {
        const gateway = await setup();
        const [primero] = unwrap(await gateway.editors.list());
        const actualizado = unwrap(await gateway.editors.update(primero!.id, { dailyGoal: 6 }));
        expect(actualizado.dailyGoal).toBe(6);
      });

      it('desactivar conserva al editor en la lista', async () => {
        const gateway = await setup();
        const [primero] = unwrap(await gateway.editors.list());
        unwrap(await gateway.editors.update(primero!.id, { active: false }));
        const editors = unwrap(await gateway.editors.list());
        expect(editors).toHaveLength(2);
        expect(editors.find((editor) => editor.id === primero!.id)?.active).toBe(false);
      });

      it('falla con not_found si el editor no existe', async () => {
        const gateway = await setup();
        const result = await gateway.editors.update(asEditorId('no-existe'), { dailyGoal: 1 });
        expect(result).toMatchObject({ ok: false, error: { kind: 'not_found' } });
      });
    });

    describe('conceptos', () => {
      const nuevo = (date: IsoDate, editorId: string, title = 'Reel') => ({
        editorId: asEditorId(editorId),
        date,
        title,
      });

      it('crea un concepto en progreso por defecto', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const creado = unwrap(await gateway.conceptos.create(nuevo(HOY, editor!.id)));
        expect(creado).toMatchObject({ status: 'en_progreso', date: HOY, deliveredAt: null });
      });

      it('crea varios de una vez', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const creados = unwrap(
          await gateway.conceptos.createMany([nuevo(HOY, editor!.id), nuevo(HOY, editor!.id)]),
        );
        expect(creados).toHaveLength(2);
        expect(new Set(creados.map((concepto) => concepto.id)).size).toBe(2);
      });

      it('lista solo los del rango pedido', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        await gateway.conceptos.create(nuevo(HOY, editor!.id, 'de hoy'));
        await gateway.conceptos.create(nuevo(asDate('2026-10-01'), editor!.id, 'viejo'));
        const delRango = unwrap(await gateway.conceptos.listByRange(SEMANA));
        expect(delRango.map((concepto) => concepto.title)).toEqual(['de hoy']);
      });

      it('devuelve los conceptos ordenados por fecha', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        await gateway.conceptos.create(nuevo(HOY, editor!.id, 'hoy'));
        await gateway.conceptos.create(nuevo(AYER, editor!.id, 'ayer'));
        const lista = unwrap(await gateway.conceptos.listByRange(SEMANA));
        expect(lista.map((concepto) => concepto.title)).toEqual(['ayer', 'hoy']);
      });

      it('actualiza estado y título', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const creado = unwrap(await gateway.conceptos.create(nuevo(HOY, editor!.id)));
        const actualizado = unwrap(
          await gateway.conceptos.update(creado.id, { status: 'en_ajustes', title: 'Otro' }),
        );
        expect(actualizado).toMatchObject({ status: 'en_ajustes', title: 'Otro' });
      });

      it('elimina un concepto', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const creado = unwrap(await gateway.conceptos.create(nuevo(HOY, editor!.id)));
        unwrap(await gateway.conceptos.remove(creado.id));
        expect(unwrap(await gateway.conceptos.listByRange(SEMANA))).toHaveLength(0);
      });

      it('falla con not_found al actualizar o borrar algo inexistente', async () => {
        const gateway = await setup();
        const fantasma = asConceptoId('no-existe');
        expect(await gateway.conceptos.update(fantasma, { title: 'x' })).toMatchObject({
          ok: false,
          error: { kind: 'not_found' },
        });
        expect(await gateway.conceptos.remove(fantasma)).toMatchObject({
          ok: false,
          error: { kind: 'not_found' },
        });
      });
    });

    describe('ajustes', () => {
      it('arranca sin override de meta de equipo', async () => {
        const gateway = await setup();
        expect(unwrap(await gateway.settings.get()).teamGoalOverride).toBeNull();
      });

      it('guarda y devuelve un override', async () => {
        const gateway = await setup();
        unwrap(await gateway.settings.update({ teamGoalOverride: 10 }));
        expect(unwrap(await gateway.settings.get()).teamGoalOverride).toBe(10);
      });
    });

    describe('metas congeladas por día', () => {
      it('guarda un snapshot y lo devuelve en el rango', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        unwrap(await gateway.dailyGoals.snapshot([{ editorId: editor!.id, date: HOY, goal: 4 }]));
        const metas = unwrap(await gateway.dailyGoals.listByRange(SEMANA));
        expect(metas).toHaveLength(1);
        expect(metas[0]).toMatchObject({ goal: 4, date: HOY });
      });

      /** Lo que hace que el historial no mienta: un día ya medido no se recalifica. */
      it('un segundo snapshot del mismo día no pisa al primero', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        unwrap(await gateway.dailyGoals.snapshot([{ editorId: editor!.id, date: HOY, goal: 4 }]));
        unwrap(await gateway.dailyGoals.snapshot([{ editorId: editor!.id, date: HOY, goal: 9 }]));
        const metas = unwrap(await gateway.dailyGoals.listByRange(SEMANA));
        expect(metas).toHaveLength(1);
        expect(metas[0]?.goal).toBe(4);
      });
    });

    describe('tiempo real', () => {
      it('avisa de los cambios a quien está suscrito', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const eventos: ChangeEvent[] = [];
        const unsubscribe = gateway.realtime.subscribe((event) => eventos.push(event));

        await gateway.conceptos.create({ editorId: editor!.id, date: HOY, title: 'Reel' });

        expect(eventos).toHaveLength(1);
        expect(eventos[0]).toMatchObject({ entity: 'concepto', op: 'upsert' });
        unsubscribe();
      });

      it('deja de avisar después de desuscribirse', async () => {
        const gateway = await setup();
        const [editor] = unwrap(await gateway.editors.list());
        const eventos: ChangeEvent[] = [];
        const unsubscribe = gateway.realtime.subscribe((event) => eventos.push(event));
        unsubscribe();

        await gateway.conceptos.create({ editorId: editor!.id, date: HOY, title: 'Reel' });

        expect(eventos).toHaveLength(0);
      });

      it('informa el estado de la conexión al suscribirse', async () => {
        const gateway = await setup();
        const estados: string[] = [];
        const unsubscribe = gateway.realtime.subscribe(
          () => undefined,
          (status) => estados.push(status),
        );
        expect(estados).toContain('open');
        unsubscribe();
      });
    });

    describe('sesión', () => {
      it('expone si se puede escribir', async () => {
        const gateway = await setup();
        const session = await gateway.auth.getSession();
        expect(typeof session?.canWrite).toBe('boolean');
      });
    });
  });
};
