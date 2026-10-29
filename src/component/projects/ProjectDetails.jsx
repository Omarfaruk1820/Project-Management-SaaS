import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiLayers,
  FiList,
  FiRefreshCw,
  FiTarget,
  FiUsers,
  FiPlus,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PROJECTS_API = `${API_BASE_URL}/api/v1/projects`;
const TASKS_API = `${API_BASE_URL}/api/v1/tasks`;

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "on-hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const STATUS_LABELS = {
  active: "Active",
  "on-hold": "On hold",
  completed: "Completed",
};

const TASK_STATUSES = [
  { value: "todo", label: "To do", color: "bg-slate-400" },
  { value: "in-progress", label: "In progress", color: "bg-blue-500" },
  { value: "review", label: "In review", color: "bg-amber-500" },
  { value: "done", label: "Completed", color: "bg-emerald-500" },
];

const PROJECT_THEMES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getProjectTheme(name = "") {
  const index = [...name].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return PROJECT_THEMES[index % PROJECT_THEMES.length];
}

async function projectRequest(user, url, options = {}) {
  if (!user) {
    throw new Error("Please sign in to continue.");
  }

  const token = await user.getIdToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      throw new Error("Your session may have expired. Please sign in again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to access this project.");
    }

    if (response.status === 404) {
      throw new Error("Project not found, or this resource is unavailable.");
    }

    throw new Error(
      result.message ||
        result.error ||
        `Request failed with status ${response.status}.`,
    );
  }

  return result;
}

function extractProject(result) {
  const candidates = [
    result?.data?.project,
    result?.project,
    result?.data,
    result,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (candidate._id || candidate.id),
    ) || null
  );
}

function extractTasks(result) {
  const candidates = [
    result?.data?.tasks,
    result?.tasks,
    result?.data?.data?.tasks,
    result?.data?.results,
    result?.results,
    result?.data,
    result,
  ];

  return candidates.find(Array.isArray) || null;
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-500/10"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] || "Unknown status"}
    </span>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200" />

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-16 w-16 rounded-2xl bg-slate-200" />
            <div className="flex-1">
              <div className="h-7 w-2/3 max-w-sm rounded bg-slate-200" />
              <div className="mt-4 h-4 max-w-lg rounded bg-slate-100" />
              <div className="mt-3 h-4 max-w-md rounded bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-white lg:col-span-2" />
          <div className="h-80 rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <FiAlertCircle className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          Unable to load project
        </h2>

        <p className="mt-2 break-words text-sm leading-6 text-slate-500">
          {message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <FiRefreshCw />
            Try again
          </button>

          <Link
            to="/projects"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiArrowLeft />
            Back to projects
          </Link>
        </div>
      </div>
    </main>
  );
}

function InformationItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

