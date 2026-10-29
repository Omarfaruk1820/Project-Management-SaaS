import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiCircle,
  FiClock,
  FiFolder,
  FiHash,
  FiInfo,
  FiLayers,
  FiPlus,
  FiSave,
  FiTag,
  FiTarget,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const initialForm = {
  name: "",
  description: "",
  status: "active",
  priority: "medium",
  startDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  color: "#6366f1",
  tags: [],
};

const projectColors = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Green", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Violet", value: "#8b5cf6" },
];

const statusOptions = [
  {
    value: "active",
    label: "Active",
    description: "Work is in progress",
    color: "bg-emerald-500",
  },
  {
    value: "on-hold",
    label: "On hold",
    description: "Temporarily paused",
    color: "bg-amber-500",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Work is finished",
    color: "bg-blue-500",
  },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-rose-600" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setApiError("");
    setSuccess(false);
  };

  const addTag = (event) => {
    if (event.key !== "Enter" && event.key !== ",") return;

    event.preventDefault();

    const tag = tagInput.trim().replace(/,$/, "").trim();

    if (!tag) return;

    if (tag.length > 24) {
      setErrors((previous) => ({
        ...previous,
        tags: "Each tag must be 24 characters or fewer.",
      }));
      return;
    }

    if (form.tags.length >= 8) {
      setErrors((previous) => ({
        ...previous,
        tags: "You can add up to 8 tags.",
      }));
      return;
    }

    if (
      form.tags.some(
        (existingTag) => existingTag.toLowerCase() === tag.toLowerCase(),
      )
    ) {
      setTagInput("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      tags: [...previous.tags, tag],
    }));

    setTagInput("");
    setErrors((previous) => ({ ...previous, tags: "" }));
  };

  const removeTag = (tagToRemove) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter a project name.";
    } else if (form.name.trim().length < 3) {
      nextErrors.name = "Project name must be at least 3 characters.";
    } else if (form.name.trim().length > 100) {
      nextErrors.name = "Project name cannot exceed 100 characters.";
    }

    if (form.description.length > 2000) {
      nextErrors.description = "Description cannot exceed 2,000 characters.";
    }

    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      nextErrors.dueDate = "Deadline must be on or after the start date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");
    setSuccess(false);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!user) {
      setApiError("Please sign in before creating a project.");
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        color: form.color,
        tags: form.tags,
      };

      const response = await fetch(`${API_URL}/api/v1/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to create the project. Please try again.",
        );
      }

      const project =
        result.data?.project || result.data || result.project || result;

      setSuccess(true);

      // Navigate to the new project if the API returns its ID.
      const projectId = project?._id || project?.id;

      window.setTimeout(() => {
        if (projectId) {
          navigate(`/projects/${projectId}`, { replace: true });
        } else {
          navigate("/projects", { replace: true });
        }
      }, 700);
    } catch (error) {
      setApiError(
        error.message || "Something went wrong. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    navigate("/projects");
  };

  const selectedStatus =
    statusOptions.find((option) => option.value === form.status) ||
    statusOptions[0];

  const selectedPriority =
    priorityOptions.find((option) => option.value === form.priority) ||
    priorityOptions[1];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link to="/projects" className="transition hover:text-indigo-600">
            Projects
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">Create project</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <FiZap />
              WORKSPACE SETUP
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Create a new project
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Bring your team together, organize your work, and turn your next
              big idea into reality.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FiArrowLeft />
            Back to projects
          </Link>
        </div>

        {/* Error banner */}
        {apiError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <FiInfo className="mt-0.5 shrink-0 text-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Project creation failed</p>
              <p className="mt-1 break-words">{apiError}</p>
            </div>
            <button
              type="button"
              onClick={() => setApiError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-rose-100"
            >
              <FiX />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            <FiCheckCircle className="shrink-0 text-lg" />
            Project created successfully. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Main form */}
            <div className="space-y-6 lg:col-span-8">
              {/* Basic information */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                    <FiLayers />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Project information
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Start with a clear name and purpose for your project.
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label htmlFor="project-name" className={labelClass}>
                      Project name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="project-name"
                      name="name"
                      type="text"
                      autoComplete="off"
                      maxLength={100}
                      placeholder="e.g. Website redesign, Mobile app launch"
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "project-name-error" : "project-name-help"
                      }
                      className={`${inputClass} ${
                        errors.name
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                          : ""
                      }`}
                    />
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <p
                        id={
                          errors.name
                            ? "project-name-error"
                            : "project-name-help"
                        }
                        className={`text-xs ${
                          errors.name ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {errors.name ||
                          "Choose a short, recognizable name for your team."}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {form.name.length}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="project-description" className={labelClass}>
                      Description{" "}
                      <span className="font-normal text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="project-description"
                      name="description"
                      rows={5}
                      maxLength={2000}
                      placeholder="What are you building? What does success look like? Add a little context for your team..."
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      className={`${inputClass} min-h-32 resize-y leading-6`}
                    />
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <p
                        className={`text-xs ${
                          errors.description
                            ? "text-rose-600"
                            : "text-slate-400"
                        }`}
                      >
                        {errors.description ||
                          "A good description helps everyone stay aligned."}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {form.description.length}/2000
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Project color</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {projectColors.map((color) => {
                        const isSelected = form.color === color.value;

                        return (
                          <button
                            key={color.value}
                            type="button"
                            title={color.name}
                            aria-label={`Choose ${color.name} project color`}
                            aria-pressed={isSelected}
                            onClick={() => updateField("color", color.value)}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                              isSelected
                                ? "ring-2 ring-offset-2"
                                : "hover:scale-110"
                            }`}
                            style={{
                              backgroundColor: color.value,
                              "--tw-ring-color": color.value,
                            }}
                          >
                            {isSelected && (
                              <FiCheck className="text-lg text-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Use a color to identify this project across your
                      workspace.
                    </p>
                  </div>
                </div>
              </section>

              {/* Schedule */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg text-sky-600">
                    <FiCalendar />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Timeline</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Give your project a start date and target deadline.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div>
                    <label htmlFor="start-date" className={labelClass}>
                      Start date
                    </label>
                    <input
                      id="start-date"
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      max={form.dueDate || undefined}
                      onChange={(event) =>
                        updateField("startDate", event.target.value)
                      }
                      className={inputClass}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      When should work begin?
                    </p>
                  </div>

                  <div>
                    <label htmlFor="due-date" className={labelClass}>
                      Target deadline
                    </label>
                    <input
                      id="due-date"
                      name="dueDate"
                      type="date"
                      min={form.startDate || undefined}
                      value={form.dueDate}
                      onChange={(event) =>
                        updateField("dueDate", event.target.value)
                      }
                      aria-invalid={Boolean(errors.dueDate)}
                      className={`${inputClass} ${
                        errors.dueDate
                          ? "border-rose-400 focus:border-rose-500"
                          : ""
                      }`}
                    />
                    <p
                      className={`mt-2 text-xs ${
                        errors.dueDate ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {errors.dueDate || "You can leave this blank for now."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Organization */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">
                    <FiTag />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Organization</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Add labels to make your projects easier to find.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <label htmlFor="project-tags" className={labelClass}>
                    Project tags{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700"
                      >
                        <FiHash className="shrink-0" />
                        <span className="break-all">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove ${tag} tag`}
                          className="ml-1 rounded p-0.5 hover:bg-indigo-100"
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}

                    <input
                      id="project-tags"
                      type="text"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={addTag}
                      placeholder={
                        form.tags.length
                          ? "Add another tag..."
                          : "Type a tag and press Enter"
                      }
                      className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-3">
                    <p
                      className={`text-xs ${
                        errors.tags ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {errors.tags ||
                        "Examples: frontend, marketing, website, Q4-launch."}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {form.tags.length}/8
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-6 lg:col-span-4">
              {/* Live preview */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-bold text-slate-900">Project preview</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <FiCircle className="text-[8px]" />
                    Live preview
                  </span>
                </div>

                <div className="p-5">
                  <div
                    className="relative overflow-hidden rounded-2xl p-5"
                    style={{
                      background: `linear-gradient(135deg, ${form.color} 0%, ${form.color}d9 100%)`,
                    }}
                  >
                    <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/15" />
                    <div className="absolute -right-2 -top-4 h-24 w-24 rounded-full border border-white/15" />

                    <div className="relative">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-xl text-white backdrop-blur">
                        <FiFolder />
                      </div>

                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/70">
                        PROJECT
                      </p>

                      <h3 className="break-words text-xl font-bold text-white">
                        {form.name.trim() || "Your project name"}
                      </h3>

                      <p className="mt-2 min-h-10 break-words text-sm leading-5 text-white/80">
                        {form.description.trim() ||
                          "Your project description will appear here."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${selectedStatus.color}`}
                          />
                          {selectedStatus.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1.5 text-xs font-semibold capitalize text-white">
                          <FiTarget />
                          {form.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <FiCalendar className="shrink-0" />
                        Start date
                      </span>
                      <span className="text-right font-medium text-slate-700">
                        {form.startDate || "Not set"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <FiClock className="shrink-0" />
                        Deadline
                      </span>
                      <span className="text-right font-medium text-slate-700">
                        {form.dueDate || "Not set"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <FiTag className="shrink-0" />
                        Tags
                      </span>
                      <span className="text-right font-medium text-slate-700">
                        {form.tags.length} added
                      </span>
                    </div>
                  </div>

                  {form.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {form.tags.map((tag) => (
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
              </section>

              {/* Status */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FiCircle className="text-indigo-500" />
                  <h2 className="font-bold text-slate-900">Project status</h2>
                </div>

                <div className="space-y-2">
                  {statusOptions.map((option) => {
                    const isSelected = form.status === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("status", option.value)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-indigo-300 bg-indigo-50/70"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.color}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-800">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {option.description}
                          </span>
                        </span>
                        {isSelected && (
                          <FiCheckCircle className="shrink-0 text-lg text-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Priority */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FiTarget className="text-indigo-500" />
                  <h2 className="font-bold text-slate-900">Priority level</h2>
                </div>

                <label htmlFor="project-priority" className="sr-only">
                  Select project priority
                </label>
                <div className="relative">
                  <select
                    id="project-priority"
                    value={form.priority}
                    onChange={(event) =>
                      updateField("priority", event.target.value)
                    }
                    className={`${inputClass} appearance-none pr-10 font-medium`}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <p className={`mt-3 text-xs ${selectedPriority.color}`}>
                  {selectedPriority.label} priority selected
                </p>
              </section>

              {/* Tips */}
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <FiInfo />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      A quick tip
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      Keep your project name specific and your description
                      focused on the outcome. You can organize tasks and invite
                      team members after creating the project.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {/* Bottom actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
              <FiSave />
              Your project will be saved to your workspace.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiTrash2 />
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating project...
                  </>
                ) : success ? (
                  <>
                    <FiCheck />
                    Project created
                  </>
                ) : (
                  <>
                    <FiPlus />
                    Create project
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
