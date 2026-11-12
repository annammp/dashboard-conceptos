/**
 * El websocket vive aquí dentro. Hacia afuera solo salen `ChangeEvent`, que
 * están en lenguaje del dominio: ni el estado ni la UI saben que hay un canal.
 */

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { asConceptoId, asEditorId } from '../../domain';
import type { ChangeEvent, ConnectionStatus, RealtimePort, Unsubscribe } from '../../ports';
import type { AppSupabaseClient } from './client';
import { toConcepto, toEditor, toSettings } from './mappers';
import type { ConceptoRow, EditorRow, SettingsRow } from './schema';

type Payload = RealtimePostgresChangesPayload<Record<string, unknown>>;

const idDe = (payload: Payload): string => {
  const viejo: unknown = payload.old;
  if (typeof viejo !== 'object' || viejo === null || !('id' in viejo)) return '';
  const { id } = viejo;
  return typeof id === 'string' ? id : '';
};

const traducir = (tabla: string, payload: Payload): ChangeEvent | null => {
  if (payload.eventType === 'DELETE') {
    if (tabla === 'conceptos') {
      return { entity: 'concepto', op: 'delete', id: asConceptoId(idDe(payload)) };
    }
    if (tabla === 'editors') {
      return { entity: 'editor', op: 'delete', id: asEditorId(idDe(payload)) };
    }
    return { entity: 'all', op: 'invalidate' };
  }

  const fila = payload.new as unknown;
  if (tabla === 'conceptos') {
    return { entity: 'concepto', op: 'upsert', row: toConcepto(fila as ConceptoRow) };
  }
  if (tabla === 'editors') {
    return { entity: 'editor', op: 'upsert', row: toEditor(fila as EditorRow) };
  }
  if (tabla === 'app_settings') {
    return { entity: 'settings', op: 'upsert', row: toSettings(fila as SettingsRow) };
  }
  // daily_goals y cualquier tabla futura: que el store vuelva a leer.
  return { entity: 'all', op: 'invalidate' };
};

const TABLAS = ['conceptos', 'editors', 'app_settings', 'daily_goals'] as const;

const estadoDeCanal = (status: string): ConnectionStatus => {
  if (status === 'SUBSCRIBED') return 'open';
  if (status === 'CLOSED') return 'closed';
  return 'error';
};

export const createSupabaseRealtime = (client: AppSupabaseClient): RealtimePort => ({
  subscribe: (onChange, onStatus): Unsubscribe => {
    const channel = client.channel('dashboard-conceptos');

    for (const tabla of TABLAS) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabla },
        (payload: Payload) => {
          const evento = traducir(tabla, payload);
          if (evento !== null) onChange(evento);
        },
      );
    }

    channel.subscribe((status) => {
      onStatus?.(estadoDeCanal(status));
    });

    return () => {
      void client.removeChannel(channel);
    };
  },
});
