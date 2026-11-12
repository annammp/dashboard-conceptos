# Glosario

| Término | Significado |
|---|---|
| **Concepto** | Un video entregable. La unidad que se cuenta. En código: `Concepto`. |
| **En progreso** (`en_progreso`) | Se está trabajando. Cuenta como "va", no como entregado. |
| **En ajustes** (`en_ajustes`) | Entregado y devuelto con correcciones. No cuenta para la meta. |
| **Entregado** (`entregado`) | Terminado y aceptado. **Es lo único que cuenta para la meta.** |
| **Editor** | La persona que produce conceptos. Tiene su propia meta diaria. |
| **Meta diaria** | Conceptos entregados esperados por editor por día. Default 4. |
| **Meta de equipo** | Suma de las metas de los editores activos (2 × 4 = 8), o un valor fijo. |
| **Faltan** (`missing`) | `max(0, meta − entregados)`. Nunca negativo. |
| **Ratio** | `entregados / meta`. Puede pasar de 1 si se supera la meta. |
| **Aliento** | La frase motivacional que corresponde al ratio actual. |
| **Writer** | Quien está en la allowlist de Supabase y por tanto puede escribir. |

## Nota de idioma

Los **estados** se escriben en español en la base y en el dominio
(`en_progreso`, `en_ajustes`, `entregado`) porque son vocabulario del negocio y
así se leen igual en la UI, el SQL y los logs. El resto del código
(identificadores, funciones, tipos) va en inglés.
