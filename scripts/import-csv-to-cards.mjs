/**
 * Script para gerar INSERTs de cards a partir do CSV da lista.
 * Uso: node scripts/import-csv-to-cards.mjs "e:/lucas/Downloads/Lista_1769554578178.csv"
 *
 * Gera SQL para public.cards conforme o plano:
 * - flow_id: 5219252a-d6d7-45ad-82ca-5ef3c12609b9
 * - client_id: ef31513c-0ce9-4737-942f-3801f2aac31b
 * - Ganho → a85661fc-2393-46d1-957d-316cf1dab118
 * - Demais status mapeados por ETAPA CLOSER (ou ETAPA SDR se CLOSER vazio). Não usa ETAPA PÓS VENDA.
 */

import fs from "fs";
import path from "path";

const FLOW_ID = "5219252a-d6d7-45ad-82ca-5ef3c12609b9";
const CLIENT_ID = "ef31513c-0ce9-4737-942f-3801f2aac31b";
const STEP_GANHO = "a85661fc-2393-46d1-957d-316cf1dab118";

// Steps do flow (query já executada)
const STEP_IDS = {
  novos_leads: "dac8b80e-5e78-4add-b61b-2db4359d5884",
  tentando_contato: "eee0d1b7-6e75-4e8f-bfdb-1afc47040ea9",
  contato_feito: "ea5575fe-e27b-4147-9527-ae0f4cbc337d",
  identificacao_interesse: "3c6487c7-40ae-4bbf-baf4-a54ba2f3d13a",
  projeto_futuro: "a30611a0-896b-4ea6-ad7b-8d61eb8ff257",
  perdidos: "c4af233e-af63-4a42-bbad-d2bfaaea5523",
  reuniao_agendada: "36881585-2471-40b3-90af-0b8d24a07804",
  aguardando_reuniao: "63fce97e-991c-40cf-bd40-a85c33f5504c",
  reuniao_realizada: "78e2c7ea-6945-4b8b-83e6-ea7caf38bc49",
  aguardando_retorno: "d231838c-148a-447a-8e4c-96884cf8cccf",
  contrato_feito: STEP_GANHO,
  perdido: "e0524d01-f587-4d1f-be82-da6b5fdd50a1",
};

const DEFAULT_STEP = STEP_IDS.novos_leads;

/** Normaliza string para comparação (lowercase, trim) */
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

/** Mapeia valor de ETAPA CLOSER/SDR para step_id. Não usa ETAPA PÓS VENDA. */
function mapStatusToStepId(etapaCloser, etapaSdr) {
  const closer = norm(etapaCloser);
  const sdr = norm(etapaSdr);
  const status = closer || sdr;

  if (status === "ganho") return STEP_GANHO;
  if (status.includes("finalizado") && status.includes("feedback")) return STEP_GANHO;
  if (status.includes("cancelamentos")) return STEP_IDS.perdidos;
  if (status.includes("captando dados")) return STEP_IDS.contato_feito;
  if (status.includes("eventos realizados")) return STEP_GANHO;
  if (status.includes("pendencias")) return DEFAULT_STEP;
  if (status.includes("aguardando retorno")) return STEP_IDS.aguardando_retorno;
  if (status === "perdidos" || status === "perdido") return STEP_IDS.perdidos;
  if (status.includes("reunião agendada") || status.includes("reuniao agendada")) return STEP_IDS.reuniao_agendada;
  if (status.includes("reunião realizada") || status.includes("reuniao realizada")) return STEP_IDS.reuniao_realizada;
  if (status.includes("tentando contato")) return STEP_IDS.tentando_contato;
  if (status.includes("contato feito")) return STEP_IDS.contato_feito;
  if (status.includes("projeto futuro")) return STEP_IDS.projeto_futuro;
  if (status.includes("novos leads")) return STEP_IDS.novos_leads;
  if (status.includes("acompanhamento") || status.includes("terminais") || status.includes("treinamento retaguarda") || status.includes("primeiro contato")) return STEP_GANHO;

  return DEFAULT_STEP;
}

/** Escapa aspas simples para SQL */
function escapeSql(s) {
  return String(s ?? "").replace(/'/g, "''").replace(/\\/g, "\\\\");
}

/** Parse CSV: primeira linha = header. Respeita aspas e células multilinha. */
function parseCsv(text) {
  const result = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  function flushCell() {
    currentRow.push(currentCell);
    currentCell = "";
  }

  function flushRow() {
    flushCell();
    if (currentRow.length > 0) result.push([...currentRow]);
    currentRow = [];
  }

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && c === ",") {
      flushCell();
    } else if (!inQuotes && (c === "\n" || c === "\r")) {
      if (c === "\r" && next === "\n") i++;
      flushRow();
    } else {
      currentCell += c;
    }
  }
  flushRow();
  return result;
}

function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), "Lista_1769554578178.csv");
  const fullPath = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);

  if (!fs.existsSync(fullPath)) {
    console.error("Arquivo não encontrado:", fullPath);
    process.exit(1);
  }

  const text = fs.readFileSync(fullPath, "utf-8");
  const rows = parseCsv(text);
  if (rows.length < 2) {
    console.error("CSV sem dados após cabeçalho.");
    process.exit(1);
  }

  const header = rows[0];
  const dataRows = rows.slice(1);

  const idxTitulo = header.findIndex((h) => norm(h) === "título");
  const idxNomeEmpresa = header.findIndex((h) => norm(h) === "nome da empresa");
  const idxEtapaSdr = header.findIndex((h) => norm(h) === "etapa sdr");
  const idxEtapaCloser = header.findIndex((h) => norm(h) === "etapa closer");

  const get = (row, i) => (i >= 0 && i < row.length ? row[i] : "");

  const positionByStep = new Map();
  const batchSize = 50;
  const valuesList = [];

  for (const row of dataRows) {
    const titulo = get(row, idxTitulo);
    const nomeEmpresa = get(row, idxNomeEmpresa);
    const etapaCloser = get(row, idxEtapaCloser);
    const etapaSdr = get(row, idxEtapaSdr);

    const title = escapeSql((titulo || nomeEmpresa || "Sem título").trim().slice(0, 500));
    const stepId = mapStatusToStepId(etapaCloser, etapaSdr);
    const pos = (positionByStep.get(stepId) ?? 0) + 1;
    positionByStep.set(stepId, pos);

    valuesList.push(
      `('${CLIENT_ID}'::uuid, '${FLOW_ID}'::uuid, '${stepId}'::uuid, '${title}', '{}'::jsonb, '{}'::jsonb, ${pos})`
    );
  }

  const columns =
    "(client_id, flow_id, step_id, title, field_values, checklist_progress, position)";
  const sqlStatements = [];
  for (let i = 0; i < valuesList.length; i += batchSize) {
    const batch = valuesList.slice(i, i + batchSize);
    sqlStatements.push(
      `INSERT INTO public.cards ${columns} VALUES ${batch.join(",\n  ")};`
    );
  }

  const out = [
    "-- Importação CSV -> public.cards",
    "-- Total de linhas: " + dataRows.length,
    "",
    ...sqlStatements,
  ].join("\n");

  const outPath = process.argv[3];
  if (outPath) {
    fs.writeFileSync(outPath, out, "utf8");
    console.log("SQL escrito em", outPath);
  } else {
    console.log(out);
  }
}

main();
