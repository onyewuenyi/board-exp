export type Priority = "urgent" | "high" | "med" | "low" | "none";

export type TaskType = "chore" | "errand" | "homework" | "appointment" | "other";

export interface User {
  id: string;
  name: string;
  avatar?: string; // URL
}

export interface TaskLink {
  id: string;
  url: string;
  title?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string; // e.g. AMA-123
  title: string;
  description?: string; // Optional detailed description
  priority: Priority;
  status: "todo" | "in-progress" | "done";
  assignee?: User;
  createdAt: number;
  updatedAt?: number;

  // Task categorization
  taskType?: TaskType;

  // Dependencies
  blocking?: string[]; // IDs of tasks this task blocks
  blockedBy?: string[]; // IDs of tasks blocking this task

  // Metadata
  tags?: string[];
  project?: string;

  // Progressive disclosure fields
  failureCost?: string; // "Dinner will be late → bedtime meltdown"
  timeEstimate?: number; // Estimated minutes
  links?: TaskLink[];
  subtasks?: Subtask[];
}

export interface ColumnType {
  id: "todo" | "in-progress" | "done";
  title: string;
  tasks: Task[];
}
