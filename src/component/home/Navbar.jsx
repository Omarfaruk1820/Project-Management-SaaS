import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Bell,
  HelpCircle,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Command,
  Sparkles,
  Clock,
  MoreHorizontal,
  Link,
} from "lucide-react";

const Navbar = () => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeWorkspace, setActiveWorkspace] = useState({
    name: "Acme Studio",
    initials: "AS",
    color: "bg-indigo-600",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWorkspaceOpen(false);
        setCreateOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setWorkspaceOpen(false);
        setCreateOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setMobileSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      searchRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const closeDropdowns = () => {
    setWorkspaceOpen(false);
    setCreateOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const workspaces = [
    {
      name: "Acme Studio",
      initials: "AS",
      color: "bg-indigo-600",
    },
    {
      name: "Design Team",
      initials: "DT",
      color: "bg-emerald-600",
    },
    {
      name: "Personal",
      initials: "ME",
      color: "bg-orange-500",
    },
  ];

  const notifications = [
    {
      id: 1,
      title: "Sarah assigned you a task",
      description: "Update the dashboard design",
      time: "5 min ago",
      initials: "SK",
      color: "bg-pink-100 text-pink-700",
      unread: true,
    },
    {
      id: 2,
      title: "Project deadline approaching",
      description: "Website Redesign is due tomorrow",
      time: "1 hour ago",
      initials: "WR",
      color: "bg-indigo-100 text-indigo-700",
      unread: true,
    },
    {
      id: 3,
      title: "You received a comment",
      description: "Alex commented on your task",
      time: "Yesterday",
      initials: "AR",
      color: "bg-amber-100 text-amber-700",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) return;

    // Connect this to your global search or API.
    console.log("Search:", searchQuery.trim());
  };

  const handleCreate = (type) => {
    closeDropdowns();

    // Connect these actions to your project/task creation modals.
    console.log(`Create ${type}`);
  };

  const handleWorkspaceChange = (workspace) => {
    setActiveWorkspace(workspace);
    closeDropdowns();

    // Connect this to your workspace context or state management.
  };

  const handleMarkAllRead = () => {
    // Connect this to your notification API.
    console.log("Mark all notifications as read");
    setNotificationsOpen(false);
  };

  const handleMenuAction = (action) => {
    closeDropdowns();

    // Connect these actions to your routes or authentication logic.
    console.log(action);
  };

  return (
    <header
      ref={dropdownRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white"
    >
      <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand and workspace */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand */}
          <a
            href="/"
            aria-label="TaskFlow home"
            className="flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <LayoutDashboard size={19} strokeWidth={2.3} />
            </div>

            <span className="hidden text-[19px] font-bold tracking-tight text-slate-900 sm:inline">
              TaskFlow
            </span>
          </a>

          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          {/* Workspace switcher */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={workspaceOpen}
              onClick={() => {
                setWorkspaceOpen((open) => !open);
                setCreateOpen(false);
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
              className="flex max-w-[190px] items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-100"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${activeWorkspace.color}`}
              >
                {activeWorkspace.initials}
              </span>

              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {activeWorkspace.name}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Workspace
                </span>
              </span>

              <ChevronDown size={15} className="shrink-0 text-slate-400" />
            </button>

            {workspaceOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">
                    Your workspaces
                  </p>
                </div>

                {workspaces.map((workspace) => (
                  <button
                    key={workspace.name}
                    type="button"
                    role="menuitem"
                    onClick={() => handleWorkspaceChange(workspace)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${workspace.color}`}
                    >
                      {workspace.initials}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {workspace.name}
                    </span>

                    {activeWorkspace.name === workspace.name && (
                      <Check size={16} className="text-indigo-600" />
                    )}
                  </button>
                ))}

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => handleMenuAction("Manage workspaces")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Settings size={16} />
                  Manage workspaces
                  <ChevronRight size={15} className="ml-auto" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="hidden w-full max-w-[420px] flex-1 md:block"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects, tasks..."
              aria-label="Search projects and tasks"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />

            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:flex">
              <Command size={10} />K
            </span>
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobile search */}
          <button
            type="button"
            aria-label="Open search"
            onClick={() => {
              setMobileSearchOpen((open) => !open);
              closeDropdowns();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:hidden"
          >
            <Search size={19} />
          </button>

          {/* Create button */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={createOpen}
              onClick={() => {
                setCreateOpen((open) => !open);
                setWorkspaceOpen(false);
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <Plus size={17} strokeWidth={2.5} />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </button>

            {createOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
              >
                <p className="px-3 py-2 text-xs font-medium text-slate-500">
                  Create something new
                </p>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleCreate("project")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <FolderKanban size={17} className="text-indigo-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      New project
                    </span>
                    <span className="block text-xs text-slate-500">
                      Organize work
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleCreate("task")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <CheckSquare size={17} className="text-emerald-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      New task
                    </span>
                    <span className="block text-xs text-slate-500">
                      Add to your workflow
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleCreate("invite")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <Users size={17} className="text-amber-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Invite teammate
                    </span>
                    <span className="block text-xs text-slate-500">
                      Collaborate together
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            type="button"
            aria-label="Help and support"
            onClick={() => handleMenuAction("Help and support")}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:flex"
          >
            <HelpCircle size={19} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setWorkspaceOpen(false);
                setCreateOpen(false);
                setProfileOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
              )}
            </button>

            {notificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full mt-2 w-[min(350px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {unreadCount} unread updates
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        handleMenuAction(`Open notification ${notification.id}`)
                      }
                      className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${notification.color}`}
                      >
                        {notification.initials}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-slate-800">
                            {notification.title}
                          </span>
                          {notification.unread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          {notification.description}
                        </span>

                        <span className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={11} />
                          {notification.time}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleMenuAction("View all notifications")}
                  className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  View all notifications
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div className="relative ml-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((open) => !open);
                setWorkspaceOpen(false);
                setCreateOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white ring-2 ring-white">
                OF
              </span>

              <span className="hidden max-w-[110px] text-left lg:block">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  Omar Faruk
                </span>
                <span className="block text-[10px] text-slate-500">Admin</span>
              </span>

              <ChevronDown
                size={14}
                className="hidden text-slate-400 lg:block"
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    OF
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      Omar Faruk
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      omar@example.com
                    </span>
                  </span>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction("My profile")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <User size={16} />
                  My profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction("Account settings")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings size={16} />
                  Account settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction("What's new")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Sparkles size={16} />
                  What's new
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction("Sign out")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
                <button
                to="login"
                  type="button"
                  role="menuitem"
                //   onClick={() => handleMenuAction("Sign out")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  LogIn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search panel */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects, tasks..."
                aria-label="Search projects and tasks"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <nav className="grid gap-1">
            {[
              {
                label: "Dashboard",
                Icon: LayoutDashboard,
                href: "/",
              },
              {
                label: "Projects",
                Icon: FolderKanban,
                href: "/projects",
              },
              {
                label: "My Tasks",
                Icon: CheckSquare,
                href: "/my-tasks",
              },
            ].map(({ label, Icon, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
              >
                <Icon size={18} />
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
