"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface QuotePdfData {
  company: string;
  companyPhone?: string | null;
  title: string;
  clientName?: string | null;
  createdAt: string;
  validUntil?: string | null;
  serviceDescription?: string | null;
  salePrice: number;
}

export function DownloadPdfButton({ data }: { data: QuotePdfData }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Cabeçalho: nome da empresa
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(data.company, margin, y);
      y += 18;

      if (data.companyPhone) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(data.companyPhone, margin, y);
        doc.setTextColor(0);
        y += 14;
      }

      y += 8;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 28;

      // Título "Orçamento"
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Orçamento", margin, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(data.title, margin, y);
      y += 18;

      // Metadados (data, validade, cliente)
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text(`Data: ${formatDate(data.createdAt)}`, margin, y);
      if (data.validUntil) {
        doc.text(
          `Válido até: ${formatDate(data.validUntil)}`,
          pageWidth - margin,
          y,
          { align: "right" }
        );
      }
      y += 14;
      if (data.clientName) {
        doc.text(`Cliente: ${data.clientName}`, margin, y);
        y += 14;
      }
      doc.setTextColor(0);

      y += 16;

      // Descritivo do serviço
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Descritivo do serviço", margin, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const description =
        data.serviceDescription?.trim() || "Serviço conforme combinado.";
      const lines = doc.splitTextToSize(description, contentWidth) as string[];
      doc.text(lines, margin, y, { lineHeightFactor: 1.5 });
      y += lines.length * 11 * 1.5 + 28;

      // Valor final em destaque
      const boxHeight = 56;
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 6, 6, "F");
      doc.setTextColor(255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Valor total do orçamento", margin + 18, y + 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(
        formatCurrency(data.salePrice),
        pageWidth - margin - 18,
        y + 36,
        { align: "right" }
      );
      doc.setTextColor(0);

      const safeTitle = data.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase();
      doc.save(`orcamento-${safeTitle || "cliente"}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading}>
      <FileDown className="h-4 w-4" /> {loading ? "Gerando..." : "Baixar PDF"}
    </Button>
  );
}
