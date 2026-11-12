import { describeGatewayContract } from '../../test/gatewayContract';
import { createFakeClock, createFakeIds, createMemoryPersistence } from '../../test/fakes';
import { createLocalGateway } from './gateway';

// El mismo contrato que correrá contra Supabase. Cada caso arranca con una
// persistencia en memoria limpia, así que no se contaminan entre sí.
describeGatewayContract('adaptador local', () =>
  createLocalGateway({
    ids: createFakeIds('c'),
    clock: createFakeClock().clock,
    persistence: createMemoryPersistence(),
  }),
);
