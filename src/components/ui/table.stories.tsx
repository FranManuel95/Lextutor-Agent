import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const documentos = [
  {
    nombre: "Código Civil — Libro IV",
    area: "Civil",
    fecha: "2026-01-14",
  },
  {
    nombre: "Ley de Enjuiciamiento Criminal",
    area: "Penal",
    fecha: "2026-02-03",
  },
  {
    nombre: "Ley de Sociedades de Capital",
    area: "Mercantil",
    fecha: "2026-03-21",
  },
];

export const Default: Story = {
  render: () => (
    <Table className="w-[36rem]">
      <TableCaption>Documentos indexados en el RAG del tutor.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documentos.map((doc) => (
          <TableRow key={doc.nombre}>
            <TableCell className="font-medium">{doc.nombre}</TableCell>
            <TableCell>{doc.area}</TableCell>
            <TableCell>{doc.fecha}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
