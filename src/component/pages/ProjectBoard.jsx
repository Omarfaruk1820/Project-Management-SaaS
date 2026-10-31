import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowDown,
  FiArrowLeft,
  FiArrowUp,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCommand,
  FiFilter,
  FiGrid,
  FiLayers,
  FiList,
  FiLoader,
  FiMoreHorizontal,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShare2,
  FiSliders,
  FiTag,
  FiTarget,
  FiUsers,
  FiX,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const COLUMNS = [
  {
    id: "todo",
    title: "To do",
    description: "Ready to get started",
    icon: FiLayers,
    color: "slate",
    accent: "bg-slate-500",
    header: "bg-slate-50/90 border-slate-200",
    count: "bg-white text-slate-600 border-slate-200",
    drop: "bg-slate-100/80 border-slate-300",
  },
  {
    id: "in-progress",
    title: "In progress",
    description: "Currently being worked on",
    icon: FiActivity,
    color: "blue",
    accent: "bg-blue-500",
    header: "bg-blue-50/80 border-blue-100",
    count: "bg-white text-blue-700 border-blue-100",
    drop: "bg-blue-50 border-blue-300",
  },
  {
    id: "review",
    title: "In review",
    description: "Waiting for feedback",
    icon: FiClock,
    color: "violet",
    accent: "bg-violet-500",
    header: "bg-violet-50/80 border-violet-100",
    count: "bg-white text-violet-700 border-violet-100",
    drop: "bg-violet-50 border-violet-300",
  },
  {
    id: "done",
    title: "Done",
    description: "Successfully completed",
    icon: FiCheckCircle,
    color: "emerald",
    accent: "bg-emerald-500",
    header: "bg-emerald-50/80 border-emerald-100",
    count: "bg-white text-emerald-700 border-emerald-100",
    drop: "bg-emerald-50 border-emerald-300",
  },
];

const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PRIORITY_STYLES = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
  labels: "",
};

