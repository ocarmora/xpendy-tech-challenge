# Xpendit — Expense Validation Engine

A small, framework-free TypeScript service that validates corporate expenses against a
configurable policy and analyzes historical batches. Built with a **hexagonal (ports &
adapters)** architecture.

---

## Challenge parts (git tags)

The challenge is built in three incremental parts, each marked with a git tag. Check out a
tag to see **only** the code for that part — every tag compiles and its test suite passes
in isolation (`npm ci && npm test`).

| Tag      | Part   | Scope                                                              |
| -------- | ------ | ----------------------------------------------------------------- |
| `part-1` | Part 1 | Pure rule engine: models, validation rules and unit tests.        |
| `part-2` | Part 2 | Open Exchange Rates client and composition root (live I/O).       |
| `part-3` | Part 3 | Batch analyzer, anomaly detection and `ANALISIS.md`.              |

```bash
git checkout part-1   # inspect a specific part
git checkout main     # back to the full solution
```

---

## Requirements

- **Node.js ≥ 22** (developed on v22).
- **npm** (a `package-lock.json` is committed).

---

## Installation

```bash
npm install
```

---

## Configuration (`.env`)

The batch analyzer converts non-USD expenses to the policy's base currency using live
exchange rates from [Open Exchange Rates](https://openexchangerates.org/), so an API key
(App ID) is required.

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Set your Open Exchange Rates App ID in `.env`:

   ```dotenv
   OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
   ```

If the key is missing, the analyzer **fails fast** with a clear message rather than
silently using mocked rates.

### Optional overrides

Both entrypoints read these from the environment (defaults shown):

| Variable      | Default                      | Purpose                          |
| ------------- | ---------------------------- | -------------------------------- |
| `POLICY_PATH` | `config/policy.json`         | Policy file to validate against. |
| `CSV_PATH`    | `data/gastos_historicos.csv` | Historical expenses for batch.   |

---

## Running the unit tests

The suite uses [Vitest](https://vitest.dev/).

```bash
npm test            # run the full suite once
npm run test:watch  # watch mode
npm run test:coverage
```

Full quality gate (types + lint + format + tests):

```bash
npm run check
```

---

## Running the batch analyzer

Processes the historical CSV: parses each row, validates the valid ones against the policy
(converting currencies via live rates), and prints the status breakdown plus detected
anomalies as JSON.

```bash
npm run analyze:batch
```

Use a different policy or dataset via the optional env vars:

```bash
POLICY_PATH=config/policy.json CSV_PATH=data/gastos_historicos.csv npm run analyze:batch
```

To validate a single sample expense end-to-end:

```bash
npm run analyze
```

### Output

`analyze:batch` prints a JSON report:

```json
{
  "total": 50,
  "parsed": 50,
  "invalid": 0,
  "invalidRows": [],
  "breakdown": { "APPROVED": 0, "PENDING": 0, "REJECTED": 0 },
  "anomalies": []
}
```

- `breakdown` — count of expenses resolved to each final status.
- `anomalies` — suspicious patterns detected across the batch.
- `invalidRows` — rows that failed parsing, with the row number and the reason.
