import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Continuar",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Eliminar examen",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Ver historial",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Guardar borrador",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Cancelar",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: "No disponible",
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Pequeño</Button>
      <Button size="default">Normal</Button>
      <Button size="lg">Grande</Button>
    </div>
  ),
};
