import { describe, it, expect } from "vitest";
import {
  computePricing,
  sumMaterials,
  fixedCostPerHour,
  round2,
} from "./pricing";

describe("sumMaterials", () => {
  it("soma quantidade x custo unitario", () => {
    expect(
      sumMaterials([
        { quantity: 2, unitCost: 50 },
        { quantity: 1.5, unitCost: 40 },
      ])
    ).toBe(160);
  });

  it("retorna 0 para lista vazia", () => {
    expect(sumMaterials([])).toBe(0);
  });
});

describe("fixedCostPerHour", () => {
  it("divide custos fixos pelas horas produtivas", () => {
    expect(
      fixedCostPerHour(
        [
          { name: "Aluguel", amount: 1500 },
          { name: "Energia", amount: 500 },
        ],
        160
      )
    ).toBeCloseTo(12.5, 5);
  });

  it("evita divisao por zero", () => {
    expect(fixedCostPerHour([{ name: "x", amount: 100 }], 0)).toBe(0);
  });
});

describe("computePricing - markup divisor", () => {
  it("aplica margem/impostos/taxa sobre o preco de venda", () => {
    const r = computePricing({
      materials: [{ quantity: 1, unitCost: 100 }],
      laborHours: 0,
      laborHourlyRate: 0,
      fixedCostPerHour: 0,
      taxRate: 0,
      profitMargin: 0.2,
      cardFee: 0,
    });
    // custo 100, divisor 0.8 => preco 125
    expect(r.totalCost).toBe(100);
    expect(r.salePrice).toBe(125);
    expect(r.profitAmount).toBe(25);
    expect(r.profitPercentOfPrice).toBeCloseTo(0.2, 5);
  });

  it("combina materiais, mao de obra e custo fixo rateado", () => {
    const r = computePricing({
      materials: [
        { quantity: 3, unitCost: 50 }, // 150
        { quantity: 2, unitCost: 25 }, // 50
      ],
      laborHours: 4,
      laborHourlyRate: 30, // 120
      fixedCostPerHour: 10, // 40
      taxRate: 0.06,
      profitMargin: 0.3,
      cardFee: 0.04,
    });
    expect(r.materialsCost).toBe(200);
    expect(r.laborCost).toBe(120);
    expect(r.fixedCost).toBe(40);
    expect(r.totalCost).toBe(360);
    // divisor = 1 - (0.06+0.3+0.04) = 0.6 => preco = 600
    expect(r.salePrice).toBe(600);
    expect(r.taxAmount).toBe(round2(600 * 0.06));
    expect(r.cardFeeAmount).toBe(round2(600 * 0.04));
    expect(r.profitAmount).toBe(round2(600 - 360 - 36 - 24));
    expect(r.profitAmount).toBe(180);
  });

  it("marca como invalido quando somatorio das aliquotas >= 100%", () => {
    const r = computePricing({
      materials: [{ quantity: 1, unitCost: 100 }],
      laborHours: 0,
      laborHourlyRate: 0,
      fixedCostPerHour: 0,
      taxRate: 0.5,
      profitMargin: 0.5,
      cardFee: 0.05,
    });
    expect(r.invalid).toBe(true);
    expect(Number.isNaN(r.salePrice)).toBe(true);
  });

  it("considera custos extras", () => {
    const r = computePricing({
      materials: [],
      laborHours: 0,
      laborHourlyRate: 0,
      fixedCostPerHour: 0,
      extraCost: 80,
      taxRate: 0,
      profitMargin: 0,
      cardFee: 0,
    });
    expect(r.totalCost).toBe(80);
    expect(r.salePrice).toBe(80);
    expect(r.profitAmount).toBe(0);
  });
});
