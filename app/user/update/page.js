"use client";

import React, { useState, useEffect } from "react";
import Footer from "@/components/footer";
import CirclesBackground from "@/components/background";
import { animalBreeds, animalCategories } from "@/components/AnimalTypes";

export default function AddPetForm() {
  const [pet, setPet] = useState({
    name: "",
    category: "Domestic",
    type: "",
    breed: "",
    images: [], // Single image field
    features: [], // For extracted features
    isPublic: false,
    additionalInfo: {
      weight: "",
      height: "",
      subNotes: [],
    },
    subNote: "", // Temporary value for the sub-note input
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false); // To toggle the additional info section
  const [backgroundHeight, setBackgroundHeight] = useState("auto");

  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  useEffect(() => {
    setBackgroundHeight(window.innerHeight);
  }, []);

  const handleChange = (field, value) => {
    if (field === "additionalInfo") {
      setPet({ ...pet, additionalInfo: value });
    } else {
      setPet({ ...pet, [field]: value });
    }
  };

  const handleFileChange = (files) => {
    if (files.length > 0) {
      setPet({ ...pet, images: [files[0]] }); // Store only the first file
    }
  };

  const togglePublic = () => {
    setPet({ ...pet, isPublic: !pet.isPublic });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    const formData = new FormData();
    formData.append("name", pet.name);
    formData.append("category", pet.category);
    formData.append("type", pet.type);
    formData.append("breed", pet.breed);
    formData.append("isPublic", pet.isPublic);

    // 1. Fix additionalInfo formatting
    const additionalInfo = pet.additionalInfo.subNotes
      ? { ...pet.additionalInfo } // Include existing subNotes
      : { ...pet.additionalInfo, subNotes: [] };
    formData.append("additionalInfo", JSON.stringify(additionalInfo));

    // 2. Fix images formatting (must be array)
    if (pet.images.length > 0) {
      pet.images.forEach((image) => {
        formData.append("images", image); // Use plural field name
      });
    }

    try {
      const response = await fetch(`${BACKEND_API_PORT}/api/auth/pets/add/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        const json = JSON.parse(text);
        setErrorMessage(json.error);
        console.log(errorMessage);
      } else {
        const data = await response.json();
        console.log("Pet added successfully", data);
        window.location.href = "/user";
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  return (
    <>
      <CirclesBackground height={backgroundHeight} />
      <div className="min-h-screen bg-[var(--background)] flex flex-col justify-start">
        <div className="flex mt-20 items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg w-full bg-[var(--background2)] rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transform transition-all hover:scale-105 duration-500 ease-in-out">
            <div className="px-10 py-12">
              <h1 className="text-center text-3xl font-extrabold text-[var(--textColor)] mb-6 tracking-tight hover:tracking-wide transition-all duration-300">
                Add Pet Details
              </h1>

              <form
                id="submitForm"
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Pet Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={pet.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                      placeholder="Enter pet's name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Select Animal Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={pet.type}
                      onChange={(e) => handleChange("type", e.target.value)}
                      className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                      required
                    >
                      <option value="">Select Type</option>
                      {pet.category &&
                        animalCategories[pet.category].types.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="breed"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Select Breed
                    </label>
                    <select
                      id="breed"
                      name="breed"
                      value={pet.breed}
                      onChange={(e) => handleChange("breed", e.target.value)}
                      className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                      required
                    >
                      <option value="">Select Breed</option>
                      {pet.type &&
                        animalBreeds[pet.type] &&
                        animalBreeds[pet.type].map((breed) => (
                          <option key={breed} value={breed}>
                            {breed}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="images"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Upload Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="hidden"
                      />
                      <label
                        htmlFor="images"
                        className="flex items-center justify-center px-4 py-2 bg-[var(--primaryColor)] text-[var(--textColor3)] font-bold rounded-lg cursor-pointer hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] hover:shadow-lg transition-all duration-300 ease-in-out"
                      >
                        {pet.images.length > 0
                          ? `1 file selected`
                          : "Choose File"}
                      </label>
                    </div>
                  </div>

                  {/* Toggle button to show additional info */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                      className="w-full bg-[var(--primaryColor)] text-[var(--textColor3)] p-3 rounded-lg font-bold hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] transition duration-300 ease-in-out"
                    >
                      {showAdditionalInfo
                        ? "Hide Additional Info"
                        : "Add Additional Info"}
                    </button>
                  </div>

                  {/* Additional Info fields */}
                  {showAdditionalInfo && (
                    <>
                      <div>
                        <label
                          htmlFor="weight"
                          className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                        >
                          Weight
                        </label>
                        <input
                          type="number"
                          id="weight"
                          name="weight"
                          value={pet.additionalInfo.weight}
                          onChange={(e) =>
                            handleChange("additionalInfo", {
                              ...pet.additionalInfo,
                              weight: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                          placeholder="Enter pet's weight"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="height"
                          className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                        >
                          Height
                        </label>
                        <input
                          type="number"
                          id="height"
                          name="height"
                          value={pet.additionalInfo.height}
                          onChange={(e) =>
                            handleChange("additionalInfo", {
                              ...pet.additionalInfo,
                              height: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                          placeholder="Enter pet's height"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="subNote"
                          className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                        >
                          Add Sub-Note
                        </label>
                        <input
                          type="text"
                          id="subNote"
                          name="subNote"
                          className="w-full p-3 border border-[var(--secondaryColor2)] rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] focus:border-[var(--primaryColor)] focus:ring-[var(--primaryColor)] outline-none transition duration-150 ease-in-out"
                          placeholder="Add a sub-note"
                          value={pet.subNote}
                          onChange={(e) =>
                            setPet({
                              ...pet,
                              subNote: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSubNotes = [
                              ...pet.additionalInfo.subNotes,
                              pet.subNote,
                            ];
                            setPet({
                              ...pet,
                              additionalInfo: {
                                ...pet.additionalInfo,
                                subNotes: newSubNotes,
                              },
                              subNote: "",
                            });
                          }}
                          className="w-full bg-[var(--primaryColor)] text-[var(--textColor3)] p-3 rounded-lg font-bold hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] transition duration-300 ease-in-out"
                        >
                          Add Sub-Note
                        </button>
                        <div>
                          {pet.additionalInfo.subNotes.length > 0 && (
                            <ul className="text-[var(--textColor2)] mt-2">
                              {pet.additionalInfo.subNotes.map(
                                (note, index) => (
                                  <li key={index}>{note}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label
                      htmlFor="isPublic"
                      className="block text-sm font-semibold text-[var(--textColor2)] mb-1"
                    >
                      Visibility
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublic"
                        name="isPublic"
                        checked={pet.isPublic}
                        onChange={togglePublic}
                        className="h-5 w-5 text-[var(--primaryColor)] border border-[var(--secondaryColor2)] rounded focus:ring-[var(--primaryColor)] transition duration-150 ease-in-out"
                      />
                      <label
                        htmlFor="isPublic"
                        className="ml-2 text-sm text-[var(--textColor2)]"
                      >
                        Make photos public
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-[var(--primaryColor)] text-[var(--textColor3)] p-3 rounded-lg font-bold hover:bg-[var(--primary1)] hover:text-[var(--textColor3)] transition duration-300 ease-in-out"
                  >
                    Add Pet
                  </button>
                </div>
                {errorMessage && (
                  <p className="text-red-500 text-center -mb-8">
                    {errorMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
