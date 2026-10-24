import { useState } from "react";
import {
  LayoutDashboard,
  ArrowUpRight,
  Mail,
  Check,
  Sparkles,
} from "lucide-react";

import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Projects", href: "/projects" },
        { label: "Task Management", href: "/features/tasks" },
        { label: "Team Collaboration", href: "/features/collaboration" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Documentation", href: "/docs" },
        { label: "Getting Started", href: "/getting-started" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "System Status", href: "/status" },
      ],
    },
  ];

  const socialLinks = [
    {
      label: "GitHub",
      href: "https://github.com",
      Icon: FaGithub,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com",
      Icon: FaLinkedin,
    },
    {
      label: "X",
      href: "https://x.com",
      Icon: FaXTwitter,
    },
  ];

  const handleSubscribe = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      // Replace this demo with your real newsletter API.
      // Example:
      // await api.post("/newsletter/subscribe", {
      //   email: normalizedEmail,
      // });

      console.info("Newsletter signup submitted:", normalizedEmail);

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Subscription failed. Please try again.");
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand and newsletter */}
          <div className="lg:col-span-5">
            <a
              href="/"
              aria-label="TaskFlow homepage"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <LayoutDashboard size={19} strokeWidth={2.3} />
              </span>

              <span className="text-xl font-bold tracking-tight text-slate-900">
                TaskFlow
              </span>
            </a>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Plan projects, manage tasks, and bring your team together.
              TaskFlow helps your team turn ideas into meaningful progress.
            </p>

            {/* Newsletter */}
            <div className="mt-7 max-w-md">
              <h2 className="text-sm font-semibold text-slate-900">
                Product updates, delivered
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Get helpful tips and updates from the TaskFlow team.
              </p>

              <form
                onSubmit={handleSubscribe}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <label
                    htmlFor="taskflow-newsletter-email"
                    className="sr-only"
                  >
                    Email address
                  </label>

                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="taskflow-newsletter-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setStatus("idle");
                    }}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    disabled={status === "loading"}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "loading" ? (
                    "Submitting..."
                  ) : status === "success" ? (
                    <>
                      <Check size={16} />
                      Subscribed
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowUpRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {status === "success" && (
                <p role="status" className="mt-2 text-xs text-emerald-700">
                  Thanks! Your signup was submitted.
                </p>
              )}

              {status === "error" && (
                <p role="alert" className="mt-2 text-xs text-rose-600">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Navigation link groups */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-7 lg:justify-items-end">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-semibold text-slate-900">
                  {section.title}
                </h2>

                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-slate-500 transition hover:text-indigo-600 focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
              <Sparkles size={17} />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Ready to organize your team's work?
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Create your workspace and start managing projects together.
              </p>
            </div>
          </div>

          <a
            href="/signup"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            Get started
            <ArrowUpRight size={15} />
          </a>
        </div>

        {/* Footer bottom bar */}
        <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {currentYear} TaskFlow. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`TaskFlow on ${label}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