const ProjectDetails = () => {
  const { id, projectId } = useParams();
  const { user } = useAuth();

  const currentProjectId = id || projectId;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProject = useCallback(
    async (signal) => {
      if (!user) {
        setProject(null);
        setTasks([]);
        setError("Please sign in to view this project.");
        setLoading(false);
        return;
      }

      if (!currentProjectId) {
        setProject(null);
        setError("A project ID was not provided in the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setTaskLoading(false);
      setError("");
      setTaskError("");
      setProject(null);
      setTasks([]);

      try {
        const projectResult = await projectRequest(
          user,
          `${PROJECTS_API}/${encodeURIComponent(currentProjectId)}`,
          { signal },
        );

        if (signal.aborted) return;

        const projectData = extractProject(projectResult);

        if (!projectData) {
          throw new Error(
            "The server response did not contain a valid project.",
          );
        }

        setProject(projectData);
        setLoading(false);
        setTaskLoading(true);

        try {
          const taskResult = await projectRequest(
            user,
            `${TASKS_API}?projectId=${encodeURIComponent(
              currentProjectId,
            )}&page=1&limit=100`,
            { signal },
          );

          if (signal.aborted) return;

          const taskData = extractTasks(taskResult);

          if (!taskData) {
            throw new Error("The task API response format is not recognized.");
          }

          setTasks(taskData);
        } catch (requestError) {
          if (requestError.name !== "AbortError" && !signal.aborted) {
            setTaskError(
              requestError.message || "Unable to load project tasks.",
            );
          }
        } finally {
          if (!signal.aborted) {
            setTaskLoading(false);
          }
        }
      } catch (requestError) {
        if (requestError.name !== "AbortError" && !signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load this project.",
          );
          setProject(null);
        }

        if (!signal.aborted) setLoading(false);
      }
    },
    [user, currentProjectId, refreshKey],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchProject(controller.signal);

    return () => controller.abort();
  }, [fetchProject]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !project) {
    return (
      <ErrorState
        message={error || "This project could not be found."}
        onRetry={() => setRefreshKey((current) => current + 1)}
      />
    );
  }

  // Support either "name" or "title" in existing project documents.
  const projectName = project.name || project.title || "Untitled project";
  const theme = getProjectTheme(projectName);
  const isCompleted = project.status === "completed";

  const completedTasks = tasks.filter((task) => task.status === "done").length;

  const totalTasks = tasks.length;

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const taskCounts = TASK_STATUSES.map((status) => ({
    ...status,
    count: tasks.filter((task) => task.status === status.value).length,
  }));

  const displayedStartDate = project.startDate || null;
  const displayedDueDate = project.dueDate || null;

  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <FiFolder />
            Projects
          </Link>

          <span className="text-slate-300">/</span>

          <span
            className="max-w-[240px] truncate font-semibold text-slate-800"
            aria-current="page"
          >
            {projectName}
          </span>
        </nav>

        {/* Project header */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-1.5"
            style={{
              backgroundColor: project.color || "#6366f1",
            }}
          />

          <div className="p-5 sm:p-7 lg:p-8">
            <Link
              to="/projects"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              <FiArrowLeft />
              All projects
            </Link>

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${theme}`}
                  style={
                    project.color
                      ? {
                          backgroundColor: `${project.color}20`,
                          color: project.color,
                        }
                      : undefined
                  }
                >
                  <FiLayers className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={project.status} />
                    <span className="text-xs text-slate-400">
                      Project workspace
                    </span>
                  </div>

                  <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                    {projectName}
                  </h1>

                  <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-500 sm:text-base">
                    {project.description?.trim() ||
                      "No description has been added to this project yet."}
                  </p>

                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 xl:grid-cols-3">
              <InformationItem
                icon={FiCalendar}
                label="Start date"
                value={formatDate(displayedStartDate)}
              />

              <InformationItem
                icon={FiClock}
                label="Target deadline"
                value={formatDate(displayedDueDate)}
              />

              <InformationItem
                icon={FiActivity}
                label="Last updated"
                value={formatDateTime(project.updatedAt)}
              />
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section
          aria-label="Project statistics"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            icon={FiList}
            label="Total tasks"
            value={taskLoading ? "—" : totalTasks}
            detail="Tasks returned by the project task API"
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            icon={FiCheckCircle}
            label="Completed"
            value={taskLoading ? "—" : completedTasks}
            detail="Tasks marked as done"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={FiActivity}
            label="In progress"
            value={
              taskLoading
                ? "—"
                : taskCounts.find((item) => item.value === "in-progress")
                    ?.count || 0
            }
            detail="Tasks currently being worked on"
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            icon={FiTarget}
            label="Completion"
            value={taskLoading ? "—" : `${progress}%`}
            detail={
              totalTasks
                ? `${completedTasks} of ${totalTasks} tasks completed`
                : "Create tasks to start tracking progress"
            }
            iconClass="bg-violet-50 text-violet-600"
          />
        </section>

        <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Task progress */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiActivity className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Task progress
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Track the work completed across this project.
                  </p>
                </div>

                <Link
                  to={`/projects/${encodeURIComponent(currentProjectId)}/tasks/create`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <FiPlus />
                  Create task
                </Link>
              </div>

              {taskLoading ? (
                <div className="mt-6 animate-pulse space-y-4">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 rounded-full bg-slate-100" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TASK_STATUSES.map((status) => (
                      <div
                        key={status.value}
                        className="h-20 rounded-xl bg-slate-100"
                      />
                    ))}
                  </div>
                </div>
              ) : taskError ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Could not load tasks
                  </p>
                  <p className="mt-1 break-words text-sm text-amber-700">
                    {taskError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 underline underline-offset-4"
                  >
                    <FiRefreshCw />
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-7">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Overall completion
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {progress}%
                      </span>
                    </div>

                    <div
                      className="h-3 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label="Project task completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {totalTasks === 0
                        ? "No tasks found for this project yet."
                        : `${completedTasks} completed out of ${totalTasks} tasks.`}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {taskCounts.map((status) => (
                      <div
                        key={status.value}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${status.color}`}
                          />
                          <span className="text-xs font-medium text-slate-500">
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-900">
                          {status.count}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {status.count === 1 ? "task" : "tasks"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {totalTasks === 0 && (
                    <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FiList className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-slate-800">
                        Start with your first task
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Break this project into small, actionable tasks.
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Recent tasks */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiLayers className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Project tasks
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick look at tasks in this project.
                  </p>
                </div>

                <Link
                  to={`/projects/${encodeURIComponent(currentProjectId)}/tasks`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  View all
                  <FiArrowRight />
                </Link>
              </div>

              {taskLoading ? (
                <div className="mt-5 animate-pulse space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : taskError ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Tasks could not be loaded. Use Refresh to try again.
                </p>
              ) : tasks.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <FiCheckCircle className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tasks yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your project tasks will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-slate-100">
                  {tasks.slice(0, 5).map((task) => {
                    const taskStatus = TASK_STATUSES.find(
                      (item) => item.value === task.status,
                    );

                    return (
                      <div
                        key={task._id || task.id || task.title}
                        className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              task.status === "done"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {task.status === "done" ? (
                              <FiCheckCircle />
                            ) : (
                              <FiList />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-slate-800">
                              {task.title || task.name || "Untitled task"}
                            </p>
                            <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
                              {task.description || "No description"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {taskStatus?.label || task.status || "Unknown"}
                          </span>

                          {task.priority && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                task.priority === "urgent"
                                  ? "bg-rose-50 text-rose-700"
                                  : task.priority === "high"
                                    ? "bg-orange-50 text-orange-700"
                                    : task.priority === "medium"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {task.priority}
                            </span>
                          )}

                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <FiCalendar />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Activity summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <FiActivity className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Project activity
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Dates available from the project record.
              </p>

              <div className="mt-6 flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <FiCheckCircle />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Project created
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    This project was added to your workspace.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDateTime(project.createdAt)}
                  </p>
                </div>
              </div>

              {project.updatedAt && (
                <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <FiRefreshCw />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Last project update
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest update timestamp recorded by the server.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(project.updatedAt)}
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                This is a summary of project timestamps, not a complete audit
                log. A real activity feed needs backend event records.
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <FiFolder className="h-5 w-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900">
                  Project information
                </h2>
              </div>

              <div className="mt-5 space-y-5">
                <InformationItem
                  icon={FiCheckCircle}
                  label="Current status"
                  value={STATUS_LABELS[project.status] || "Unknown"}
                />

                <InformationItem
                  icon={FiCalendar}
                  label="Start date"
                  value={formatDate(displayedStartDate)}
                />

                <InformationItem
                  icon={FiClock}
                  label="Target deadline"
                  value={formatDate(displayedDueDate)}
                />

                <InformationItem
                  icon={FiUsers}
                  label="Task count"
                  value={taskLoading ? "Loading..." : totalTasks}
                />
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Project ID
                </p>
                <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                  {project._id || project.id}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <FiUsers className="h-5 w-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900">Team members</h2>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <FiUsers className="h-5 w-5" />
                </div>

                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                  Team collaboration
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Team members and roles will appear here after project
                  membership is implemented in the backend.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
                <FiTarget className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-base font-bold">Keep work moving</h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Break your project into smaller tasks, assign ownership, and
                track progress as your workspace grows.
              </p>

              <Link
                to={`/projects/${encodeURIComponent(currentProjectId)}/tasks/create`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-white"
              >
                Create a task
                <FiArrowRight />
              </Link>
            </section>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>TaskFlow · Project workspace</span>
          <span>
            {isCompleted
              ? "This project is marked as completed."
              : "Keep your project organized and moving forward."}
          </span>
        </footer>
      </div>
    </main>
  );
};

export default ProjectDetails;
