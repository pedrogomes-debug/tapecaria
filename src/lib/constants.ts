import type {
  MaterialCategory,
  Segment,
  BudgetStatus,
} from "@/lib/database.types";

export const MATERIAL_CATEGORIES: {
  value: MaterialCategory;
  label: string;
  defaultUnit: string;
}[] = [
  { value: "tecido", label: "Tecido", defaultUnit: "m" },
  { value: "madeira", label: "Madeira", defaultUnit: "m" },
  { value: "chapa", label: "Chapa", defaultUnit: "un" },
  { value: "espuma", label: "Espuma", defaultUnit: "m²" },
  { value: "plumante", label: "Plumante / enchimento", defaultUnit: "kg" },
  { value: "aviamento", label: "Aviamento", defaultUnit: "un" },
  { value: "outro", label: "Outro", defaultUnit: "un" },
];

export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> =
  Object.fromEntries(
    MATERIAL_CATEGORIES.map((c) => [c.value, c.label])
  ) as Record<MaterialCategory, string>;

export const UNITS = ["m", "m²", "kg", "un", "L", "par", "rolo", "h"];

export const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "moveis", label: "Móveis" },
  { value: "automotivo", label: "Automotivo" },
  { value: "ambos", label: "Ambos" },
];

export const SEGMENT_LABEL: Record<Segment, string> = {
  moveis: "Móveis",
  automotivo: "Automotivo",
  ambos: "Ambos",
};

export const BUDGET_STATUS: {
  value: BudgetStatus;
  label: string;
  variant: "secondary" | "default" | "success" | "destructive";
}[] = [
  { value: "rascunho", label: "Rascunho", variant: "secondary" },
  { value: "enviado", label: "Enviado", variant: "default" },
  { value: "aprovado", label: "Aprovado", variant: "success" },
  { value: "recusado", label: "Recusado", variant: "destructive" },
];

export const BUDGET_STATUS_MAP = Object.fromEntries(
  BUDGET_STATUS.map((s) => [s.value, s])
) as Record<BudgetStatus, (typeof BUDGET_STATUS)[number]>;
