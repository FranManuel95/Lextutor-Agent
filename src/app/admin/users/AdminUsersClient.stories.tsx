import type { Meta, StoryObj } from "@storybook/react";
import { AdminUsersClient } from "./AdminUsersClient";

const MOCK_USERS = [
  {
    id: "user-1",
    full_name: "Ana García López",
    avatar_url: null,
    role: "admin",
    created_at: "2026-01-15T10:30:00Z",
    email: "ana.garcia@example.com",
  },
  {
    id: "user-2",
    full_name: "Carlos Martínez",
    avatar_url: null,
    role: "student",
    created_at: "2026-02-01T09:00:00Z",
    email: "carlos.martinez@example.com",
  },
  {
    id: "user-3",
    full_name: "Lucía Fernández",
    avatar_url: null,
    role: "student",
    created_at: "2026-02-20T14:15:00Z",
    email: "lucia.fernandez@example.com",
  },
  {
    id: "user-4",
    full_name: "Miguel Torres",
    avatar_url: null,
    role: "student",
    created_at: "2026-03-05T08:45:00Z",
    email: "miguel.torres@example.com",
  },
  {
    id: "admin-current",
    full_name: "Admin Actual",
    avatar_url: null,
    role: "admin",
    created_at: "2026-01-01T00:00:00Z",
    email: "admin@example.com",
  },
];

const meta: Meta<typeof AdminUsersClient> = {
  title: "Admin/AdminUsersClient",
  component: AdminUsersClient,
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
  beforeEach: () => {
    // Mock fetch for role toggle — returns success by default
    global.fetch = async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
  },
};

export default meta;
type Story = StoryObj<typeof AdminUsersClient>;

export const Default: Story = {
  args: {
    users: MOCK_USERS,
    currentUserId: "admin-current",
  },
};

export const EmptyList: Story = {
  args: {
    users: [],
    currentUserId: "admin-current",
  },
};

export const OnlyAdmins: Story = {
  args: {
    users: MOCK_USERS.filter((u) => u.role === "admin"),
    currentUserId: "admin-current",
  },
};

export const SingleUser: Story = {
  args: {
    users: [MOCK_USERS[1]],
    currentUserId: "admin-current",
  },
};

export const ManyUsers: Story = {
  args: {
    users: Array.from({ length: 20 }, (_, i) => ({
      id: `user-${i}`,
      full_name: `Usuario Test ${i + 1}`,
      avatar_url: null,
      role: i % 4 === 0 ? "admin" : "student",
      created_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
      email: `user${i + 1}@example.com`,
    })),
    currentUserId: "user-0",
  },
};
