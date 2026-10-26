import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  Settings,
  UserRound,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Sparkles,
  Clock,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import useAuth from "../hooks/useAuth";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    label: "My Tasks",
    icon: CheckSquare,
    href: "/my-tasks",
  },
];

const CREATE_ITEMS = [
  {
    label: "New project",
    description: "Organize your work",
    icon: FolderKanban,
    route: "/projects/new",
  },
  {
    label: "New task",
    description: "Add to your workflow",
    icon: CheckSquare,
    route: "/my-tasks/new",
  },
  {
    label: "Invite teammate",
    description: "Collaborate with your team",
    icon: Users,
    route: "/team/invite",
  },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getErrorMessage = (error) => {
  if (error?.code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

const Navbar = () => {
  const navigate = useNavigate();

  const { user, loading, userLogOut, getCurrentUserProfile } = useAuth();

  const [mongoProfile, setMongoProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [notifications, setNotifications] = useState([]);

  const navbarRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const isLoggedIn = Boolean(user?.uid);

  // Load the signed-in user's profile from MongoDB.
  useEffect(() => {
    let cancelled = false;

    if (!user?.uid || typeof getCurrentUserProfile !== "function") {
      setMongoProfile(null);
      setProfileLoading(false);
      return undefined;
    }

    const loadProfile = async () => {
      setProfileLoading(true);

      try {
        const profile = await getCurrentUserProfile();

        if (!cancelled) {
          setMongoProfile(profile || null);
        }
      } catch (error) {
        if (!cancelled) {
          setMongoProfile(null);

          console.error(
            "[Navbar] Could not load MongoDB profile:",
            error.message,
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, getCurrentUserProfile]);

  // Prefer MongoDB profile fields, with Firebase fallbacks.
  const userName =
    mongoProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const userEmail = mongoProfile?.email || user?.email || "";

  const userPhoto = mongoProfile?.photoURL || user?.photoURL || "";

  const userInitials = getInitials(userName);

  const userRole = mongoProfile?.role || "user";

  const accountStatus = mongoProfile?.status || "active";

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const closeDropdowns = useCallback(() => {
    setOpenMenu(null);
  }, []);

  const closeAllMenus = useCallback(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, []);

  // Close menus when clicking outside the navbar or pressing Escape.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        closeAllMenus();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeAllMenus]);

  // Focus mobile search when it opens.
  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const toggleMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    closeAllMenus();

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleCreate = (route) => {
    closeAllMenus();
    navigate(route);
  };

  const handleMenuAction = (route) => {
    closeAllMenus();

    if (route) {
      navigate(route);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

  const handleNotificationClick = (notification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );

    closeAllMenus();

    // Navigate to the relevant resource when notification routes are added.
  };

  // Firebase sign-out is handled by AuthProvider.
  // Backend logout tracking is handled inside userLogOut.
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await userLogOut();

      setMongoProfile(null);
      closeAllMenus();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("[Navbar] Logout failed:", error);

      setLogoutError(getErrorMessage(error));
    } finally {
      setLoggingOut(false);
    }
  };

  const renderAvatar = (size = "h-9 w-9", textSize = "text-xs") => {
    if (userPhoto) {
      return (
        <img
          src={userPhoto}
          alt={`${userName}'s profile`}
          referrerPolicy="no-referrer"
          className={`${size} shrink-0 rounded-full object-cover`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      );
    }

    return (
      <span
        className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white ${textSize}`}
      >
        {userInitials}
      </span>
    );
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <LayoutDashboard size={19} />
            </span>

            <span className="text-lg font-bold tracking-tight text-slate-900">
              TaskFlow
            </span>
          </Link>

          <LoaderCircle
            size={20}
            className="animate-spin text-indigo-600"
            aria-label="Loading authentication"
          />
        </div>
      </header>
    );
  }

  return (
    <header
      ref={navbarRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white"
    >
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-5 lg:px-8">
        {/* Brand and mobile menu */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isLoggedIn && (
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setMobileMenuOpen((current) => !current);
                setMobileSearchOpen(false);
                closeDropdowns();
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link
            to="/"
            onClick={closeAllMenus}
            aria-label="TaskFlow home"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <LayoutDashboard size={19} strokeWidth={2.3} />
            </span>

            <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:inline">
              TaskFlow
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        {isLoggedIn && (
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 xl:flex"
          >
            {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
              <NavLink
                key={href}
                to={href}
                end={href === "/"}
                className={navLinkClass}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Desktop search */}
        {isLoggedIn && (
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="mx-3 hidden w-full max-w-sm flex-1 md:block"
          >
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={desktopSearchRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects, tasks..."
                aria-label="Search projects and tasks"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </form>
        )}

        {/* Right-side actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isLoggedIn && (
            <>
              {/* Mobile search */}
              <button
                type="button"
                aria-label="Open search"
                aria-expanded={mobileSearchOpen}
                onClick={() => {
                  setMobileSearchOpen((current) => !current);
                  setMobileMenuOpen(false);
                  closeDropdowns();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:hidden"
              >
                <Search size={19} />
              </button>

              {/* Create menu */}
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === "create"}
                  onClick={() => toggleMenu("create")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:px-3"
                >
                  <Plus size={17} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Create</span>
                  <ChevronDown size={14} className="hidden sm:block" />
                </button>

                {openMenu === "create" && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
                  >
                    <p className="px-3 py-2 text-xs font-medium text-slate-500">
                      Create something new
                    </p>

                    {CREATE_ITEMS.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.route}
                          type="button"
                          role="menuitem"
                          onClick={() => handleCreate(item.route)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <Icon size={17} className="text-indigo-600" />

                          <span>
                            <span className="block text-sm font-medium text-slate-800">
                              {item.label}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Help */}
              <button
                type="button"
                aria-label="Help and support"
                onClick={() => handleMenuAction("/help")}
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
                  aria-expanded={openMenu === "notifications"}
                  onClick={() => toggleMenu("notifications")}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <Bell size={19} />

                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                  )}
                </button>

                {openMenu === "notifications" && (
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
                        disabled={unreadCount === 0}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        Mark all read
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell
                          size={25}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="text-sm font-medium text-slate-700">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          New updates will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {notification.initials || "N"}
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
                    )}

                    <button
                      type="button"
                      onClick={() => handleMenuAction("/notifications")}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
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
                  aria-expanded={openMenu === "profile"}
                  onClick={() => {
                    setLogoutError("");
                    toggleMenu("profile");
                  }}
                  className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-100"
                >
                  {renderAvatar()}

                  <span className="hidden max-w-28 text-left lg:block">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {userName}
                    </span>
                    <span className="block text-[10px] capitalize text-slate-500">
                      {profileLoading ? "Loading profile..." : userRole}
                    </span>
                  </span>

                  <ChevronDown
                    size={14}
                    className="hidden text-slate-400 lg:block"
                  />
                </button>

                {openMenu === "profile" && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
                  >
                    <div className="flex items-center gap-3 px-3 py-3">
                      {renderAvatar("h-10 w-10", "text-sm")}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {userName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {userEmail}
                        </p>
                        <p className="mt-1 text-[11px] capitalize text-slate-500">
                          Role: {userRole}
                        </p>
                      </div>
                    </div>

                    {accountStatus !== "active" && (
                      <p className="mx-2 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Account status: {accountStatus}
                      </p>
                    )}

                    {logoutError && (
                      <div
                        role="alert"
                        className="mx-2 mb-2 flex gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700"
                      >
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{logoutError}</span>
                      </div>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleMenuAction("/profile")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserRound size={16} />
                      My profile
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleMenuAction("/settings")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Settings size={16} />
                      Account settings
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleMenuAction("/whats-new")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Sparkles size={16} />
                      What's new
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loggingOut ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}

                      {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Logged-out actions */}
          {!isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                onClick={closeAllMenus}
                className="hidden h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeAllMenus}
                className="hidden h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:inline-flex"
              >
                Register
              </Link>

              <Link
                to="/login"
                onClick={closeAllMenus}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:hidden"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search panel */}
      {isLoggedIn && mobileSearchOpen && (
        <div className="border-t border-slate-100 px-3 py-3 sm:px-5 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={mobileSearchRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects, tasks..."
                aria-label="Search projects and tasks"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile navigation */}
      {isLoggedIn && mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-3 py-3 sm:px-5 lg:hidden">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            {renderAvatar("h-10 w-10", "text-sm")}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {userName}
              </p>
              <p className="truncate text-xs text-slate-500">{userEmail}</p>
              <p className="mt-1 text-[11px] capitalize text-slate-500">
                {userRole}
              </p>
            </div>
          </div>

          <nav aria-label="Mobile navigation" className="grid gap-1">
            {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
              <NavLink
                key={href}
                to={href}
                end={href === "/"}
                onClick={closeAllMenus}
                className={navLinkClass}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}

            <div className="my-1 border-t border-slate-100" />

            <Link
              to="/profile"
              onClick={closeAllMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <UserRound size={18} />
              My profile
            </Link>

            <Link
              to="/settings"
              onClick={closeAllMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <Settings size={18} />
              Settings
            </Link>

            <Link
              to="/help"
              onClick={closeAllMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <HelpCircle size={18} />
              Help and support
            </Link>

            {logoutError && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
              >
                {logoutError}
              </p>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}

              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
