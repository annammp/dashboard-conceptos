/** Los errores que una capa de datos puede devolver, en lenguaje del dominio. */
export type RepoError =
  | { readonly kind: 'offline' }
  | { readonly kind: 'not_authorized' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'conflict' }
  | { readonly kind: 'invalid'; readonly detail: string }
  | { readonly kind: 'unknown'; readonly detail: string };

export const ERROR_MESSAGES: Readonly<Record<RepoError['kind'], string>> = {
  offline: 'Sin conexión. Reintenta en un momento.',
  not_authorized: 'Necesitas iniciar sesión para hacer este cambio.',
  not_found: 'Eso ya no existe. Puede que alguien lo haya borrado.',
  conflict: 'Alguien cambió esto al mismo tiempo. Vuelve a intentar.',
  invalid: 'Hay un dato que no es válido.',
  unknown: 'Algo falló. Reintenta en un momento.',
};

export const describeError = (error: RepoError): string => ERROR_MESSAGES[error.kind];
