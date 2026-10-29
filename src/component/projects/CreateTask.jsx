import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiCircle,
  FiClock,
  FiFileText,
  FiFlag,
  FiFolder,
  FiHash,
  FiLayers,
  FiLoader,
  FiPlus,
  FiSave,
  FiShield,
  FiTag,
  FiTrash2,
  FiUser,
  FiZap,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PROJECTS_API = `${API_BASE_URL}/api/v1/projects`;
const TASKS_API = `${API_BASE_URL}/api/v1/tasks`;

const TASK_STATUSES = [
  {
    value: "todo",
    label: "To do",
    description: "Ready to be started",
    icon: FiCircle,
    color: "text-slate-600",
    dot: "bg-slate-400",
  },
  {
    value: "in-progress",
    label: "In progress",
    description: "Work is underway",
    icon: FiZap,
    color: "text-blue-700",
    dot: "bg-blue-500",
  },
  {
    value: "review",
    label: "In review",
    description: "Waiting for review",
    icon: FiShield,
    color: "text-violet-700",
    dot: "bg-violet-500",
  },
  {
    value: "done",
    label: "Done",
    description: "Work is completed",
    icon: FiCheckCircle,
    color: "text-emerald-700",
    dot: "bg-emerald-500",
  },
];

const TASK_PRIORITIES = [
  {
    value: "low",
    label: "Low",
    description: "Can wait",
    color: "border-slate-200 bg-slate-50 text-slate-700",
    activeColor: "border-slate-400 bg-slate-100 ring-2 ring-slate-200",
    iconColor: "text-slate-500",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Normal priority",
    color: "border-blue-200 bg-blue-50 text-blue-800",
    activeColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
    iconColor: "text-blue-600",
  },
  {
    value: "high",
    label: "High",
    description: "Needs attention",
    color: "border-amber-200 bg-amber-50 text-amber-800",
    activeColor: "border-amber-500 bg-amber-50 ring-2 ring-amber-100",
    iconColor: "text-amber-600",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Act immediately",
    color: "border-rose-200 bg-rose-50 text-rose-800",
    activeColor: "border-rose-500 bg-rose-50 ring-2 ring-rose-100",
    iconColor: "text-rose-600",
  },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assigneeId: "",
  labels: [],
};

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U"
  );
}

function formatDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    const message =
      result.message ||
      (response.status === 401
        ? "Your session may have expired. Please sign in again."
        : response.status === 403
          ? "You do not have permission to perform this action."
          : response.status === 404
            ? "The requested project could not be found."
            : "Something went wrong. Please try again.");

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return result;
}

