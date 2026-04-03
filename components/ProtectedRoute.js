"use client";
import { jwtDecode } from "jwt-decode";
import api from "@/app/api/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const router = useRouter();
  const ACCESS_TOKEN = "accessToken";
  const REFRESH_TOKEN = "refreshToken";

  useEffect(() => {
    auth().catch(() => setIsAuthorized(false));
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error(error);
      setIsAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
      await refreshToken();
    } else {
      setIsAuthorized(true);
    }
  };

  // Move the redirect logic into a useEffect to avoid re-triggering during render
  useEffect(() => {
    if (isAuthorized === false) {
      router.push("/");
    }
  }, [isAuthorized, router]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : null; // Don't render children if not authorized
}

export default ProtectedRoute;
