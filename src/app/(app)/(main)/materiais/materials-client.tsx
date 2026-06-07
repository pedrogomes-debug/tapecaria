"use client";

import { useRef, useState, useTransition } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveMaterial,
  deleteMaterial,
  importMaterials,
  type ImportMaterialInput,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABEL,
  UNITS,
} from "@/lib/constants";
import type { Material } from "@/lib/database.types";

const TEMPLATE_HEADERS = [
  "Nome",
  "Categoria",
  "Unidade",
  "Custo unitário",
  "Fornecedor",
  "Observações",
];

function looksLikeHeader(row: unknown[]): boolean {
  const first = String(row[0] ?? "").toLowerCase().trim();
  return first === "nome" || first === "name";
}

export function MaterialsClient({ materials }: { materials: Material[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [pending, startTransition] = useTransition();

  const [importOpen, setImportOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportMaterialInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(material: Material) {
    setEditing(material);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveMaterial(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(editing ? "Material atualizado." : "Material adicionado.");
        setOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este material?")) return;
    startTransition(async () => {
      const res = await deleteMaterial(id);
      if (res.error) toast.error(res.error);
      else toast.success("Material removido.");
    });
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: "",
      });

      const dataRows =
        rows.length && looksLikeHeader(rows[0]) ? rows.slice(1) : rows;

      const mapped: ImportMaterialInput[] = dataRows
        .map((row) => ({
          name: String(row[0] ?? "").trim(),
          category: String(row[1] ?? "").trim(),
          unit: String(row[2] ?? "").trim(),
          unit_cost: String(row[3] ?? "").trim(),
          supplier: String(row[4] ?? "").trim(),
          notes: String(row[5] ?? "").trim(),
        }))
        .filter((r) => r.name.length > 0);

      if (mapped.length === 0) {
        toast.error("Nenhum material válido encontrado no arquivo.");
        setParsedRows([]);
        return;
      }
      setParsedRows(mapped);
    } catch {
      toast.error("Não foi possível ler o arquivo. Use .xlsx, .xls ou .csv.");
      setParsedRows([]);
    }
  }

  function handleImport() {
    if (parsedRows.length === 0) return;
    startImport(async () => {
      const res = await importMaterials(parsedRows);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const extra =
        res.skipped && res.skipped > 0 ? ` (${res.skipped} ignorados)` : "";
      toast.success(`${res.inserted} material(is) importado(s).${extra}`);
      setImportOpen(false);
      setParsedRows([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ["Tecido suede liso", "Tecido", "m", "39.90", "Fornecedor X", ""],
      ["Espuma D33", "Espuma", "m²", "120.00", "", "Densidade 33"],
      ["Cola de contato", "Outro", "L", "55.00", "", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materiais");
    XLSX.writeFile(wb, "modelo-materiais.xlsx");
  }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Importar Excel
        </Button>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo material
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {materials.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma matéria-prima cadastrada ainda. Adicione tecidos, espumas,
              madeiras, chapas, plumantes e aviamentos.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Custo unit.</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {MATERIAL_CATEGORY_LABEL[m.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(m.unit_cost))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.supplier || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <datalist id="units-list">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar material" : "Novo material"}
            </DialogTitle>
            <DialogDescription>
              Cadastre o custo por unidade para usar nos orçamentos.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex.: Tecido suede liso"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  name="category"
                  defaultValue={editing?.category ?? "tecido"}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  name="unit"
                  list="units-list"
                  placeholder="Ex.: m, m², kg, un..."
                  defaultValue={editing?.unit ?? "m"}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Custo por unidade (R$)</Label>
                <Input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.unit_cost ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  defaultValue={editing?.supplier ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={editing?.notes ?? ""}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(o) => {
          setImportOpen(o);
          if (!o) {
            setParsedRows([]);
            setFileName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar materiais via Excel</DialogTitle>
            <DialogDescription>
              As colunas devem estar nesta ordem: Nome, Categoria, Unidade, Custo
              unitário, Fornecedor, Observações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              type="button"
            >
              <Download className="h-4 w-4" /> Baixar modelo (.xlsx)
            </Button>

            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {fileName || "Selecione um arquivo .xlsx, .xls ou .csv"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> Escolher arquivo
              </Button>
            </div>

            {parsedRows.length > 0 ? (
              <p className="text-sm text-foreground">
                <span className="font-medium">{parsedRows.length}</span>{" "}
                material(is) prontos para importar.
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Categorias aceitas: Tecido, Madeira, Chapa, Espuma, Plumante,
              Aviamento, Outro. Se não reconhecida, entra como “Outro”.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setImportOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={parsedRows.length === 0 || importing}
              onClick={handleImport}
            >
              {importing ? "Importando..." : `Importar ${parsedRows.length || ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
