"use client";
import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaCheckCircle,
  FaTasks,
  FaRocket,
  FaBars,
  FaTimes,
  FaUser,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Footer from "@/components/footer";
import Link from "next/link";
import { RiCustomerService2Fill } from "react-icons/ri";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

const PawGle = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userInfoExists, setUserInfoExists] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [petsCount, setPetsCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem("modeR");
    const isDark = savedMode === "dark";
    setIsDarkMode(isDark);
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("mode", isDarkMode ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const userInfo = localStorage.getItem("accessToken");
    setUserInfoExists(!!userInfo);

    const fetchusersCount = async () => {
      const response = await fetch(`${BACKEND_URL}/api/auth/users/count/`);
      if (response.ok) {
        const data = await response.json();
        setUsersCount(data.user_count);
      } else {
        console.error("Failed to fetch public pets");
      }
    };
    const fetchpetsCount = async () => {
      const response = await fetch(`${BACKEND_URL}/api/auth/pets/count/`);
      if (response.ok) {
        const data = await response.json();
        setPetsCount(data.pet_count);
      } else {
        console.error("Failed to fetch public pets");
      }
    };
    fetchusersCount();
    fetchpetsCount();
  }, []);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="min-h-screen flex flex-col text relative overflow-hidden">
      {/* <video
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
        autoPlay
        loop
        muted
        src="/animal.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent "></div> */}

      <div className="bg backdrop-blur-sm"></div>
      <header className="flex justify-between items-center px-8 py-3 shadow-lg fixed w-full z-50 bg-[var(--backgroundColor)]">
        <div className="text-4xl font-bold">
          <Link href="/">
            Paw<span className="primary">Gle</span>
          </Link>
        </div>
        <div className="hidden md:flex">
          <nav>
            <ul className="flex space-x-8 nav-links">
              <li>
                <Link
                  href="/fun"
                  className="text hover:text-[var(--primaryColor)] transition duration-200 text-lg font-medium"
                >
                  Fun
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text hover:text-[var(--primaryColor)] transition duration-200 text-lg font-medium"
                >
                  DashBoard
                </Link>
              </li>
              <li>
                <Link
                  href="/pet/map"
                  className="text hover:text-[var(--primaryColor)] transition duration-200 text-lg font-medium"
                >
                  Map
                </Link>
              </li>
              <li>
                <Link
                  href="/pet/report"
                  className="text hover:text-[var(--primaryColor)] transition duration-200 text-lg font-medium"
                >
                  Report
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="hidden md:flex space-x-4 items-center">
          {/* Theme Toggle Button */}
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
          <button className="bg-[var(--primary1)] hover:bg-[var(--primary2)] text py-2 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-105">
            <RiCustomerService2Fill className="text-2xl" />
          </button>
          {!userInfoExists ? (
            <button className="border border-white hover:border[var(--primary2)] hover:text-[var(--primaryColor)] text py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105">
              <Link
                href="/login"
                className="text hover:text-[var(--primaryColor)] transition duration-200"
              >
                Sign In or Create Account
              </Link>
            </button>
          ) : (
            <Link href="/user">
              <FaUser className="text-3xl my-2" />
            </Link>
          )}
        </div>
        <div className="md:hidden flex items-center">
          <button onClick={toggleNav} className="text">
            {isNavOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`absolute left-0 w-full bg-[var(--backgroundColor)] shadow-md transition-all duration-300 overflow-hidden z-50 ${
          isNavOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          top: "4rem", // Adjust this to be below navbar
          transition: "max-height 0.3s ease, opacity 0.3s ease",
        }}
      >
        <nav className="p-4">
          <ul className="space-y-4 nav-links">
            {["Home", "Dashboard", "Pets", "Support"].map((item) => (
              <li key={item}>
                <Link
                  href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="text hover:text-[var(--primaryColor)] transition duration-200 text-lg font-medium"
                  onClick={toggleNav}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col items-start p-4 space-y-4">
          <button className="bg-[var(--primary1)] hover:bg-[var(--primary2)] text py-2 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-105">
            Customer Care&nbsp;
            <RiCustomerService2Fill className="inline text-[20px]" />
          </button>
          <button className="border border-white hover:border-[var(--primaryColor)] hover:text-[var(--primaryColor)] text py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105">
            <Link
              href="/login"
              className="text hover:text-[var(--primaryColor)] transition duration-200"
            >
              Sign In or Create Account
            </Link>
          </button>
        </div>
      </div>

      <main className="text-center mt-32 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center items-center mb-4">
            <p className="text-green-400 text-sm font-bold flex items-center py-1 bg-[var(--fun)] rounded-full px-4">
              <FaRocket className="mr-2 text-red-400" />
              {petsCount ? petsCount : "0"} NEW PETS REGISTERED THIS WEEK!
            </p>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-6xl font-bold text-[var(--primaryColor)] mb-4 w-fit bg-[var(--fun)] px-4 py-2 rounded-full backdrop-blur-3xl">
              Effortless Identification
            </h1>
            <h1 className="text-6xl font-bold text-[var(--primaryColor)] mb-6 w-fit bg-[var(--fun)] px-4 py-2 rounded-full backdrop-blur-3xl">
              of Your Pets
            </h1>
            <p className="text-[var(--primary2)] text-lg max-w-2xl mx-auto font-cursive mb-6 w-fit bg-[var(--fun)] px-4 py-2 rounded-full">
              Say goodbye to the hassle of recognizing your furry friends!
            </p>
          </div>
        </motion.div>
      </main>
      <div className="flex z-1 py-20 px-6 pt-20 items-center justify-center flex-wrap gap-10 relative z-10">
        <StatCard
          icon={
            <FaUsers className="w-10 h-10 mb-4 text-[var(--primaryColor)]" />
          }
          number={usersCount ? usersCount : 0}
          description="Users Registered"
        />
        <StatCard
          icon={
            <FaCheckCircle className="w-10 h-10 mb-4 text-[var(--primaryColor)]" />
          }
          number="100%"
          description="Pet Owner Verified"
        />
        <StatCard
          icon={
            <FaTasks className="w-10 h-10 mb-4 text-[var(--primaryColor)]" />
          }
          number={petsCount ? petsCount : 0}
          description="Animals Registered"
        />
      </div>

      <CustomAccordion />
      <Footer />
    </div>
  );
};

const CustomAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    console.log(index);
    setOpenIndex(openIndex === index ? null : index);
  };

  const items = [
    {
      title: "What is PetGle?",
      content:
        "PetGle is a platform designed to help pet owners quickly and easily identify their pets based on visual and other unique features.",
    },
    {
      title: "Why use PetGle?",
      content:
        "PetGle takes the hassle out of identifying pets, allowing pet owners and veterinarians to keep track of pets and their key details with minimal effort.",
    },
    {
      title: "Is PetGle Paid?",
      content:
        "PetGle offers both free and premium services, depending on the level of detail and customization you need for identifying and registering your pets.",
    },
  ];

  return (
    <div className="z-10">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        className="relative -bottom-1"
      >
        <path
          className="wave"
          fillOpacity="1"
          d="M0,192L40,202.7C80,213,160,235,240,224C320,213,400,171,480,170.7C560,171,640,213,720,240C800,267,880,277,960,261.3C1040,245,1120,203,1200,181.3C1280,160,1360,160,1400,160L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
        ></path>
      </svg>
      <section id="faq" className="faq py-12 bg-[var(--background)] z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-uppercase mb-2 text-[var(--secondaryColor)]">
              FAQ
            </h1>
            <div className="headingLine"></div>
            <p className="lead">
              Frequently asked questions, get knowledge beforehand
            </p>
          </div>
          {/* Accordion Content */}
          <div className="max-w-3xl mx-auto">
            {/* FAQ Item 1 */}
            {items.map((item, index) => (
              <div className="mb-4" key={index}>
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  className={`flex items-center justify-between w-full p-6 text-left font-semibold transition-all duration-200 acordion ${
                    openIndex === index
                      ? "opened rounded-t-xl"
                      : "rounded-lg acordionShadow"
                  }`}
                >
                  <span>{item.title}</span>
                  <svg
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      openIndex === index ? "transform rotate-180" : ""
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="p-6 content border-t-0 rounded-b-lg acordionShadow">
                    <p>{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon, number, description }) => {
  return (
    <motion.div
      className="text-center max-w-[220px] flex flex-col items-center bg-[var(--background)] p-4 rounded-lg shadow-lg transition duration-300 hover:shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {icon}
      <span className="text-5xl font-extrabold md:text-6xl text-[var(--textColor)]">
        {number}
      </span>
      <p className="mt-2 text-base font-semibold text-[var(--primaryColor)]">
        {description}
      </p>
    </motion.div>
  );
};

export default PawGle;
