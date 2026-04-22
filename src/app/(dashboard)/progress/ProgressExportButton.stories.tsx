import type { Meta, StoryObj } from "@storybook/react";
import { ProgressExportButton } from "./ProgressExportButton";

const SAMPLE_DATA = {
  totalAnswers: 74,
  distribution: {
    civil: 30,
    laboral: 22,
    mercantil: 12,
    procesal: 10,
  },
  milestones: [
    { title: "Iniciado", desc: "Primera pregunta realizada", unlocked: true },
    { title: "Estudiante", desc: "10 preguntas completadas", unlocked: true },
    { title: "Experto", desc: "50 preguntas completadas", unlocked: true },
    { title: "Elite", desc: "100 preguntas completadas", unlocked: false },
  ],
  generatedAt: "22/04/2026, 12:00:00",
};

const meta: Meta<typeof ProgressExportButton> = {
  title: "Dashboard/ProgressExportButton",
  component: ProgressExportButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ProgressExportButton>;

export const Default: Story = {
  args: {
    data: SAMPLE_DATA,
  },
};

export const NoAnswers: Story = {
  args: {
    data: {
      totalAnswers: 0,
      distribution: {},
      milestones: SAMPLE_DATA.milestones.map((m) => ({ ...m, unlocked: false })),
      generatedAt: "22/04/2026, 12:00:00",
    },
  },
};

export const AllMilestonesUnlocked: Story = {
  args: {
    data: {
      ...SAMPLE_DATA,
      totalAnswers: 150,
      milestones: SAMPLE_DATA.milestones.map((m) => ({ ...m, unlocked: true })),
    },
  },
};
