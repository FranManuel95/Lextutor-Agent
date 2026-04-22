import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Tu email",
    type: "email",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "alumno@estudianteelite.es",
    type: "email",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "No disponible",
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Contraseña",
    defaultValue: "secretopassword123",
  },
};

export const Error: Story = {
  args: {
    type: "email",
    placeholder: "Tu email",
    defaultValue: "correo-invalido",
    "aria-invalid": "true",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input placeholder="Tu email" type="email" />
      <Input defaultValue="alumno@estudianteelite.es" type="email" />
      <Input placeholder="No disponible" disabled />
      <Input type="password" defaultValue="secretopassword123" />
      <Input type="email" defaultValue="correo-invalido" aria-invalid="true" />
    </div>
  ),
};
