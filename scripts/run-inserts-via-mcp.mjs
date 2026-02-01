/**
 * Lê os arquivos stmt2, stmt3, stmt4 e imprime o conteúdo de cada um
 * para ser usado pelo agente em chamadas ao MCP execute_sql.
 * Uso: node scripts/run-inserts-via-mcp.mjs
 */
import fs from "fs";
import path from "path";

const base = path.join(process.cwd(), "scripts");
for (const name of ["stmt2.sql", "stmt3.sql", "stmt4_fixed.sql"]) {
  const file = path.join(base, name);
  const content = fs.readFileSync(file, "utf8");
  console.log("--- FILE:", name, "LENGTH:", content.length);
  console.log(content);
  console.log("--- END", name);
}
