import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFolder,
  FiLayers,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTarget,
  FiX,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "on-hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getStatusLabel = (status = "") =>
  status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getErrorMessage = (error, fallback) =>
  error instanceof Error ? error.message : fallback;

const Projects = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [taskStats, setTaskStats] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "active",
  });

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      if (!user) {
        throw new Error("Please sign in to access your projects.");
      }

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `Request failed with status ${response.status}`,
        );
      }

      return result;
    },
    [user],
  );

  const fetchProjects = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) {
        setProjects([]);
        setTaskStats({});
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (statusFilter) {
          params.set("status", statusFilter);
        }

        const result = await apiRequest(
          `/api/v1/projects?${params.toString()}`,
        );

        const payload = result.data ?? result;

        const projectList = Array.isArray(payload.projects)
          ? payload.projects
          : Array.isArray(result.projects)
            ? result.projects
            : [];

        const pageInfo = payload.pagination ?? result.pagination ?? {};
        const total =
          pageInfo.total ?? pageInfo.totalItems ?? projectList.length;

        setProjects(projectList);

        setPagination({
          total,
          page: pageInfo.page ?? page,
          limit: pageInfo.limit ?? PAGE_SIZE,
          totalPages:
            pageInfo.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load projects."));
        setProjects([]);
        setTaskStats({});
        setPagination({
          total: 0,
          page: 1,
          limit: PAGE_SIZE,
          totalPages: 1,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiRequest, page, search, statusFilter, user],
  );

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchProjects();
      },
      search ? 300 : 0,
    );

    return () => clearTimeout(timeoutId);
  }, [fetchProjects, search]);

  useEffect(() => {
    let cancelled = false;

    const fetchTaskStats = async () => {
      if (!user || projects.length === 0) {
        setTaskStats({});
        setTaskStatsLoading(false);
        return;
      }

      setTaskStatsLoading(true);

      try {
        const entries = await Promise.all(
          projects.map(async (project) => {
            try {
              const params = new URLSearchParams({
                projectId: project._id,
                page: "1",
                limit: "100",
              });

              const result = await apiRequest(
                `/api/v1/tasks?${params.toString()}`,
              );

              const payload = result.data ?? result;

              const tasks = Array.isArray(payload.tasks)
                ? payload.tasks
                : Array.isArray(result.tasks)
                  ? result.tasks
                  : Array.isArray(payload)
                    ? payload
                    : [];

              const pageInfo = payload.pagination ?? result.pagination ?? {};
              const total =
                pageInfo.total ?? pageInfo.totalItems ?? tasks.length;

              const completed = tasks.filter(
                (task) => task.status === "done",
              ).length;

              return [
                project._id,
                {
                  total,
                  completed,
                  progress:
                    total > 0 ? Math.round((completed / total) * 100) : 0,
                  error: false,
                },
              ];
            } catch (err) {
              console.error(
                `Could not load tasks for project ${project._id}:`,
                err,
              );

              return [
                project._id,
                {
                  total: 0,
                  completed: 0,
                  progress: 0,
                  error: true,
                },
              ];
            }
          }),
        );

        if (!cancelled) {
          setTaskStats(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setTaskStatsLoading(false);
        }
      }
    };

    fetchTaskStats();

    return () => {
      cancelled = true;
    };
  }, [projects, user, apiRequest]);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    setCreateError("");
    setSuccessMessage("");

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setCreateError("Please enter a project title.");
      return;
    }

    if (title.length > 120) {
      setCreateError("Project title must be 120 characters or fewer.");
      return;
    }

    if (description.length > 2000) {
      setCreateError("Description must be 2000 characters or fewer.");
      return;
    }

    setCreating(true);

    try {
      await apiRequest("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          status: form.status,
        }),
      });

      setShowCreateModal(false);
      setForm({
        title: "",
        description: "",
        status: "active",
      });

      setSuccessMessage("Project created successfully.");

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchProjects({ silent: true });
      }
    } catch (err) {
      setCreateError(getErrorMessage(err, "Could not create the project."));
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    setCreateError("");
  };

  const totalProjects = pagination.total;

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "completed",
  ).length;

  const totalTasks = projects.reduce(
    (sum, project) => sum + (taskStats[project._id]?.total ?? 0),
    0,
  );

  const completedTasks = projects.reduce(
    (sum, project) => sum + (taskStats[project._id]?.completed ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <FiLayers className="h-4 w-4" />
              Workspace
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your projects, monitor task progress, and keep your work
              moving forward.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchProjects({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setCreateError("");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <FiPlus className="h-4 w-4" />
              New project
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <FiCheckCircle className="h-5 w-5 shrink-0" />
              {successMessage}
            </span>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss message"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total projects"
            value={loading ? "—" : totalProjects}
            subtitle="Projects matching your filters"
            icon={<FiFolder />}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Active projects"
            value={loading ? "—" : activeProjects}
            subtitle="Active projects on this page"
            icon={<FiTarget />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Completed projects"
            value={loading ? "—" : completedProjects}
            subtitle="Completed projects on this page"
            icon={<FiCheckCircle />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Completed tasks"
            value={
              taskStatsLoading
                ? "Loading..."
                : `${completedTasks}/${totalTasks}`
            }
            subtitle="Tasks on the current page"
            icon={<FiLayers />}
            iconClass="bg-violet-50 text-violet-600"
          />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">All projects</h2>
              <p className="mt-1 text-sm text-slate-500">
                Find and manage your projects.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search projects..."
                  aria-label="Search projects"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by project status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-5 h-10 w-10 rounded-xl bg-slate-100" />
                <div className="mb-3 h-5 w-3/4 rounded bg-slate-100" />
                <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                <div className="mb-6 h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-16 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center">
            <FiAlertCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />

            <h3 className="text-lg font-semibold text-slate-900">
              Could not load projects
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchProjects()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FiRefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const stats = taskStats[project._id] ?? {
                  total: 0,
                  completed: 0,
                  progress: 0,
                  error: false,
                };

                const statusStyle =
                  STATUS_STYLES[project.status] ??
                  "bg-slate-100 text-slate-700 ring-slate-500/20";

                return (
                  <article
                    key={project._id}
                    className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FiFolder className="h-5 w-5" />
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    <h3 className="break-words text-lg font-bold text-slate-900 transition group-hover:text-indigo-700">
                      {project.title || "Untitled project"}
                    </h3>

                    <p className="mt-2 min-h-12 whitespace-pre-line break-words text-sm leading-6 text-slate-500">
                      {project.description ||
                        "No description has been added yet."}
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FiLayers className="h-4 w-4 text-indigo-500" />
                          Task progress
                        </div>

                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {stats.error
                            ? "Unavailable"
                            : taskStatsLoading && !taskStats[project._id]
                              ? "Loading..."
                              : `${stats.progress}%`}
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-label={`Task completion for ${project.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats.error ? 0 : stats.progress}
                        className="h-2 overflow-hidden rounded-full bg-slate-200"
                      >
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{
                            width: `${stats.error ? 0 : stats.progress}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                        {stats.error ? (
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <FiAlertCircle className="h-3.5 w-3.5" />
                            Unable to load tasks
                          </span>
                        ) : (
                          <span>
                            {stats.completed} of {stats.total} tasks completed
                          </span>
                        )}

                        {stats.total > 0 && (
                          <span className="shrink-0 font-medium text-slate-600">
                            {stats.total - stats.completed} left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5" />
                        Created {formatDate(project.createdAt)}
                      </span>

                      {project.updatedAt && (
                        <span className="flex items-center gap-1.5">
                          <FiClock className="h-3.5 w-3.5" />
                          Updated {formatDate(project.updatedAt)}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      <Link
                        to={`/projects/${project._id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        View project
                        <FiArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(page * PAGE_SIZE, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {pagination.total}
                </span>{" "}
                projects
              </p>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="whitespace-nowrap text-sm text-slate-500">
                  Page {page} of {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages || 1, current + 1),
                    )
                  }
                  disabled={page >= (pagination.totalPages || 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {search || statusFilter ? (
                <FiSearch className="h-6 w-6" />
              ) : (
                <FiFolder className="h-6 w-6" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {search || statusFilter
                ? "No matching projects"
                : "Create your first project"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || statusFilter
                ? "Try a different search term or change the status filter."
                : "Start organizing your work by creating a project. You can track its tasks and progress here."}
            </p>

            {search || statusFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FiPlus className="h-4 w-4" />
                Create project
              </button>
            )}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="create-project-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Create a project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Give your project a name and a clear purpose.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="space-y-5 px-6 py-6"
            >
              {createError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="project-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Project name <span className="text-red-500">*</span>
                </label>

                <input
                  id="project-title"
                  type="text"
                  required
                  maxLength={120}
                  autoFocus
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Website redesign"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/2000
                </p>
              </div>

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Initial status
                </label>

                <select
                  id="project-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-4 w-4" />
                      Create project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, subtitle, icon, iconClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconClass}`}
      >
        {icon}
      </div>
    </div>

    <p className="mt-3 text-xs leading-5 text-slate-500">{subtitle}</p>
  </div>
);

export default Projects;
