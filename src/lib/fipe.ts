/**
 * Helper da Tabela FIPE via API pública gratuita (Parallelum, sem chave).
 * Usado no cadastro de veículo para puxar marca/modelo/ano/valor.
 * Degrada graciosamente: se a FIPE estiver fora, o cadastro manual continua.
 */

const BASE = 'https://parallelum.com.br/fipe/api/v1/carros';

export type FipeItem = { codigo: string; nome: string };

export type FipeValor = {
  valor: number;
  marca: string;
  modelo: string;
  ano: string;
  combustivel: string;
  codigoFipe: string;
};

type FipeValorRaw = {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
};

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`FIPE indisponível (${r.status})`);
  return (await r.json()) as T;
}

/** "R$ 75.000,00" -> 75000.00 */
function parseValor(s: string): number {
  return Number((s || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export const fipeListarMarcas = (): Promise<FipeItem[]> => getJSON<FipeItem[]>(`${BASE}/marcas`);

export const fipeListarModelos = (marca: string): Promise<FipeItem[]> =>
  getJSON<{ modelos: FipeItem[] }>(`${BASE}/marcas/${marca}/modelos`).then((d) => d.modelos);

export const fipeListarAnos = (marca: string, modelo: string): Promise<FipeItem[]> =>
  getJSON<FipeItem[]>(`${BASE}/marcas/${marca}/modelos/${modelo}/anos`);

export async function fipeBuscarValor(marca: string, modelo: string, ano: string): Promise<FipeValor> {
  const d = await getJSON<FipeValorRaw>(`${BASE}/marcas/${marca}/modelos/${modelo}/anos/${ano}`);
  return {
    valor: parseValor(d.Valor),
    marca: d.Marca,
    modelo: d.Modelo,
    ano: String(d.AnoModelo),
    combustivel: d.Combustivel,
    codigoFipe: d.CodigoFipe,
  };
}
