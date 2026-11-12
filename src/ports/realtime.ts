/**
 * El tiempo real, en lenguaje del dominio. El websocket de Supabase vive dentro
 * de su adaptador; ni el estado ni la UI saben que existe.
 */

import type { AppSettings, Concepto, ConceptoId, Editor, EditorId } from '../domain';

export type ChangeEvent =
  | { readonly entity: 'concepto'; readonly op: 'upsert'; readonly row: Concepto }
  | { readonly entity: 'concepto'; readonly op: 'delete'; readonly id: ConceptoId }
  | { readonly entity: 'editor'; readonly op: 'upsert'; readonly row: Editor }
  | { readonly entity: 'editor'; readonly op: 'delete'; readonly id: EditorId }
  | { readonly entity: 'settings'; readonly op: 'upsert'; readonly row: AppSettings }
  // "algo cambió, vuelve a leer": lo usa el puente entre pestañas y la
  // reconexión del websocket, cuando no se sabe qué filas se perdieron.
  | { readonly entity: 'all'; readonly op: 'invalidate' };

export type ConnectionStatus = 'open' | 'closed' | 'error';

export type Unsubscribe = () => void;

export interface RealtimePort {
  subscribe(
    onChange: (event: ChangeEvent) => void,
    onStatus?: (status: ConnectionStatus) => void,
  ): Unsubscribe;
}
