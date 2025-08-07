"use client";
import { useState, useEffect, useCallback } from "react";
import { FaCog, FaUser, FaMoon, FaSun } from "react-icons/fa";
import { motion } from "framer-motion";
import { MdDashboard } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { FaMapMarkedAlt } from "react-icons/fa";
import { MdReport } from "react-icons/md";
import { IoLogoOctocat } from "react-icons/io5";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        console.log("Token refreshed successfully");
      } else {
        // If refresh token is invalid, log the user out
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }, [BACKEND_API_PORT]);

  // Check login status on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshTokenValue = localStorage.getItem("refreshToken");
    setIsLoggedIn(!!accessToken && !!refreshTokenValue);

    if (accessToken && refreshTokenValue) {
      refreshToken();
    }
  }, [refreshToken]);

  // Set up periodic token refresh
  useEffect(() => {
    if (isLoggedIn) {
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 3 * 60 * 500); // 2 minutes in milliseconds

      return () => clearInterval(refreshInterval);
    }
  }, [isLoggedIn, refreshToken]);

  const toggleDropdown = (event) => {
    event.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("mode");
    const isDark = savedMode === "dark";
    setIsDarkMode(isDark);
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("modeR", isDarkMode ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    // window.location.reload();
  };

  return (
    <>
      <header className="flex justify-between fixed w-[99%] rounded-3xl testt backdrop-blur-md items-center px-6 py-3 m-2 shadow-lg z-[20] bg-[var(--backgroundColor)/80] border border-[var(--secondaryColor2)]">
        <div className="text-3xl md:text-4xl font-bold text-[var(--secondaryColor)]">
          <Link href="/">
            Paw<span className="text-[var(--primaryColor)]">Gle</span>
          </Link>
        </div>

        {/* Profile & Theme Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--background2)] buttonExtra hover:bg-[var(--nigga)]"
          >
            {isDarkMode === false ? (
              <FaMoon className="text-[var(--textColor)]" size={20} />
            ) : (
              <FaSun className="text-[var(--textColor)]" size={20} />
            )}
          </button>

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 buttonExtra"
            >
              <Image
                src="/profile.jpg"
                width={100}
                height={100}
                alt="Profile"
                className="w-10 h-10 items-center rounded-full border border-[var(--primaryColor)] hover:bg-[var(--c2)] backdrop-blur-sm"
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
                  {isLoggedIn ? (
                    <li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                      <FaUser />
                      <Link href="/user">
                        <span>Profile</span>
                      </Link>
                    </li>
                  ) : (
                    ""
                  )}
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
                  {/* {<li className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2">
                    <FaCog />
                    <span>Settings</span>
                  </li>} */}
                  <li
                    className="px-4 py-2 hover:bg-[var(--backgroundColor)] flex items-center space-x-2"
                    onClick={logout}
                  >
                    <FiLogOut className="text-[22px]" />
                    {isLoggedIn ? (
                      <Link href="/">
                        <span>LogOut</span>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <span>Login</span>
                      </Link>
                    )}
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
