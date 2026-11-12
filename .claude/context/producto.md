# Producto

## El problema

El equipo produce videos cortos llamados **conceptos**. La meta es de **4 por
editor al día**; con dos editores, **8 al día** en total. La información de qué
se entregó, qué está en ajustes y qué falta estaba repartida en varios lugares,
así que nadie sabía con certeza el avance real del día. Este dashboard existe
para que el equipo esté alineado sobre una sola fuente de verdad.

## Quién lo usa

- **Ana** (dueña del proceso): la única que escribe. Registra conceptos, los
  mueve de estado y ajusta metas.
- **El equipo de edición**: lectura. Abren el link y ven el avance del día en vivo.
- **Terceros** (cliente, dirección): lectura, con el mismo link.

## Lo que el dashboard tiene que responder de un vistazo

1. ¿Cuántos conceptos van hoy y en qué estado está cada uno?
2. ¿Cuánto falta para la meta de cada editor (4) y para la del equipo (8)?
3. ¿Cómo venimos esta semana? (historial y tendencia por día)
4. Un refuerzo positivo según el progreso, para que registrar se sienta bien.

## Decisiones de producto tomadas

- **Los contadores se derivan de la lista de conceptos**, no se editan aparte.
  Si el número y la lista se pudieran editar por separado, terminarían diciendo
  cosas distintas y el dashboard dejaría de ser confiable. Para que registrar sea
  rápido hay un botón "+1 concepto" que crea la tarjeta al instante.
- **La meta es editable** por editor, y la de equipo se deriva de la suma (con
  posibilidad de fijarla manualmente).
- **La meta se congela por día.** Subir la meta de 4 a 5 hoy no debe re-calificar
  los días pasados: cada día se mide contra la meta que tenía ese día.
- **Quitar un editor es desactivarlo**, nunca borrarlo, para no perder historial.

## Fuera de alcance (v1, a propósito)

Notas y link por concepto · estado "Aprobado" · comentarios y adjuntos ·
notificaciones · permisos por editor · time tracking · multi-equipo ·
app nativa · internacionalización.
