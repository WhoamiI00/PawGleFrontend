"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaInstagram, FaYoutube, FaDiscord, FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[var(--background2)] shadow w-full py-8 relative z-100 mb-0">
      <div className="w-full mx-auto max-w-screen-xl px-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-[var(--textColor)] sm:text-center">
          © 2025{" "}
          <Link href="/" className="hover:underline text-[var(--primaryColor)]">
            PawGle™
          </Link>
          . All Rights Reserved.
        </span>
        <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-[var(--secondaryColor2)] sm:mt-0">
          <li>
            <Link href="/privacy" className="hover:underline me-4 md:me-6">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </li>
        </ul>
        <div className="flex space-x-4 mt-3 md:mt-0">
          <Link
            href="https://www.instagram.com"
            target="_blank"
            className="text-[var(--secondaryColor2)] hover:text-[var(--primaryColor)] transition duration-300"
          >
            <FaInstagram size={20} />
          </Link>
          <Link
            href="https://www.youtube.com"
            target="_blank"
            className="text-[var(--secondaryColor2)] hover:text-[var(--primaryColor)] transition duration-300"
          >
            <FaYoutube size={20} />
          </Link>
          <Link
            href="https://discord.com"
            target="_blank"
            className="text-[var(--secondaryColor2)] hover:text-[var(--primaryColor)] transition duration-300"
          >
            <FaDiscord size={20} />
          </Link>
          <Link
            href="https://www.facebook.com"
            target="_blank"
            className="text-[var(--secondaryColor2)] hover:text-[var(--primaryColor)] transition duration-300"
          >
            <FaFacebook size={20} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
