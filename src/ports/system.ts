/**
 * El reloj y el generador de ids se inyectan. Así el dominio sigue siendo puro
 * y las pruebas son deterministas: nada depende del momento en que corren.
 */
import type { Instant } from '../domain';

export interface Clock {
  now(): Date;
  nowInstant(): Instant;
}

export interface IdFactory {
  newId(): string;
}
