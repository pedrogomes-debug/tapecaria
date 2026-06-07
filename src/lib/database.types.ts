export type Segment = "moveis" | "automotivo" | "ambos";

export type MaterialCategory =
  | "tecido"
  | "madeira"
  | "chapa"
  | "espuma"
  | "plumante"
  | "aviamento"
  | "outro";

export type BudgetStatus = "rascunho" | "enviado" | "aprovado" | "recusado";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "pending"
  | "none";

export type BudgetItemKind = "material" | "labor" | "extra";

export interface FixedCostItem {
  name: string;
  amount: number;
}

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          company_name: string | null;
          owner_name: string | null;
          segment: Segment;
          tax_regime: string | null;
          phone: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          company_name?: string | null;
          owner_name?: string | null;
          segment?: Segment;
          tax_regime?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          pagarme_subscription_id: string | null;
          pagarme_customer_id: string | null;
          status: SubscriptionStatus;
          plan: string | null;
          current_period_end: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          pagarme_subscription_id?: string | null;
          pagarme_customer_id?: string | null;
          status?: SubscriptionStatus;
          plan?: string | null;
          current_period_end?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          document: string | null;
          address: string | null;
          kind: string | null;
          vehicle_info: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          document?: string | null;
          address?: string | null;
          kind?: string | null;
          vehicle_info?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: MaterialCategory;
          unit: string;
          unit_cost: number;
          supplier: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: MaterialCategory;
          unit: string;
          unit_cost: number;
          supplier?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      cost_settings: {
        Row: {
          id: string;
          user_id: string;
          fixed_costs: FixedCostItem[];
          productive_hours: number;
          labor_hourly_rate: number;
          default_tax_rate: number;
          default_profit_margin: number;
          default_card_fee: number;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          fixed_costs?: FixedCostItem[];
          productive_hours?: number;
          labor_hourly_rate?: number;
          default_tax_rate?: number;
          default_profit_margin?: number;
          default_card_fee?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["cost_settings"]["Insert"]
        >;
        Relationships: [];
      };
      product_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          segment: Segment;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          segment: Segment;
          description?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_types"]["Insert"]
        >;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          product_type_id: string | null;
          title: string;
          segment: Segment;
          status: BudgetStatus;
          materials_cost: number;
          labor_hours: number;
          labor_cost: number;
          fixed_cost: number;
          total_cost: number;
          tax_rate: number;
          profit_margin: number;
          card_fee: number;
          sale_price: number;
          profit_amount: number;
          notes: string | null;
          service_description: string | null;
          valid_until: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          product_type_id?: string | null;
          title: string;
          segment?: Segment;
          status?: BudgetStatus;
          materials_cost?: number;
          labor_hours?: number;
          labor_cost?: number;
          fixed_cost?: number;
          total_cost?: number;
          tax_rate?: number;
          profit_margin?: number;
          card_fee?: number;
          sale_price?: number;
          profit_amount?: number;
          notes?: string | null;
          service_description?: string | null;
          valid_until?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string | null;
          monthly_salary: number;
          monthly_hours: number;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          role?: string | null;
          monthly_salary?: number;
          monthly_hours?: number;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
        Relationships: [];
      };
      budget_assignments: {
        Row: {
          id: string;
          budget_id: string;
          user_id: string;
          employee_id: string | null;
          name: string;
          hours: number;
          hourly_cost: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          user_id: string;
          employee_id?: string | null;
          name: string;
          hours: number;
          hourly_cost: number;
          total: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["budget_assignments"]["Insert"]
        >;
        Relationships: [];
      };
      budget_items: {
        Row: {
          id: string;
          budget_id: string;
          user_id: string;
          kind: BudgetItemKind;
          material_id: string | null;
          description: string;
          quantity: number;
          unit: string | null;
          unit_cost: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          user_id: string;
          kind: BudgetItemKind;
          material_id?: string | null;
          description: string;
          quantity: number;
          unit?: string | null;
          unit_cost: number;
          total: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["budget_items"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Subscription =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Material = Database["public"]["Tables"]["materials"]["Row"];
export type CostSettings =
  Database["public"]["Tables"]["cost_settings"]["Row"];
export type ProductType =
  Database["public"]["Tables"]["product_types"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type BudgetAssignment =
  Database["public"]["Tables"]["budget_assignments"]["Row"];

export function employeeHourlyCost(emp: {
  monthly_salary: number;
  monthly_hours: number;
}): number {
  const hours = Number(emp.monthly_hours) || 0;
  if (hours <= 0) return 0;
  return (Number(emp.monthly_salary) || 0) / hours;
}
