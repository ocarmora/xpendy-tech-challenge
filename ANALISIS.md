# Análisis del lote de gastos

> 🎥 **Video explicativo (Loom):** https://www.loom.com/share/a93e031e2ad5447abb0261010dcfe3b7

Resultados de ejecutar el analizador (`npm run analyze:batch`) sobre
`data/gastos_historicos.csv` (50 registros) contra `config/policy.json`.

> Las conversiones de moneda usan tasas **históricas reales** de Open Exchange Rates para
> la fecha de cada gasto, y la antigüedad se calcula contra la fecha de ejecución
> (referencia: **2026-06-15**). Las 50 filas se parsearon correctamente (0 inválidas).

---

## 1. Desglose por estado

| Estado     | Cantidad |
| ---------- | -------- |
| APROBADOS  | **11**   |
| PENDIENTES | **14**   |
| RECHAZADOS | **25**   |
| **Total**  | **50**   |

El estado final de cada gasto se resuelve con semántica **deny-overrides**
(`RECHAZADO > PENDIENTE > APROBADO`): basta que una regla rechace para que el gasto quede
rechazado. El alto número de rechazos se explica sobre todo por la **regla de antigüedad**
(muchos gastos superan los 60 días respecto a la fecha de referencia) y por la
**restricción de centro de costo** (`core_engineering` + `food`).

---

## 2. Anomalías encontradas

El detector corre sobre todo el lote, en paralelo a las reglas de política, y busca dos
patrones.

### 2.1 Negativos — `NEGATIVE_AMOUNT`

Marca gastos con `monto < 0` (errores de carga o migración).

**En este dataset: ninguno.** No hay montos negativos en los 50 registros. El detector
está implementado y probado; simplemente no encontró coincidencias aquí. Un gasto como
`monto = -25, USD` se reportaría así:

```json
{ "type": "NEGATIVE_AMOUNT", "expenseId": "g_xxx", "amount": -25, "currency": "USD" }
```

> Nota de diseño: un monto negativo es un valor _bien formado_ pero sospechoso. Por eso
> **no** se rechaza en el parseo — se deja pasar para que el detector de anomalías lo haga
> visible en vez de descartarlo en silencio.

### 2.2 Duplicados exactos — `EXACT_DUPLICATE`

Agrupa gastos que comparten **mismo monto, misma moneda y misma fecha** (el empleado se
ignora a propósito, según la definición del reto). Cada grupo con 2+ miembros es una
anomalía.

**Se encontraron 7 grupos de duplicados:**

| Gastos                    | Monto | Moneda | Fecha      |
| ------------------------- | ----- | ------ | ---------- |
| `g_001`, `g_011`          | 50    | USD    | 2026-05-26 |
| `g_002`, `g_012`          | 120   | USD    | 2026-05-21 |
| `g_025`, `g_029`          | 120   | USD    | 2026-03-07 |
| `g_036`, `g_041`          | 70    | USD    | 2026-05-26 |
| `g_037`, `g_039`, `g_047` | 150   | USD    | 2026-03-07 |
| `g_038`, `g_050`          | 130   | EUR    | 2026-04-16 |
| `g_042`, `g_043`, `g_044` | 90    | USD    | 2026-05-31 |

Ejemplo (formato de salida real):

```json
{
  "type": "EXACT_DUPLICATE",
  "expenseIds": ["g_042", "g_043", "g_044"],
  "amount": 90,
  "currency": "USD",
  "date": "2026-05-31"
}
```

Nota: Dos grupos son triples (`g_037/g_039/g_047` y `g_042/g_043/g_044`).

---

## 3. Optimización de llamadas a Open Exchange Rates — evitar N+1

El adaptador `OpenExchangeRatesProvider` **memoiza la tabla de tasas por fecha**:

```ts
private readonly tablesByDate = new Map<string, Promise<RateTable>>();
```

Tres decisiones clave:

1. **Una tabla completa por fecha, no una tasa por par.** El endpoint histórico devuelve
   _todas_ las monedas de esa fecha en una sola respuesta. Se cachea la tabla entera, así
   que CLP, MXN y EUR del mismo día comparten **una** llamada.
2. **La caché guarda la `Promise`, no el resultado.** Varias validaciones concurrentes
   para la misma fecha reutilizan la misma petición en vuelo (deduplicación), en lugar de
   lanzar peticiones paralelas duplicadas.
3. **Los fallos no se cachean** (`.catch` borra la entrada), de modo que un error de red
   puede reintentarse en vez de quedar “pegado”.

**Efecto en este lote:** hay 11 gastos en moneda extranjera repartidos en **9 fechas
distintas** (la fecha `2026-04-16` aparece 3 veces). El resultado son **9 llamadas HTTP**
en vez de 11 — y los 39 gastos en USD no generan ninguna llamada (se cortan con
`if (currency === base) return 1`). El costo escala con el número de **fechas únicas**, no
con el número de gastos.

### Cómo lo optimizaría aún más

- **Pre-cargar las fechas únicas en paralelo** al inicio del lote
  (`Promise.all` sobre el set de fechas) en lugar de hacerlo de forma perezosa, para
  solapar la latencia de red en vez de pagarla en serie.
- **Caché persistente** (disco o Redis) entre ejecuciones: las tasas históricas son
  inmutables, así que una fecha consultada una vez no necesita volver a pedirse nunca.
- **Endpoint `time-series`**: una sola llamada trae un rango de fechas, útil cuando el
  lote abarca muchos días contiguos (requiere plan de pago).
- **Conversión por lote agrupando por fecha** antes de validar, para garantizar a nivel de
  algoritmo el límite de “una llamada por fecha única”, independiente del orden de los
  gastos.
