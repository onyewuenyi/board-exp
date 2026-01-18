import { Task, User, Priority, TaskType, ColumnType } from "@/types";

const API_BASE = "http://localhost:8001/api";

// ============================================================================
// API RESPONSE TYPES (from backend)
// ============================================================================
interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiSubtaskInTask {
  id: number;
  title: string;
  completed: boolean;
}

interface ApiLinkInTask {
  id: number;
  url: string;
  title: string | null;
}

interface ApiTask {
  id: number;
  title: string;
  description: string | null;
  assigned_user_id: number | null;
  due_date: string | null;
  status: "todo" | "in-progress" | "done";
  priority: Priority;
  task_type: TaskType;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  assignee: ApiUser | null;
  blocking: number[];
  blocked_by: number[];
  subtasks: ApiSubtaskInTask[];
  links: ApiLinkInTask[];
}

interface ApiDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  created_at: string;
}

// ============================================================================
// TYPE CONVERTERS
// ============================================================================
function apiUserToUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    name: apiUser.name,
    avatar: apiUser.avatar || undefined,
  };
}

function apiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.id),
    title: apiTask.title,
    description: apiTask.description || undefined,
    priority: apiTask.priority,
    status: apiTask.status,
    assignee: apiTask.assignee ? apiUserToUser(apiTask.assignee) : undefined,
    createdAt: new Date(apiTask.created_at).getTime(),
    updatedAt: apiTask.updated_at ? new Date(apiTask.updated_at).getTime() : undefined,
    taskType: apiTask.task_type,
    blocking: apiTask.blocking.map(String),
    blockedBy: apiTask.blocked_by.map(String),
    tags: apiTask.tags || undefined,
    subtasks: apiTask.subtasks?.map(st => ({
      id: String(st.id),
      title: st.title,
      completed: st.completed,
    })) || [],
    links: apiTask.links?.map(l => ({
      id: String(l.id),
      url: l.url,
      title: l.title || undefined,
    })) || [],
  };
}

// ============================================================================
// API ERROR HANDLING
// ============================================================================
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// USER API
// ============================================================================
export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users`);
  const apiUsers = await handleResponse<ApiUser[]>(response);
  return apiUsers.map(apiUserToUser);
}

export async function createUser(data: { name: string; email: string; avatar?: string }): Promise<User> {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const apiUser = await handleResponse<ApiUser>(response);
  return apiUserToUser(apiUser);
}

// ============================================================================
// TASK API
// ============================================================================
export interface FetchTasksParams {
  status?: ColumnType["id"];
  assigned_user_id?: number;
  priority?: Priority;
  sort_by?: "due_date" | "priority" | "created_at";
  sort_order?: "asc" | "desc";
}

export async function fetchTasks(params?: FetchTasksParams): Promise<Task[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.assigned_user_id) searchParams.set("assigned_user_id", String(params.assigned_user_id));
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const url = `${API_BASE}/tasks${searchParams.toString() ? `?${searchParams}` : ""}`;
  const response = await fetch(url);
  const apiTasks = await handleResponse<ApiTask[]>(response);
  return apiTasks.map(apiTaskToTask);
}

export async function fetchTask(taskId: string): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`);
  const apiTask = await handleResponse<ApiTask>(response);
  return apiTaskToTask(apiTask);
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_user_id?: number;
  due_date?: string;
  status?: ColumnType["id"];
  priority?: Priority;
  task_type?: TaskType;
  tags?: string[];
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const apiTask = await handleResponse<ApiTask>(response);
  return apiTaskToTask(apiTask);
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assigned_user_id?: number | null;
  due_date?: string | null;
  status?: ColumnType["id"];
  priority?: Priority;
  task_type?: TaskType;
  tags?: string[];
}

export async function updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const apiTask = await handleResponse<ApiTask>(response);
  return apiTaskToTask(apiTask);
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
}

// ============================================================================
// DEPENDENCY API
// ============================================================================
export async function createDependency(taskId: string, dependsOnTaskId: string): Promise<ApiDependency> {
  const response = await fetch(`${API_BASE}/dependencies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task_id: Number(taskId),
      depends_on_task_id: Number(dependsOnTaskId),
    }),
  });
  return handleResponse<ApiDependency>(response);
}

export async function deleteDependency(dependencyId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/dependencies/${dependencyId}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
}

export async function fetchDependenciesForTask(taskId: string): Promise<ApiDependency[]> {
  const response = await fetch(`${API_BASE}/dependencies/task/${taskId}`);
  return handleResponse<ApiDependency[]>(response);
}

// ============================================================================
// SUBTASK API
// ============================================================================
interface ApiSubtask {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubtaskData {
  id: string;
  title: string;
  completed: boolean;
}

function apiSubtaskToSubtask(apiSubtask: ApiSubtask): SubtaskData {
  return {
    id: String(apiSubtask.id),
    title: apiSubtask.title,
    completed: apiSubtask.completed,
  };
}

export async function fetchSubtasksForTask(taskId: string): Promise<SubtaskData[]> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/subtasks`);
  const apiSubtasks = await handleResponse<ApiSubtask[]>(response);
  return apiSubtasks.map(apiSubtaskToSubtask);
}

export async function createSubtask(taskId: string, title: string): Promise<SubtaskData> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const apiSubtask = await handleResponse<ApiSubtask>(response);
  return apiSubtaskToSubtask(apiSubtask);
}

export async function updateSubtask(
  subtaskId: string,
  update: { title?: string; completed?: boolean }
): Promise<SubtaskData> {
  const response = await fetch(`${API_BASE}/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  const apiSubtask = await handleResponse<ApiSubtask>(response);
  return apiSubtaskToSubtask(apiSubtask);
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
}

// ============================================================================
// TASK LINK API
// ============================================================================
interface ApiTaskLink {
  id: number;
  task_id: number;
  url: string;
  title: string | null;
  created_at: string;
}

export interface TaskLinkData {
  id: string;
  url: string;
  title?: string;
}

function apiLinkToLink(apiLink: ApiTaskLink): TaskLinkData {
  return {
    id: String(apiLink.id),
    url: apiLink.url,
    title: apiLink.title || undefined,
  };
}

export async function fetchLinksForTask(taskId: string): Promise<TaskLinkData[]> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/links`);
  const apiLinks = await handleResponse<ApiTaskLink[]>(response);
  return apiLinks.map(apiLinkToLink);
}

export async function createLink(
  taskId: string,
  url: string,
  title?: string
): Promise<TaskLinkData> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title }),
  });
  const apiLink = await handleResponse<ApiTaskLink>(response);
  return apiLinkToLink(apiLink);
}

export async function deleteLink(linkId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/links/${linkId}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE.replace("/api", "")}/health`);
    const data = await response.json();
    return data.status === "healthy";
  } catch {
    return false;
  }
}
