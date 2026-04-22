import type { Meta, StoryObj } from "@storybook/react";
import { FlagQuestionButton } from "./FlagQuestionButton";

const meta: Meta<typeof FlagQuestionButton> = {
  title: "Dashboard/FlagQuestionButton",
  component: FlagQuestionButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-gem-onyx p-8">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    global.fetch = async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
  },
};

export default meta;
type Story = StoryObj<typeof FlagQuestionButton>;

export const Default: Story = {
  args: {
    attemptId: "11111111-1111-1111-1111-111111111111",
    questionId: "q-42",
    questionText: "¿Cuál es el plazo de prescripción de las acciones personales?",
    area: "civil",
  },
};

export const WithoutArea: Story = {
  args: {
    attemptId: "11111111-1111-1111-1111-111111111111",
    questionId: "q-13",
    questionText: "¿Qué diferencia hay entre nulidad y anulabilidad?",
  },
};
