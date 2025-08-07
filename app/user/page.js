"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CirclesBackground from "@/components/background";
import Link from "next/link";
import { CiEdit } from "react-icons/ci";
import Image from "next/image";

const User = () => {
  const [owner, setOwner] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);

  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BACKEND_API_PORT}/api/auth/profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setOwner(data.user);
        setPets(data.pets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    setWindowWidth(document.body.scrollHeight);
  }, []);

  const deletePet = async (petId) => {
    try {
      const response = await fetch(
        `${BACKEND_API_PORT}/api/auth/pets/${petId}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete pet");
      }

      setPets(pets.filter((pet) => pet.id !== petId));
    } catch (err) {
      setError(err.message);
    }
  };

  const reportPet = async (petId, petData) => {
    localStorage.setItem("petReportData", JSON.stringify(petData));
    window.location.href = "/pet/report";
  };

  const editPet = async (petId, petData) => {
    localStorage.setItem("petEditData", JSON.stringify(petData));
    window.location.href = "/user/edit";
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );

  return (
    <>
      <CirclesBackground height={windowWidth} />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
        <main className="flex flex-col md:flex-row p-6 space-x-0 md:space-x-6 mt-20">
          <div className="w-full md:w-1/4 p-4 rounded-lg shadow-lg mb-6 md:mb-0 h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)] z-10">
            <h2 className="text-xl font-semibold mb-4">Recent Data</h2>
            <ul className="space-y-4">
              <li className="p-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)]">
                <strong>Recent Update:</strong> {pets[0]?.name || "N/A"}
                <div>
                  Weight: {pets[0]?.additionalInfo?.weight || "N/A"} <br />
                  Height: {pets[0]?.additionalInfo?.height || "N/A"} <br />
                  Sub Notes:{" "}
                  {pets[0]?.additionalInfo?.subNotes?.join(", ") || "N/A"}
                </div>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-3/4 p-6 rounded-lg shadow-lg relative h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)]">
            <div className="flex items-center mb-6">
              <Image
                src="/profile.jpg"
                width={150}
                height={150}
                alt="Profile"
                className="rounded-full w-24 h-24 border-2 border-[var(--textColor)]"
              />
              <div className="ml-4">
                <h1 className="text-2xl font-bold">
                  {owner?.username || "Loading..."}
                </h1>
                <p>{owner?.email || ""}</p>
                <p className="mt-1">Some bio about the pet owner goes here.</p>
              </div>
            </div>
            <Link
              href="/user/update"
              className="absolute right-6 py-2 px-4 rounded-lg shadow-lg transition duration-200 text-[var(--textColor3)] bg-[var(--primaryColor)] hover:scale-105 hover:bg-[var(--primary1)] hover:text-[var(--textColor)]"
            >
              Add Pet
            </Link>
            <Link
              href="/user/search"
              className="absolute right-32 py-2 px-4 rounded-lg shadow-lg transition duration-200 text-[var(--textColor3)] bg-[var(--primary1)] hover:scale-105 hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
            >
              Search Pet
            </Link>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Pets Registered</h2>
              {pets.length > 0 ? (
                <ul className="space-y-4">
                  {pets.map((pet) => (
                    <div key={pet.id}>
                      {pet.features.length > 0 ? (
                        <li
                          key={pet.id}
                          className="p-4 rounded-lg relative text-[var(--textColor)] bg-[var(--background2)]"
                        >
                          {console.log(pet)}
                          <div>Name: {pet.name}</div>
                          <div>Type: {pet.type}</div>
                          <div>Breed: {pet.breed}</div>
                          <div>Category: {pet.category}</div>
                          <div>Is Public: {pet.isPublic ? "Yes" : "No"}</div>
                          <div>
                            Weight: {pet.additionalInfo?.weight || "N/A"} <br />
                            Height: {pet.additionalInfo?.height || "N/A"} <br />
                            Sub Notes:{" "}
                            {pet.additionalInfo?.subNotes?.join(", ") || "N/A"}
                          </div>
                          {pet.images?.length > 0 && (
                            <div className="mt-2 absolute top-0 right-4">
                              <Image
                                src={`${BACKEND_API_PORT}/media/${pet.images}`}
                                alt="Pet"
                                width={100}
                                height={100}
                                className="w-32 h-32 object-cover rounded-lg shadow-lg"
                              />
                            </div>
                          )}
                          <div className="flex w-fit absolute right-2 bottom-4 justify-end space-x-4">
                            <button
                              onClick={() => editPet(pet.id, pet)}
                              className="flex items-center py-2 px-4 rounded-lg transition duration-200 hover:scale-105 hover:bg-[var(--primary1)] hover:text-[var(--textColor)] bg-[var(--primaryColor)] text-[var(--textColor3)]"
                            >
                              <CiEdit className="mr-2" /> Edit
                            </button>
                            <button
                              onClick={() => deletePet(pet.id)}
                              className="py-2 px-4 rounded-lg shadow-lg transition duration-200 hover:scale-105 hover:bg-[var(--c4)] hover:text-[var(--textColor)] bg-[var(--c2)] text-[var(--textColor3)]"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => reportPet(pet.id, pet)}
                              className="py-2 px-4 rounded-lg shadow-lg transition duration-200 hover:scale-105 hover:bg-[var(--c4)] hover:text-[var(--textColor)] bg-[var(--c2)] text-[var(--textColor3)]"
                            >
                              Report
                            </button>
                          </div>
                        </li>
                      ) : (
                        <></>
                      )}
                    </div>
                  ))}
                </ul>
              ) : (
                <div>
                  <p>No Pets Registered</p>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Activities</h2>
              <div className="p-4 rounded-lg text-[var(--textColor)] bg-[var(--background2)]">
                <p>No recent activity found.</p>
                <div className="h-32 mt-2 rounded-lg text-[var(--textColor)] bg-[var(--c3)]"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default User;
