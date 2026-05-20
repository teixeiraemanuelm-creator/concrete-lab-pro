export const FAMILIAS = ["Bloco", "Piso", "Meio-fio", "Guia", "Canaleta", "Laje", "Mourão", "Outro"];
export const CATEGORIAS_INSUMO = ["Cimento", "Agregado Graúdo", "Agregado Miúdo", "Aditivo", "Água", "Pigmento", "Fibra", "Outro"];
export const UNIDADES = ["kg", "m³", "litro", "saco", "ton"];
export const TIPOS_TRACO = ["Convencional", "CCNA", "Seco", "Úmido", "Especial"];
export const STATUS_TRACO = ["Ativo", "Inativo", "Homologado"];
export const STATUS_BASIC = ["Ativo", "Inativo"];
export const IDADES = [7, 14, 28];
export const RESULTADOS = ["Aprovado", "Reprovado"];

export function brl(n: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));
}
