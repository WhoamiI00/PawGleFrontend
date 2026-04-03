"use client";
import { useState, useEffect, useCallback } from "react";
import { FaUser, FaMoon, FaSun, FaBell } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { MdDashboard } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { FaMapMarkedAlt } from "react-icons/fa";
import { MdReport } from "react-icons/md";
import { IoLogoOctocat } from "react-icons/io5";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch(`${BACKEND_API_PORT}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access);
        setIsLoggedIn(true);
      } else if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }, [BACKEND_API_PORT]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_API_PORT}/api/auth/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [BACKEND_API_PORT]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await fetch(`${BACKEND_API_PORT}/api/auth/notifications/${id}/read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await fetch(`${BACKEND_API_PORT}/api/auth/notifications/read-all/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationMessage = (notification) => {
    return notification.description || notification.verb;
  };

  const getNotificationStyle = (verb) => {
    switch (verb) {
      case "feature_extraction_complete":
        return "border-l-4 border-green-500";
      case "feature_extraction_failed":
        return "border-l-4 border-red-500";
      default:
        return "border-l-4 border-[var(--primaryColor)]";
    }
  };

  // Check login status on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshTokenValue = localStorage.getItem("refreshToken");
    const loggedIn = !!accessToken && !!refreshTokenValue;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      refreshToken();
      fetchNotifications();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchNotifications]);

  // Set up periodic token refresh
  useEffect(() => {
    if (isLoggedIn) {
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 3 * 60 * 500);
      return () => clearInterval(refreshInterval);
    }
  }, [isLoggedIn, refreshToken]);

  const toggleDropdown = (event) => {
    event.stopPropagation();
    setShowDropdown((prev) => !prev);
    setShowNotifications(false);
  };

  const toggleNotifications = (event) => {
    event.stopPropagation();
    setShowNotifications((prev) => !prev);
    setShowDropdown(false);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("mode");
    const isDark = savedMode === "dark";
    setIsDarkMode(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    localStorage.setItem("modeR", isDarkMode ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) setShowDropdown(false);
      if (showNotifications) setShowNotifications(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown, showNotifications]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    setNotifications([]);
    setUnreadCount(0);
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <header className="flex justify-between fixed w-full items-center px-6 py-5 shadow-lg z-20 bg-[var(--backgroundColor)]">
        <div className="text-3xl md:text-4xl font-bold text-[var(--secondaryColor)]">
          <Link href="/">
            Paw<span className="text-[var(--primaryColor)]">Gle</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--background2)] hover:bg-[var(--primaryColor)] transition duration-300"
          >
            {isDarkMode === false ? (
              <FaMoon className="text-[var(--textColor)]" size={20} />
            ) : (
              <FaSun className="text-[var(--textColor)]" size={20} />
            )}
          </button>

          {/* Notification Bell */}
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-2 rounded-full bg-[var(--background2)] hover:bg-[var(--primaryColor)] transition duration-300 relative"
              >
                <FaBell className="text-[var(--textColor)]" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="absolute right-0 mt-2 w-80 bg-[var(--background2)] rounded-lg shadow-lg z-50 overflow-hidden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--c3)]">
                      <h3 className="font-bold text-[var(--textColor)]">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[var(--primaryColor)] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-[var(--textColor2)]">
                          No notifications
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (!notification.is_read) markAsRead(notification.id);
                            }}
                            className={`px-4 py-3 cursor-pointer hover:bg-[var(--backgroundColor)] transition duration-150 ${
                              getNotificationStyle(notification.verb)
                            } ${!notification.is_read ? "bg-[var(--backgroundColor)]" : ""}`}
                          >
                            <p className={`text-sm ${!notification.is_read ? "font-semibold" : ""} text-[var(--textColor)]`}>
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-[var(--textColor2)] mt-1">
                              {timeAgo(notification.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2"
            >
              <Image
                src="/animal.png"
                width={100}
                height={100}
                alt="Profile"
                className="w-10 h-10 items-center rounded-full border-2 border-[var(--primaryColor)] bg-[var(--c2)]"
              />
            </button>
            {showDropdown && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-[var(--background2)] rounded-lg shadow-lg z-50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ul className="py-2 text-[var(--secondaryColor)]">
                  <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <MdDashboard />
                    <Link href="/dashboard">
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <FaUser />
                    <Link href="/user">
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <IoLogoOctocat />
                    <Link href="/fun">
                      <span>Editor</span>
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <FaMapMarkedAlt />
                    <Link href="/pet/map">
                      <span>Map</span>
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <MdReport />
                    <Link href="/pet/report">
                      <span>Report</span>
                    </Link>
                  </li>
                  {isLoggedIn ? (
                    <li
                      className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2 cursor-pointer"
                      onClick={logout}
                    >
                      <FiLogOut className="text-[22px]" />
                      <Link href="/"><span>LogOut</span></Link>
                    </li>
                  ) : (
                    <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2 cursor-pointer">
                      <FiLogOut className="text-[22px]" />
                      <Link href="/login"><span>Login</span></Link>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
