import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Selecciona un área" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="civil">Civil</SelectItem>
        <SelectItem value="penal">Penal</SelectItem>
        <SelectItem value="mercantil">Mercantil</SelectItem>
        <SelectItem value="laboral">Laboral</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Selecciona un área" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="civil">Civil</SelectItem>
        <SelectItem value="penal">Penal</SelectItem>
        <SelectItem value="mercantil">Mercantil</SelectItem>
        <SelectItem value="laboral">Laboral</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: "civil",
  },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Selecciona un área" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="civil">Civil</SelectItem>
        <SelectItem value="penal">Penal</SelectItem>
        <SelectItem value="mercantil">Mercantil</SelectItem>
        <SelectItem value="laboral">Laboral</SelectItem>
      </SelectContent>
    </Select>
  ),
};