function FormLabel({ children, required = false, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-slate-800"
    >
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600">
      <FiAlertCircle className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function CreateTask() {
  const { id, projectId: routeProjectId } = useParams();
  const projectId = id || routeProjectId;

  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [pageError, setPageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [labelInput, setLabelInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentUserName =
    user?.displayName || user?.email?.split("@")[0] || "You";

  const currentUserInitials = useMemo(
    () => getInitials(currentUserName),
    [currentUserName],
  );

  const selectedStatus = TASK_STATUSES.find(
    (status) => status.value === form.status,
  );

  const selectedPriority = TASK_PRIORITIES.find(
    (priority) => priority.value === form.priority,
  );

  const requestHeaders = useCallback(
    async (includeJson = false) => {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      const token = await user.getIdToken();

      return {
        Authorization: `Bearer ${token}`,
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
      };
    },
    [user],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!projectId) {
        setProjectLoading(false);
        setProjectError("A project ID is missing from the page URL.");
        return;
      }

      if (!user) {
        setProjectLoading(false);
        return;
      }

      setProjectLoading(true);
      setProjectError("");

      try {
        const headers = await requestHeaders();

        const response = await fetch(
          `${PROJECTS_API}/${encodeURIComponent(projectId)}`,
          { headers },
        );

        const result = await readResponse(response);
        const loadedProject = result?.data?.project;

        if (!loadedProject) {
          throw new Error("Project information could not be loaded.");
        }

        if (!cancelled) {
          setProject(loadedProject);
        }
      } catch (error) {
        if (!cancelled) {
          setProjectError(
            error.message || "Unable to load project information.",
          );
        }
      } finally {
        if (!cancelled) {
          setProjectLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId, user, requestHeaders]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setPageError("");
  };

  const addLabel = () => {
    const label = labelInput.trim();

    if (!label) return;

    if (label.length > 30) {
      setFieldErrors((previous) => ({
        ...previous,
        labels: "Each label must be 30 characters or fewer.",
      }));
      return;
    }

    if (form.labels.length >= 10) {
      setFieldErrors((previous) => ({
        ...previous,
        labels: "You can add up to 10 labels.",
      }));
      return;
    }

    if (
      form.labels.some(
        (existing) => existing.toLowerCase() === label.toLowerCase(),
      )
    ) {
      setFieldErrors((previous) => ({
        ...previous,
        labels: "This label has already been added.",
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      labels: [...previous.labels, label],
    }));

    setLabelInput("");
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next.labels;
      return next;
    });
  };

  const removeLabel = (labelToRemove) => {
    setForm((previous) => ({
      ...previous,
      labels: previous.labels.filter((label) => label !== labelToRemove),
    }));

    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next.labels;
      return next;
    });
  };

  const validateForm = () => {
    const errors = {};

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      errors.title = "A task title is required.";
    } else if (title.length > 160) {
      errors.title = "The title must be 160 characters or fewer.";
    }

    if (description.length > 5000) {
      errors.description = "The description must be 5,000 characters or fewer.";
    }

    if (!TASK_STATUSES.some((item) => item.value === form.status)) {
      errors.status = "Select a valid task status.";
    }

    if (!TASK_PRIORITIES.some((item) => item.value === form.priority)) {
      errors.priority = "Select a valid task priority.";
    }

    if (form.dueDate) {
      const date = new Date(`${form.dueDate}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== form.dueDate
      ) {
        errors.dueDate = "Choose a valid due date.";
      }
    }

    if (form.labels.length > 10) {
      errors.labels = "You can add up to 10 labels.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPageError("");

    if (!user) {
      setPageError("Please sign in before creating a task.");
      return;
    }

    if (!projectId) {
      setPageError("A valid project ID is required.");
      return;
    }

    if (!validateForm()) {
      setPageError("Please review the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const headers = await requestHeaders(true);

      const payload = {
        projectId,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
        labels: form.labels,
      };

      const response = await fetch(TASKS_API, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      await readResponse(response);

      navigate(`/projects/${projectId}`, {
        replace: true,
        state: {
          taskCreated: true,
          message: "Task created successfully.",
        },
      });
    } catch (error) {
      setPageError(
        error.message || "Unable to create this task. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-3xl text-indigo-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading project workspace...
          </p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <FiAlertCircle size={24} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to open this project
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {projectError ||
              "Project information is unavailable. Check your access and try again."}
          </p>

          <Link
            to="/projects"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <FiArrowLeft />
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const projectName = project.title || project.name || "Untitled project";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link to="/projects" className="transition hover:text-indigo-600">
            Projects
          </Link>
          <span>/</span>
          <Link
            to={`/projects/${projectId}`}
            className="max-w-[180px] truncate transition hover:text-indigo-600"
          >
            {projectName}
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Create task</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="min-w-0">
            <Link
              to={`/projects/${projectId}`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              <FiArrowLeft />
              Back to project
            </Link>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <FiPlus size={24} />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Create a new task
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Define the work, set priorities, and keep your project moving
                  forward.
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-fit max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiFolder size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Creating task in
              </p>
              <p className="max-w-[220px] truncate text-sm font-bold text-slate-900">
                {projectName}
              </p>
            </div>
          </div>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
            <div className="min-w-0 flex-1">{pageError}</div>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setPageError("")}
              className="rounded-md p-1 text-rose-600 transition hover:bg-rose-100"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Main form */}
            <div className="space-y-6 lg:col-span-8">
              {/* Task details */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <SectionHeader
                  icon={FiFileText}
                  title="Task details"
                  description="Start with a clear title and explain what needs to be done."
                />

                <div className="space-y-5">
                  <div>
                    <FormLabel htmlFor="task-title" required>
                      Task title
                    </FormLabel>
                    <input
                      id="task-title"
                      name="title"
                      type="text"
                      autoFocus
                      maxLength={160}
                      required
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      placeholder="e.g. Build responsive dashboard layout"
                      aria-invalid={Boolean(fieldErrors.title)}
                      aria-describedby={
                        fieldErrors.title ? "task-title-error" : undefined
                      }
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        fieldErrors.title
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                      }`}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <FieldError>{fieldErrors.title}</FieldError>
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {form.title.length}/160
                      </span>
                    </div>
                    {fieldErrors.title && (
                      <span id="task-title-error" className="sr-only">
                        {fieldErrors.title}
                      </span>
                    )}
                  </div>

                  <div>
                    <FormLabel htmlFor="task-description">
                      Description
                    </FormLabel>
                    <textarea
                      id="task-description"
                      name="description"
                      rows={6}
                      maxLength={5000}
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Describe the task, expected outcome, requirements, and any important implementation notes..."
                      aria-invalid={Boolean(fieldErrors.description)}
                      className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        fieldErrors.description
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                      }`}
                    />
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <FieldError>{fieldErrors.description}</FieldError>
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {form.description.length}/5000
                      </span>
                    </div>
                  </div>

                  <div>
                    <FormLabel htmlFor="task-labels">Labels</FormLabel>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <FiTag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="task-labels"
                          type="text"
                          maxLength={30}
                          value={labelInput}
                          onChange={(event) => {
                            setLabelInput(event.target.value);
                            setFieldErrors((previous) => {
                              const next = { ...previous };
                              delete next.labels;
                              return next;
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addLabel();
                            }
                          }}
                          placeholder="e.g. frontend, bug, design"
                          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={addLabel}
                        disabled={!labelInput.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiPlus size={16} />
                        Add label
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Add up to 10 labels to help your team find and organize
                      tasks.
                    </p>
                    <FieldError>{fieldErrors.labels}</FieldError>

                    {form.labels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form.labels.map((label) => (
                          <span
                            key={label}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 py-1.5 pl-2.5 pr-1.5 text-xs font-semibold text-indigo-700"
                          >
                            <FiHash size={12} />
                            <span className="break-all">{label}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${label} label`}
                              onClick={() => removeLabel(label)}
                              className="ml-0.5 rounded-md p-1 transition hover:bg-indigo-100"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Workflow */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <SectionHeader
                  icon={FiLayers}
                  title="Workflow & priority"
                  description="Choose the current stage and how urgently the team should handle this task."
                />

                <div className="space-y-6">
                  <div>
                    <FormLabel>Status</FormLabel>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {TASK_STATUSES.map((status) => {
                        const StatusIcon = status.icon;
                        const active = form.status === status.value;

                        return (
                          <button
                            key={status.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => updateField("status", status.value)}
                            className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition ${
                              active
                                ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-100"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ${status.color}`}
                            >
                              <StatusIcon size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900">
                                {status.label}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {status.description}
                              </p>
                            </div>

                            <span
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                active
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <FiCheck size={12} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError>{fieldErrors.status}</FieldError>
                  </div>

                  <div>
                    <FormLabel>Priority</FormLabel>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {TASK_PRIORITIES.map((priority) => {
                        const active = form.priority === priority.value;

                        return (
                          <button
                            key={priority.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              updateField("priority", priority.value)
                            }
                            className={`min-w-0 rounded-xl border p-3 text-left transition sm:p-4 ${
                              active
                                ? priority.activeColor
                                : `${priority.color} hover:brightness-[0.98]`
                            }`}
                          >
                            <FiFlag size={18} className={priority.iconColor} />
                            <p className="mt-3 text-sm font-bold">
                              {priority.label}
                            </p>
                            <p className="mt-1 text-xs leading-4 opacity-80">
                              {priority.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError>{fieldErrors.priority}</FieldError>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:col-span-4">
              {/* Scheduling */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={FiCalendar}
                  title="Scheduling"
                  description="Set a target date for completion."
                />

                <div>
                  <FormLabel htmlFor="task-due-date">Due date</FormLabel>
                  <div className="relative">
                    <FiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="task-due-date"
                      name="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={(event) =>
                        updateField("dueDate", event.target.value)
                      }
                      className={`w-full min-w-0 rounded-xl border bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:ring-4 ${
                        fieldErrors.dueDate
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                      }`}
                    />
                  </div>
                  <FieldError>{fieldErrors.dueDate}</FieldError>

                  {form.dueDate && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <FiClock className="mt-0.5 shrink-0" />
                      <span>
                        Target completion:{" "}
                        <strong>
                          {formatDate(new Date(`${form.dueDate}T00:00:00`))}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Assignment */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={FiUser}
                  title="Assignment"
                  description="Choose who will be responsible for this task."
                />

                <FormLabel htmlFor="task-assignee">Assignee</FormLabel>

                <div className="relative">
                  <select
                    id="task-assignee"
                    value={form.assigneeId}
                    onChange={(event) =>
                      updateField("assigneeId", event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Unassigned</option>
                    {user?.uid && (
                      <option value={user.uid}>Assign to me</option>
                    )}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {form.assigneeId === user?.uid && user?.uid && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                      {currentUserInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {currentUserName}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-700">
                        Assigned to you
                      </p>
                    </div>
                    <FiCheckCircle className="ml-auto shrink-0 text-emerald-600" />
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Your current API supports assigning tasks to the project owner
                  only. Team-member assignment can be enabled after implementing
                  project membership.
                </p>
              </section>

              {/* Summary */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="text-sm font-bold text-slate-900">
                    Task summary
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Review before creating
                  </p>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-slate-500">Project</span>
                    <span className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-800">
                      {projectName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <span
                        className={`h-2 w-2 rounded-full ${selectedStatus?.dot}`}
                      />
                      {selectedStatus?.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Priority</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <FiFlag className={selectedPriority?.iconColor} />
                      {selectedPriority?.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-slate-500">Due date</span>
                    <span className="text-right text-sm font-medium text-slate-800">
                      {form.dueDate
                        ? formatDate(new Date(`${form.dueDate}T00:00:00`))
                        : "Not set"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-slate-500">Labels</span>
                    <span className="text-sm font-medium text-slate-800">
                      {form.labels.length}
                    </span>
                  </div>
                </div>
              </section>

              {/* Helpful note */}
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
                  <FiZap size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-950">
                    Keep tasks actionable
                  </p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800/80">
                    A specific title, clear acceptance criteria, and a realistic
                    due date help your team deliver consistently.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Form actions */}
          <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:px-6">
            <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs text-slate-500 md:block">
                <span className="text-rose-500">*</span> Required field
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Link
                  to={`/projects/${projectId}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiArrowLeft size={16} />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" size={17} />
                      Creating task...
                    </>
                  ) : (
                    <>
                      <FiSave size={17} />
                      Create task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTask;
