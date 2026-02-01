import { describe, it, expect } from "vitest";
import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("retorna headers e rows a partir da primeira linha como cabeçalho", () => {
    const text = "Título,Nome,Valor\nA1,B1,100\nA2,B2,200";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["Título", "Nome", "Valor"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Título: "A1", Nome: "B1", Valor: "100" });
    expect(rows[1]).toEqual({ Título: "A2", Nome: "B2", Valor: "200" });
  });

  it("respeita maxPreviewRows e limita linhas de dados", () => {
    const text =
      "Col\n1\n2\n3\n4\n5\n6";
    const { headers, rows } = parseCsv(text, { maxPreviewRows: 3 });
    expect(headers).toEqual(["Col"]);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.Col)).toEqual(["1", "2", "3"]);
  });

  it("retorna arrays vazios para texto vazio", () => {
    const { headers, rows } = parseCsv("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("trata aspas e vírgulas dentro de aspas", () => {
    const text = 'A,B\n"Olá, mundo",x';
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["A", "B"]);
    expect(rows[0]?.A).toBe("Olá, mundo");
    expect(rows[0]?.B).toBe("x");
  });

  it("com skipEmptyHeaders false mantém colunas com cabeçalho vazio", () => {
    const text = "Título,,Valor\nA,,10";
    const { headers, rows } = parseCsv(text, { skipEmptyHeaders: false });
    expect(headers).toContain("");
    expect(rows[0]).toHaveProperty("");
  });

  it("com skipEmptyHeaders true filtra colunas com cabeçalho vazio", () => {
    const text = "Título,,Valor\nA,,10";
    const { headers, rows } = parseCsv(text, { skipEmptyHeaders: true });
    expect(headers.filter((h) => h === "")).toHaveLength(0);
    expect(headers).toContain("Título");
    expect(headers).toContain("Valor");
  });
});
