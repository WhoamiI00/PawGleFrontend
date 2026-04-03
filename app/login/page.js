"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { IoEye, IoEyeOff } from "react-icons/io5";
import CirclesBackground from "@/components/background";

const LoginSignup = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [passVisible1, setPassVisible1] = useState(true);
  const [passVisible2, setPassVisible2] = useState(true);
  const [windowHeight, setWindowHeight] = useState(0);

  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;
  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, []);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const toggleEye1 = () => {
    setPassVisible1(!passVisible1);
  };

  const toggleEye2 = () => {
    setPassVisible2(!passVisible2);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const alphanumeric = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
    return password.length >= minLength && alphanumeric.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp
      ? `${BACKEND_API_PORT}/api/auth/signup/`
      : `${BACKEND_API_PORT}/api/auth/login/`;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    if (isSignUp) {
      if (!validatePassword(data.password)) {
        setErrorMessage(
          "Password must be at least 8 characters long and contain both letters and numbers."
        );
        return;
      }

      if (data.password !== data.confirm_password) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.access) {
        localStorage.setItem("accessToken", result.access);
        localStorage.setItem("refreshToken", result.refresh);
        router.push("/user");
      } else if (isSignUp && response.ok) {
        setSuccessMessage(result.message || "Account created! Please check your email to verify your account.");
      } else {
        setErrorMessage(result.detail || result.error || "An error occurred. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CirclesBackground height={windowHeight} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--background)] to-[var(--background2)] text-[var(--textColor)]">
        <motion.div
          className="loginContainer bg-[var(--background2)] p-10 rounded-lg shadow-lg w-full max-w-md relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "login"}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-center mb-6">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <form
                className="space-y-6"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                {isSignUp && (
                  <div>
                    <label className="block text-sm text-[var(--textColor2)]">
                      User Name
                    </label>
                    <input
                      name="username"
                      type="text"
                      placeholder="Enter your User Name"
                      className="w-full px-4 py-3 bg-[var(--backgroundColor)] rounded-lg text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-[var(--textColor2)]">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-[var(--backgroundColor)] rounded-lg text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm text-[var(--textColor2)]">
                    Password
                  </label>
                  <input
                    name="password"
                    type={!passVisible1 ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-[var(--backgroundColor)] rounded-lg text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                    required
                  />
                  <span
                    className="absolute right-2 top-7 z-1"
                    onClick={toggleEye1}
                  >
                    {!passVisible1 ? (
                      <IoEye className="text-3xl text-[var(--textColor2)]" />
                    ) : (
                      <IoEyeOff className="text-3xl text-[var(--textColor2)]" />
                    )}
                  </span>
                </div>
                {isSignUp && (
                  <div className="relative">
                    <label className="block text-sm text-[var(--textColor2)]">
                      Confirm Password
                    </label>
                    <input
                      name="confirm_password"
                      type={!passVisible2 ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 bg-[var(--backgroundColor)] rounded-lg text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                      required
                    />
                    <span
                      className="absolute right-2 top-7 z-1"
                      onClick={toggleEye2}
                    >
                      {!passVisible2 ? (
                        <IoEye className="text-3xl text-[var(--textColor2)]" />
                      ) : (
                        <IoEyeOff className="text-3xl text-[var(--textColor2)]" />
                      )}
                    </span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[var(--primaryColor)] rounded-lg text-[var(--textColor3)] hover:bg-[var(--primary1)] transition duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? (isSignUp ? "Signing Up..." : "Logging In...")
                    : (isSignUp ? "Sign Up" : "Log In")}
                </button>
              </form>
              {errorMessage && (
                <p className="text-[var(--primaryColor)] mt-4 text-center">
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p className="text-green-500 mt-4 text-center font-semibold">
                  {successMessage}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="text-center mt-6">
            <p className="text-sm text-[var(--textColor2)]">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={toggleMode}
                className="text-[var(--primaryColor)] hover:underline ml-2 font-semibold"
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginSignup;
