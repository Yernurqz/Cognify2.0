import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import styles from "./DashboardLayout.module.css";

interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

export const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate("/auth");
  };

  const navLinks: NavLinkItem[] =
    role === "teacher"
      ? [
          {
            path: "/teacher/dashboard",
            label: "Overview",
            icon: <LayoutDashboard size={20} />,
          },
          {
            path: "/teacher/courses",
            label: "My Courses",
            icon: <BookOpen size={20} />,
          },
          {
            path: "/teacher/create",
            label: "Create Course",
            icon: <PlusCircle size={20} />,
          },
          {
            path: "/teacher/students",
            label: "Students",
            icon: <Users size={20} />,
          },
        ]
      : [
          {
            path: "/student/dashboard",
            label: "My Learning",
            icon: <LayoutDashboard size={20} />,
          },
          {
            path: "/student/catalog",
            label: "Course Catalog",
            icon: <BookOpen size={20} />,
          },
        ];

  return (
    <div className={styles.layout}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>
          <div style={{ color: "var(--primary)" }}>
            <BookOpen size={28} />
          </div>
          <span className="text-gradient">Cognify</span>

          {/* Mobile Close Button */}
          <button
            className={styles.mobileCloseBtn}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <button
            className={styles.navItem}
            style={{ width: "100%", border: "none", background: "transparent" }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainSection}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className={styles.headerTitle}>
              {navLinks.find((l) => l.path === location.pathname)?.label ||
                "Dashboard"}
            </h2>
          </div>
          <div className={styles.userInfo}>
            <button
              className={styles.navItem}
              style={{ padding: "0.5rem", borderRadius: "50%" }}
            >
              <Settings size={20} />
            </button>
            <div className={styles.avatar}>
              {role === "teacher" ? "TR" : "ST"}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
};