function getErrorMessage(result, fallback) {
  return result?.message || fallback;
}

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function isOverdue(value, status) {
  if (!value || status === "done") return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function getInitials(value) {
  if (!value) return "U";

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Avatar({ name, photoURL, size = "h-8 w-8" }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name || "Team member"}
        title={name || "Team member"}
        className={`${size} shrink-0 rounded-full border-2 border-white object-cover shadow-sm`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      title={name || "Team member"}
      className={`${size} flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-bold text-indigo-700 shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

function PriorityBadge({ priority = "medium" }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
      }`}
    >
      {priority === "urgent" ? (
        <FiAlertCircle size={12} />
      ) : priority === "high" ? (
        <FiArrowUp size={12} />
      ) : priority === "low" ? (
        <FiArrowDown size={12} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}

function TaskCard({ task, onDragStart, onDragEnd, onEdit }) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
      onDoubleClick={() => onEdit(task)}
      className="group cursor-grab rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/50 active:cursor-grabbing sm:p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {task.priority && <PriorityBadge priority={task.priority} />}
          {task.labels?.slice(0, 1).map((label) => (
            <span
              key={label}
              className="inline-flex max-w-24 items-center gap-1 truncate rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
            >
              <FiTag size={10} />
              {label}
            </span>
          ))}
        </div>

        <button
          type="button"
          title="Edit task"
          onClick={() => onEdit(task)}
          className="rounded-lg p-1.5 text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FiMoreHorizontal size={17} />
        </button>
      </div>

      <h3 className="break-words text-[13px] font-semibold leading-5 text-slate-800">
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-xs leading-5 text-slate-500">
          {task.description}
        </p>
      )}

      {task.labels?.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.labels.slice(1, 3).map((label) => (
            <span
              key={label}
              className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-600"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-1 py-1 text-[10px] text-slate-400">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div
          className={`flex min-w-0 items-center gap-1.5 text-[11px] ${
            overdue ? "font-semibold text-rose-600" : "text-slate-500"
          }`}
        >
          {overdue ? <FiAlertCircle size={13} /> : <FiCalendar size={13} />}
          <span className="truncate">
            {task.dueDate ? formatDate(task.dueDate) : "No due date"}
          </span>
        </div>

        {task.assignee ? (
          <Avatar
            name={task.assignee.name}
            photoURL={task.assignee.photoURL}
            size="h-7 w-7"
          />
        ) : task.assigneeId ? (
          <Avatar name={task.assigneeId} size="h-7 w-7" />
        ) : (
          <span
            title="Unassigned"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400"
          >
            <FiUsers size={12} />
          </span>
        )}
      </div>
    </article>
  );
}

function KanbanColumn({
  column,
  tasks,
  isDragging,
  activeDrop,
  onDrop,
  onDragOver,
  onDragLeave,
  onDragStart,
  onDragEnd,
  onAddTask,
  onEditTask,
}) {
  const Icon = column.icon;

  return (
    <section className="flex min-w-0 flex-col">
      <div
        className={`rounded-t-xl border border-b-0 px-3.5 py-3 sm:px-4 ${column.header}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${column.accent}`}
            />
            <h2 className="truncate text-[13px] font-bold text-slate-800">
              {column.title}
            </h2>
            <span
              className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold ${column.count}`}
            >
              {tasks.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            title={`Add task to ${column.title}`}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-indigo-600"
          >
            <FiPlus size={16} />
          </button>
        </div>
        <p className="mt-1.5 pl-4 text-[10px] text-slate-500">
          {column.description}
        </p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(event) => onDrop(event, column.id)}
        className={`flex min-h-[260px] flex-1 flex-col gap-3 rounded-b-xl border p-2.5 transition-colors sm:p-3 ${
          activeDrop
            ? `${column.drop} border-dashed`
            : "border-slate-200/80 bg-slate-50/65"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onEdit={onEditTask}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={`flex min-h-40 flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
              activeDrop
                ? "border-indigo-300 bg-white/80"
                : "border-slate-200 bg-white/60"
            }`}
          >
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Icon size={17} />
            </span>
            <p className="text-xs font-medium text-slate-600">
              {isDragging ? "Drop task here" : "No tasks yet"}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              {isDragging
                ? "Move this task into this stage"
                : "Add a task to get started"}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-transparent py-2.5 text-xs font-medium text-slate-500 transition hover:border-indigo-200 hover:bg-white hover:text-indigo-600"
        >
          <FiPlus size={14} />
          Add task
        </button>
      </div>
    </section>
  );
}

function TaskModal({
  open,
  onClose,
  onSave,
  initialTask,
  initialStatus,
  saving,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm(
      initialTask
        ? {
            title: initialTask.title || "",
            description: initialTask.description || "",
            priority: initialTask.priority || "medium",
            status: initialTask.status || "todo",
            dueDate: initialTask.dueDate
              ? new Date(initialTask.dueDate).toISOString().slice(0, 10)
              : "",
            labels: (initialTask.labels || []).join(", "),
          }
        : { ...INITIAL_FORM, status: initialStatus || "todo" },
    );

    setFormError("");
  }, [open, initialTask, initialStatus]);

  if (!open) return null;

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please enter a task title.");
      return;
    }

    const labels = form.labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    if (labels.length > 10) {
      setFormError("You can add up to 10 labels.");
      return;
    }

    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        labels: [...new Set(labels)],
      });
      onClose();
    } catch (error) {
      setFormError(error.message || "Unable to save task.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              Task management
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {initialTask ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Add details to help your team stay aligned.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <FiX size={19} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-6">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Task title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              name="title"
              value={form.title}
              onChange={updateField}
              maxLength={160}
              required
              autoFocus
              placeholder="e.g. Build the product listing page"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              value={form.description}
              onChange={updateField}
              maxLength={5000}
              rows={3}
              placeholder="What needs to be done?"
              className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-status"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Status
              </label>
              <select
                id="task-status"
                name="status"
                value={form.status}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                {COLUMNS.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                value={form.priority}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Due date
              </label>
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={updateField}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label
                htmlFor="task-labels"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Labels
              </label>
              <input
                id="task-labels"
                name="labels"
                value={form.labels}
                onChange={updateField}
                placeholder="Frontend, UI"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <FiLoader className="animate-spin" size={16} />
              ) : (
                <FiCheck size={16} />
              )}
              {saving
                ? "Saving..."
                : initialTask
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ProjectBoard = () => {
  const { id, projectId: projectIdParam } = useParams();
  const projectId = id || projectIdParam;

  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDrop, setActiveDrop] = useState("");
  const [savingTaskId, setSavingTaskId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState("todo");
  const [savingForm, setSavingForm] = useState(false);

  const getToken = useCallback(async () => {
    if (!user) throw new Error("Please sign in to access this project.");
    return user.getIdToken();
  }, [user]);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          getErrorMessage(result, `Request failed (${response.status}).`),
        );
      }

      return result;
    },
    [getToken],
  );

  const loadBoard = useCallback(async () => {
    if (!projectId || !user) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [projectResult, taskResult] = await Promise.all([
        apiRequest(`/api/v1/projects/${projectId}`),
        apiRequest(
          `/api/v1/tasks?projectId=${encodeURIComponent(projectId)}&page=1&limit=100`,
        ),
      ]);

      setProject(projectResult.data.project);
      setTasks(taskResult.data.tasks || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load this project.");
    } finally {
      setLoading(false);
    }
  }, [projectId, user, apiRequest]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          !query ||
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.labels?.some((label) => label.toLowerCase().includes(query));

        const matchesPriority =
          priorityFilter === "all" || task.priority === priorityFilter;

        const matchesAssignee =
          assigneeFilter === "all" ||
          (assigneeFilter === "unassigned"
            ? !task.assigneeId
            : task.assigneeId === assigneeFilter);

        return matchesSearch && matchesPriority && matchesAssignee;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }

        if (sortBy === "priority") {
          const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (rank[a.priority] ?? 4) - (rank[b.priority] ?? 4);
        }

        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }

        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [tasks, search, priorityFilter, assigneeFilter, sortBy]);

  const tasksByStatus = useMemo(() => {
    return Object.fromEntries(
      COLUMNS.map((column) => [
        column.id,
        filteredTasks.filter((task) => task.status === column.id),
      ]),
    );
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "done").length;
    const inProgress = tasks.filter(
      (task) => task.status === "in-progress",
    ).length;
    const overdue = tasks.filter((task) =>
      isOverdue(task.dueDate, task.status),
    ).length;

    return {
      total,
      done,
      inProgress,
      overdue,
      completion: total ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const openCreateModal = (status = "todo") => {
    setEditingTask(null);
    setInitialStatus(status);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setInitialStatus(task.status);
    setModalOpen(true);
  };

  const saveTask = async (form) => {
    if (!projectId) throw new Error("Project ID is missing.");

    setSavingForm(true);

    try {
      if (editingTask) {
        const result = await apiRequest(`/api/v1/tasks/${editingTask._id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });

        setTasks((current) =>
          current.map((task) =>
            task._id === editingTask._id ? result.data.task : task,
          ),
        );
        showNotice("Task updated successfully.");
      } else {
        const result = await apiRequest("/api/v1/tasks", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            projectId,
          }),
        });

        setTasks((current) => [result.data.task, ...current]);
        showNotice("Task created successfully.");
      }
    } finally {
      setSavingForm(false);
    }
  };

  const updateTaskStatus = async (task, newStatus) => {
    if (task.status === newStatus || savingTaskId === task._id) return;

    const oldStatus = task.status;
    const snapshot = tasks;

    setTasks((current) =>
      current.map((item) =>
        item._id === task._id ? { ...item, status: newStatus } : item,
      ),
    );
    setSavingTaskId(task._id);
    setError("");

    try {
      const result = await apiRequest(`/api/v1/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? { ...item, ...result.data.task } : item,
        ),
      );
      showNotice(
        `Task moved to ${COLUMNS.find((c) => c.id === newStatus)?.title}.`,
      );
    } catch (updateError) {
      setTasks(
        snapshot.map((item) =>
          item._id === task._id ? { ...item, status: oldStatus } : item,
        ),
      );
      setError(updateError.message || "Could not update task status.");
    } finally {
      setSavingTaskId("");
    }
  };

  const handleDragStart = (event, task) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task._id);
    setDraggedTaskId(task._id);
  };

  const handleDragOver = (event, status) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDrop(status);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setActiveDrop("");
    }
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;

    setActiveDrop("");
    setDraggedTaskId(null);

    const task = tasks.find((item) => item._id === taskId);
    if (task) await updateTaskStatus(task, status);
  };

  const activeFilters =
    Number(priorityFilter !== "all") + Number(assigneeFilter !== "all");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FiUsers className="mx-auto text-indigo-600" size={28} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Sign in to view your board
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your project and team tasks.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <FiLoader className="animate-spin text-indigo-600" size={30} />
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <FiAlertCircle size={25} />
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Unable to open this board
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
        <button
          type="button"
          onClick={loadBoard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <FiRefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  const projectTitle = project?.title || project?.name || "Untitled project";

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800">
      <div className="mx-auto max-w-[1800px]">
        {/* Top workspace bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500 sm:gap-3">
              <Link
                to="/projects"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 font-medium transition hover:bg-slate-100 hover:text-indigo-600"
              >
                <FiArrowLeft size={15} />
                <span className="hidden sm:inline">Projects</span>
              </Link>
              <FiChevronRight className="shrink-0 text-slate-300" />
              <span className="max-w-[180px] truncate font-semibold text-slate-700 sm:max-w-xs">
                {projectTitle}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Workspace active
              </span>

              <button
                type="button"
                title="Notifications"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <FiBell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              <div className="hidden h-7 w-px bg-slate-200 sm:block" />

              <Avatar
                name={user.displayName || user.email}
                photoURL={user.photoURL}
                size="h-8 w-8"
              />
              <div className="hidden max-w-36 sm:block">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {user.displayName || "Workspace member"}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          {/* Project title and actions */}
          <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/70 sm:h-14 sm:w-14">
                <FiTarget size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {projectTitle}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      project?.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : project?.status === "on-hold"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {project?.status === "on-hold"
                      ? "On hold"
                      : project?.status === "completed"
                        ? "Completed"
                        : "Active"}
                  </span>
                </div>

                <p className="mt-1.5 max-w-2xl break-words text-sm leading-6 text-slate-500">
                  {project?.description ||
                    "Plan, organize, and track your project in one place."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar size={13} />
                    Created {formatDate(project?.createdAt)}
                  </span>
                  <span className="hidden h-3 w-px bg-slate-200 sm:inline-block" />
                  <span className="inline-flex items-center gap-1.5">
                    <FiRefreshCw size={12} />
                    Updated {formatDate(project?.updatedAt)}
                  </span>
                  <span className="hidden h-3 w-px bg-slate-200 sm:inline-block" />
                  <span className="inline-flex items-center gap-1.5">
                    <FiUsers size={13} />
                    {project?.role
                      ? `${project.role.charAt(0).toUpperCase()}${project.role.slice(1)} access`
                      : "Project workspace"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  showNotice(
                    "Share links can be connected to your project settings.",
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FiShare2 size={15} />
                <span>Share</span>
              </button>

              <Link
                to={`/projects/${projectId}/members`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
              >
                <FiUsers size={15} />
                <span>Members</span>
              </Link>

              <button
                type="button"
                onClick={() => openCreateModal("todo")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                <FiPlus size={16} />
                New task
              </button>
            </div>
          </section>

          {/* Summary metrics */}
          <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  Total tasks
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FiLayers size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.total}
                </span>
                <span className="text-[10px] text-slate-400">in project</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  In progress
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiActivity size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.inProgress}
                </span>
                <span className="text-[10px] text-slate-400">
                  being worked on
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  Completed
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FiCheckCircle size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.done}
                </span>
                <span className="text-[10px] text-slate-400">
                  {stats.completion}% complete
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${stats.completion}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  Overdue tasks
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <FiAlertCircle size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.overdue}
                </span>
                <span className="text-[10px] text-slate-400">
                  need attention
                </span>
              </div>
            </div>
          </section>

          {/* Board navigation */}
          <section className="mt-7 border-b border-slate-200">
            <div className="flex items-center gap-5 overflow-x-auto">
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-indigo-600 px-1 pb-3 text-xs font-semibold text-indigo-700"
              >
                <FiGrid size={15} />
                Board
              </button>

              <button
                type="button"
                onClick={() =>
                  showNotice("List view can be added as a separate view.")
                }
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-xs font-medium text-slate-500 transition hover:text-slate-800"
              >
                <FiList size={15} />
                List
              </button>

              <button
                type="button"
                onClick={() =>
                  showNotice("Calendar view can be added as a separate view.")
                }
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-xs font-medium text-slate-500 transition hover:text-slate-800"
              >
                <FiCalendar size={15} />
                Calendar
              </button>

              <Link
                to={`/projects/${projectId}/members`}
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-xs font-medium text-slate-500 transition hover:text-slate-800"
              >
                <FiUsers size={15} />
                Members
              </Link>

              <Link
                to={`/projects/${projectId}/settings`}
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-xs font-medium text-slate-500 transition hover:text-slate-800"
              >
                <FiSettings size={15} />
                Settings
              </Link>
            </div>
          </section>

          {/* Board toolbar */}
          <section className="relative z-20 mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, descriptions, labels..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen((value) => !value);
                    setSortOpen(false);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    activeFilters
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FiFilter size={14} />
                  Filter
                  {activeFilters > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] text-white">
                      {activeFilters}
                    </span>
                  )}
                  <FiChevronDown size={13} />
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">
                        Filters
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPriorityFilter("all");
                          setAssigneeFilter("all");
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Reset
                      </button>
                    </div>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                      Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(event.target.value)
                      }
                      className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-300"
                    >
                      <option value="all">All priorities</option>
                      {PRIORITIES.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                      Assignment
                    </label>
                    <select
                      value={assigneeFilter}
                      onChange={(event) =>
                        setAssigneeFilter(event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-300"
                    >
                      <option value="all">All tasks</option>
                      <option value="unassigned">Unassigned</option>
                      {[
                        ...new Map(
                          tasks
                            .filter((task) => task.assigneeId)
                            .map((task) => [
                              task.assigneeId,
                              task.assignee?.name || task.assigneeId,
                            ]),
                        ),
                      ].map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSortOpen((value) => !value);
                    setFilterOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <FiSliders size={14} />
                  Sort
                  <FiChevronDown size={13} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[
                      ["createdAt", "Recently created"],
                      ["dueDate", "Due date"],
                      ["priority", "Priority"],
                      ["title", "Task title"],
                    ].map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => {
                          setSortBy(value);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition hover:bg-slate-50 ${
                          sortBy === value
                            ? "font-semibold text-indigo-700"
                            : "text-slate-600"
                        }`}
                      >
                        {label}
                        {sortBy === value && <FiCheck size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={loadBoard}
                title="Refresh board"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
              >
                <FiRefreshCw size={15} />
              </button>

              <button
                type="button"
                onClick={() => openCreateModal("todo")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200/60 transition hover:bg-indigo-700 sm:flex-none"
              >
                <FiPlus size={15} />
                Add task
              </button>
            </div>
          </section>

          {/* Feedback messages */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 rounded p-0.5 hover:bg-rose-100"
              >
                <FiX size={14} />
              </button>
            </div>
          )}

          {notice && (
            <div className="fixed bottom-5 right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-xs font-semibold text-emerald-700 shadow-xl shadow-slate-900/10 sm:right-6">
              <FiCheckCircle size={16} />
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                className="ml-2 text-slate-400 hover:text-slate-700"
              >
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* Kanban board */}
          <section className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredTasks.length}
                </span>{" "}
                of {tasks.length} tasks
              </p>

              <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                <FiCommand size={12} />
                Drag cards between columns to update status
              </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasksByStatus[column.id] || []}
                  isDragging={Boolean(draggedTaskId)}
                  activeDrop={activeDrop === column.id}
                  onDrop={handleDrop}
                  onDragOver={(event) => handleDragOver(event, column.id)}
                  onDragLeave={handleDragLeave}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setActiveDrop("");
                  }}
                  onAddTask={openCreateModal}
                  onEditTask={openEditModal}
                />
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
                {tasks.length
                  ? "No tasks match your current search or filters."
                  : "This project has no tasks yet. Create your first task to get started."}
                {tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPriorityFilter("all");
                      setAssigneeFilter("all");
                    }}
                    className="ml-2 font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Footer note */}
          <footer className="mt-7 flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>TaskFlow · Project workspace</p>
            <p className="inline-flex items-center gap-1.5">
              <FiCheckCircle size={12} className="text-emerald-500" />
              Changes are saved to your project when the API confirms them.
            </p>
          </footer>
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          if (!savingForm) setModalOpen(false);
        }}
        onSave={saveTask}
        initialTask={editingTask}
        initialStatus={initialStatus}
        saving={savingForm}
      />
    </div>
  );
};

export default ProjectBoard;
