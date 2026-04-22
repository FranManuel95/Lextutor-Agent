import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    rows: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Describe tu duda",
    className: "w-80",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "Tengo dudas sobre el artículo 1902 del Código Civil y la responsabilidad extracontractual en el caso práctico de la sesión de estudio de ayer.",
    className: "w-80",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "No disponible durante el examen",
    disabled: true,
    className: "w-80",
  },
};

export const Long: Story = {
  args: {
    placeholder: "Redacta tu respuesta al supuesto práctico",
    rows: 8,
    className: "w-[32rem]",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-[32rem] flex-col gap-3">
      <Textarea placeholder="Describe tu duda" />
      <Textarea defaultValue="Tengo dudas sobre el artículo 1902 del Código Civil y la responsabilidad extracontractual." />
      <Textarea placeholder="No disponible durante el examen" disabled />
      <Textarea placeholder="Redacta tu respuesta al supuesto práctico" rows={8} />
    </div>
  ),
};
