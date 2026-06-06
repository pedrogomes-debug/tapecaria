"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Phone,
  Mail,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveClient,
  deleteClient,
  importClients,
  type ImportClientInput,
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
import type { Client } from "@/lib/database.types";

const TEMPLATE_HEADERS = [
  "Nome",
  "Telefone",
  "Email",
  "Tipo",
  "CPF ou CNPJ",
  "Endereço",
];

function looksLikeHeader(row: unknown[]): boolean {
  const first = String(row[0] ?? "").toLowerCase().trim();
  return first === "nome" || first === "name";
}

export function ClientsClient({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportClientInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const kindLabel = c.kind === "empresa" ? "empresa pessoa jurídica" : "pessoa física";
      const haystack = [
        c.name,
        c.email,
        c.phone,
        c.document,
        c.address,
        c.vehicle_info,
        c.notes,
        kindLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [clients, search]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveClient(formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success(editing ? "Cliente atualizado." : "Cliente adicionado.");
        setOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este cliente?")) return;
    startTransition(async () => {
      const res = await deleteClient(id);
      if (res.error) toast.error(res.error);
      else toast.success("Cliente removido.");
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

      const dataRows = rows.length && looksLikeHeader(rows[0]) ? rows.slice(1) : rows;

      const mapped: ImportClientInput[] = dataRows
        .map((row) => ({
          name: String(row[0] ?? "").trim(),
          phone: String(row[1] ?? "").trim(),
          email: String(row[2] ?? "").trim(),
          kind: String(row[3] ?? "").trim(),
          document: String(row[4] ?? "").trim(),
          address: String(row[5] ?? "").trim(),
        }))
        .filter((r) => r.name.length > 0);

      if (mapped.length === 0) {
        toast.error("Nenhum cliente válido encontrado no arquivo.");
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
      const res = await importClients(parsedRows);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const extra =
        res.skipped && res.skipped > 0 ? ` (${res.skipped} ignorados)` : "";
      toast.success(`${res.inserted} cliente(s) importado(s).${extra}`);
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
      ["João da Silva", "(11) 99999-0000", "joao@email.com", "Pessoa Física", "123.456.789-00", "Rua A, 100"],
      ["Estofados Ltda", "(11) 3333-0000", "contato@estofados.com", "Pessoa Jurídica", "12.345.678/0001-90", "Av. B, 200"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo-clientes.xlsx");
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, e-mail, documento, endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar Excel
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado ainda.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado para “{search}”.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      {c.document ? (
                        <div className="text-xs text-muted-foreground">
                          {c.document}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {c.phone ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        ) : null}
                        {c.email ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.kind === "empresa" ? "Empresa" : "Pessoa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.address || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Dados de contato e informações para orçamentos.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editing?.phone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kind">Tipo</Label>
                <Select name="kind" defaultValue={editing?.kind ?? "pessoa"}>
                  <SelectTrigger id="kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa">Pessoa física</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CPF / CNPJ</Label>
                <Input
                  id="document"
                  name="document"
                  defaultValue={editing?.document ?? ""}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={editing?.address ?? ""}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  defaultValue={editing?.notes ?? ""}
                />
              </div>
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
            <DialogTitle>Importar clientes via Excel</DialogTitle>
            <DialogDescription>
              As colunas devem estar nesta ordem: Nome, Telefone, Email, Tipo
              (Pessoa Física ou Pessoa Jurídica), CPF ou CNPJ, Endereço.
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
                cliente(s) prontos para importar.
              </p>
            ) : null}
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
