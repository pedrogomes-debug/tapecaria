/**
 * Motor de precificacao para tapeceiros.
 *
 * O preco de venda e calculado pelo metodo do "markup divisor", em que
 * impostos, taxas de cartao e margem de lucro incidem sobre o PRECO DE VENDA
 * (e nao sobre o custo). Assim evitamos o erro classico de aplicar a margem
 * apenas sobre o custo, que subestima o preco quando ha impostos/taxas.
 *
 *   preco = custoTotal / (1 - (impostos% + margem% + taxaCartao%))
 */

export interface MaterialLine {
  /** Quantidade utilizada (m, m2, kg, un...). */
  quantity: number;
  /** Custo por unidade da materia-prima. */
  unitCost: number;
}

export interface PricingInput {
  /** Linhas de materia-prima (tecido, espuma, madeira, etc.). */
  materials: MaterialLine[];
  /** Horas de mao de obra do servico. */
  laborHours: number;
  /** Valor cobrado por hora de mao de obra. */
  laborHourlyRate: number;
  /**
   * Custo fixo da empresa rateado por hora produtiva.
   * (total de custos fixos mensais / horas produtivas no mes)
   */
  fixedCostPerHour: number;
  /** Custos/serviços extras adicionados ao orcamento (frete, terceiros...). */
  extraCost?: number;
  /** Aliquota de impostos sobre o faturamento (ex.: 0.06 = 6%). */
  taxRate: number;
  /** Margem de lucro desejada sobre o preco de venda (ex.: 0.30 = 30%). */
  profitMargin: number;
  /** Taxa do meio de pagamento sobre a venda (ex.: 0.0399 = 3,99%). */
  cardFee?: number;
}

export interface PricingResult {
  materialsCost: number;
  laborCost: number;
  fixedCost: number;
  extraCost: number;
  totalCost: number;
  /** Soma das aliquotas aplicadas sobre o preco (impostos + margem + taxa). */
  appliedRate: number;
  /** Divisor do markup (1 - appliedRate). */
  markupDivisor: number;
  salePrice: number;
  taxAmount: number;
  cardFeeAmount: number;
  profitAmount: number;
  /** Lucro liquido como percentual do preco de venda. */
  profitPercentOfPrice: number;
  /** Markup sobre o custo (salePrice / totalCost). */
  markupOnCost: number;
  /** Sinaliza margem/impostos invalidos (soma >= 100%). */
  invalid: boolean;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumMaterials(materials: MaterialLine[]): number {
  return materials.reduce(
    (acc, m) => acc + (m.quantity || 0) * (m.unitCost || 0),
    0
  );
}

export function computePricing(input: PricingInput): PricingResult {
  const materialsCost = sumMaterials(input.materials);
  const laborCost = (input.laborHours || 0) * (input.laborHourlyRate || 0);
  const fixedCost = (input.laborHours || 0) * (input.fixedCostPerHour || 0);
  const extraCost = input.extraCost || 0;
  const totalCost = materialsCost + laborCost + fixedCost + extraCost;

  const taxRate = input.taxRate || 0;
  const profitMargin = input.profitMargin || 0;
  const cardFee = input.cardFee || 0;
  const appliedRate = taxRate + profitMargin + cardFee;

  const invalid = appliedRate >= 1;
  const markupDivisor = invalid ? Number.NaN : 1 - appliedRate;

  const salePrice = invalid ? Number.NaN : round2(totalCost / markupDivisor);
  const taxAmount = invalid ? Number.NaN : round2(salePrice * taxRate);
  const cardFeeAmount = invalid ? Number.NaN : round2(salePrice * cardFee);
  const profitAmount = invalid
    ? Number.NaN
    : round2(salePrice - totalCost - taxAmount - cardFeeAmount);
  const profitPercentOfPrice =
    invalid || salePrice === 0 ? 0 : profitAmount / salePrice;
  const markupOnCost = invalid || totalCost === 0 ? 0 : salePrice / totalCost;

  return {
    materialsCost: round2(materialsCost),
    laborCost: round2(laborCost),
    fixedCost: round2(fixedCost),
    extraCost: round2(extraCost),
    totalCost: round2(totalCost),
    appliedRate,
    markupDivisor,
    salePrice,
    taxAmount,
    cardFeeAmount,
    profitAmount,
    profitPercentOfPrice,
    markupOnCost,
    invalid,
  };
}

export interface FixedCostItem {
  name: string;
  amount: number;
}

/** Custo fixo rateado por hora produtiva. */
export function fixedCostPerHour(
  fixedCosts: FixedCostItem[],
  productiveHours: number
): number {
  const total = (fixedCosts || []).reduce(
    (acc, c) => acc + (Number(c.amount) || 0),
    0
  );
  if (!productiveHours || productiveHours <= 0) return 0;
  return total / productiveHours;
}

export function totalFixedCosts(fixedCosts: FixedCostItem[]): number {
  return (fixedCosts || []).reduce(
    (acc, c) => acc + (Number(c.amount) || 0),
    0
  );
}
