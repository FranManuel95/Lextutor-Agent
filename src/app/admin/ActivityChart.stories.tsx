import type { Meta, StoryObj } from "@storybook/react";
import { ActivityChart } from "./ActivityChart";

function buildWeekData(exams: number[], messages: number[]) {
  const today = new Date();
  return exams.map((e, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      exams: e,
      messages: messages[i] ?? 0,
    };
  });
}

const meta: Meta<typeof ActivityChart> = {
  title: "Admin/ActivityChart",
  component: ActivityChart,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gem-onyx p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActivityChart>;

export const HealthyWeek: Story = {
  args: {
    data: buildWeekData([2, 5, 3, 8, 6, 4, 7], [15, 22, 18, 30, 25, 20, 28]),
  },
};

export const QuietWeek: Story = {
  args: {
    data: buildWeekData([0, 1, 0, 2, 0, 1, 0], [0, 3, 1, 5, 2, 2, 1]),
  },
};

export const EmptyWeek: Story = {
  args: {
    data: buildWeekData([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]),
  },
};

export const ExamHeavy: Story = {
  args: {
    data: buildWeekData([10, 15, 8, 20, 12, 18, 25], [5, 8, 3, 10, 6, 9, 12]),
  },
};
