"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Car, Sofa } from "lucide-react";
import { toast } from "sonner";
import { saveProductType, deleteProductType } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SEGMENTS } from "@/lib/constants";
import type { ProductType, Segment } from "@/lib/database.types";

export function ProductsClient({ products }: { products: ProductType[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveProductType(formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success(editing ? "Produto atualizado." : "Produto adicionado.");
        setOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    startTransition(async () => {
      const res = await deleteProductType(id);
      if (res.error) toast.error(res.error);
      else toast.success("Produto removido.");
    });
  }

  const groups: { segment: Segment; label: string; icon: typeof Sofa }[] = [
    { segment: "moveis", label: "Móveis", icon: Sofa },
    { segment: "automotivo", label: "Automotivo", icon: Car },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((g) => {
          const items = products.filter(
            (p) => p.segment === g.segment || p.segment === "ambos"
          );
          return (
            <Card key={g.segment}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <g.icon className="h-5 w-5 text-primary" /> {g.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto neste segmento.
                  </p>
                ) : (
                  items.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description ? (
                          <p className="text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(p);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar produto" : "Novo produto"}
            </DialogTitle>
            <DialogDescription>
              Tipos de peça que você atende (ex.: poltrona, banco de carro).
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
                placeholder="Ex.: Poltrona"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento</Label>
              <Select name="segment" defaultValue={editing?.segment ?? "moveis"}>
                <SelectTrigger id="segment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={editing?.description ?? ""}
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
    </>
  );
}
