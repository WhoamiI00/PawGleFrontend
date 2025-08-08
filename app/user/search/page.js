"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CirclesBackground from "@/components/background";
import Image from "next/image";
import { IoShareSharp } from "react-icons/io5";
import Link from "next/link";

export default function SearchPetForm() {
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [backgroundHeight, setBackgroundHeight] = useState(0);
  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  useEffect(() => {
    setBackgroundHeight(
      Math.min(window.innerHeight, document.body.scrollHeight)
    );
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("accessToken");

    const formData = new FormData();
    // Use the first image only - backend expects "image" not "images"
    formData.append("image", files[0]);

    try {
      const response = await fetch(
        `${BACKEND_API_PORT}/api/auth/pets/search/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Error response:", text);
        alert("Failed to search for pets. Please try again.");
      } else {
        const data = await response.json();
        setMatches(data.results || []);
        setSearchPerformed(true);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to filter unique pets by pet.id, preferring those with pet_location
  function getUniqueMatches(matches) {
    const petMap = new Map();
    for (const match of matches) {
      const id = match.pet?.id;
      if (!id) {
        // If no id, just push as is (could be improved if needed)
        petMap.set(Symbol(), match);
        continue;
      }
      if (!petMap.has(id)) {
        petMap.set(id, match);
      } else {
        // Prefer match with pet_location
        const existing = petMap.get(id);
        if (!existing.pet_location && match.pet_location) {
          petMap.set(id, match);
        }
      }
    }
    return Array.from(petMap.values());
  }

  return (
    <>
      <CirclesBackground height={backgroundHeight} />
      <div className="min-h-screen bg-[var(--background)] flex flex-col justify-start overflow-hidden">
        <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-auto">
          <div className="max-w-lg w-full bg-[var(--background2)] rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transform transition-all hover:scale-105 duration-500 ease-in-out">
            <div className="px-6 py-8 sm:px-10 sm:py-12">
              <h1 className="text-center text-3xl font-extrabold text-[var(--textColor)] mb-6 tracking-tight hover:tracking-wide transition-all duration-300">
                Search for a Pet
              </h1>

              <form
                id="searchForm"
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="image"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Upload Photo
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="flex items-center justify-center px-4 py-2 bg-[var(--primaryColor)] text-[var(--textColor3)] font-bold rounded-lg cursor-pointer hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] hover:shadow-lg transition-all duration-300 ease-in-out"
                      >
                        {files.length > 0
                          ? `${files.length} file(s) selected`
                          : "Choose File"}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-[var(--primaryColor)] text-[var(--textColor3)] p-3 rounded-lg font-bold hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] transition duration-300 ease-in-out"
                    disabled={isLoading}
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>

              {/* Display search results */}
              {getUniqueMatches(matches).length > 0
                ? getUniqueMatches(matches).map((match, index) => (

                  <div
                    key={match.pet.id ? `pet-${match.pet.id}` : `idx-${index}`}
                    className="p-4 bg-[var(--backgroundColor)] rounded-lg shadow-md mt-4 flex justify-between items-center"
                  >
                    <div className="details">
                      <h3 className="text-lg font-semibold text-[var(--textColor)]">
                        {match.pet.name}
                      </h3>
                      <p className="text-sm text-[var(--textColor2)]">
                        Type: {match.pet.type}
                      </p>
                      <p className="text-sm text-[var(--textColor2)]">
                        Breed: {match.pet.breed}
                      </p>
                      <p className="text-sm text-[var(--textColor2)]">
                        Similarity: {(match.similarity * 100).toFixed(2)}%
                      </p>
                      {match.pet_location && (
                        <p className="text-sm text-[var(--textColor2)] text-red-300">
                          Status: {match.pet_location.status}
                        </p>
                      )}
                      {console.log(match)}
                    </div>
                    <div className="images flex flex-col items-center gap-2">
                      {/* Show only one image: pet image if available, else pet_location image */}
                      {match.pet.images?.length > 0 ? (
                        <Image
                          width={100}
                          height={100}
                          src={`${BACKEND_API_PORT}/media/${match.pet.images[0]}`}
                          alt={`Pet image`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : match.pet_location?.image_url ? (
                        <Image
                          width={100}
                          height={100}
                          src={match.pet_location.image_url}
                          alt={`Pet image`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : null}

                      {match.pet_location && (
                        <Link
                          href="/pet/map"
                          className="mt-2 w-full text-center py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)] font-bold"
                          style={{ minWidth: "100px" }}
                          onClick={() =>
                            localStorage.setItem("selected", JSON.stringify(match.pet_location))
                          }
                        >
                          Report Pet
                        </Link>
                      )}
                    </div>
                  </div>
                ))
                : searchPerformed && (
                  <p className="text-center text-[var(--primaryColor)] font-bold bg-[var(--backgroundColor)] p-3 rounded-lg mt-4">
                    ⚠️ No similar pet found. Try again with different images.
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
