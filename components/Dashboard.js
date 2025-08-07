"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MdOutlineClose } from "react-icons/md";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

const categories = [
  { id: "Dogs", name: "Dogs" },
  { id: "Cats", name: "Cats" },
];

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [pets, setPets] = useState([]);
  const [owner, setOwner] = useState();
  const [selectedPet, setSelectedPet] = useState();
  const filteredPets = pets.filter((pet) => pet.type === selectedCategory);

  useEffect(() => {
    const fetchPets = async () => {
      const response = await fetch(`${BACKEND_URL}/api/auth/dashboard/pets/`);
      if (response.ok) {
        const data = await response.json();
        setPets(data);
      } else {
        console.error("Failed to fetch public pets");
      }
    };

    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      const fetchUser = async () => {
        const response = await fetch(
          `${BACKEND_URL}/api/auth/get-username/${selectedPet.owner}/`
        );
        if (response.ok) {
          const data = await response.json();
          setOwner(data.username);
        } else {
          console.error("Failed to fetch owner details");
        }
      };
      fetchUser();
    }
  }, [selectedPet]);

  useEffect(() => {
    if (selectedPet) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup in case component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedPet]);

  return (
    <div
      className={`dark bg-[--c3] text-white min-h-screen ${
        selectedPet ? "overflow-hidden" : ""
      }`}
    >
      <div className="flex overflow-hidden pt-24">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <div
          className="mx-3 px-1 py-6 rounded-xl backdrop-blur-xl testt w-full h-[82vh] border border-[var(--secondaryColor2)]"
          id="kurumi"
        >
          <main className="flex-1 px-2 overflow-y-auto h-[76vh] scroll-smooth bg-[var(--background)] z-10">
            <h1 className="text-3xl font-bold mb-6 text-[var(--secondaryColor)]">
              <span className="underline">
                {categories.find((cat) => cat.id === selectedCategory)?.name}
              </span>{" "}
              <span className="underline">Images</span>
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
              {filteredPets.length > 0 ? (
                filteredPets.map((pet, index) => (
                  <button key={index} onClick={() => setSelectedPet(pet)}>
                    <Card className="overflow-hidden bg-[var(--backgroundColor)] shadow-lg text-[var(--textColor)] border-none">
                      <CardContent className="p-0">
                        <Image
                          src={`${BACKEND_URL}/media/${pet.images[0]}`}
                          alt={pet.name}
                          width={250}
                          height={250}
                          className="h-[250px] object-cover"
                        />
                      </CardContent>
                    </Card>
                  </button>
                ))
              ) : (
                <p className="text-center text-[var(--textColor)]">
                  No public pets available.
                </p>
              )}
            </div>
          </main>
        </div>
        {selectedPet && (
          <div className="fixed inset-0 backdrop-blur-xl bg-opacity-80 z-[30] flex items-center justify-center">
            <div className="bg-[var(--background2)] p-6 rounded-lg text-[var(--textColor)] border border-[var(--textColor2)] w-[50%] min-w-[400px] max-w-[90vw] max-h-[90vh] overflow-y-auto relative">
              <div className="flex md:flex-row flex-col max-md:items-center w-full max-md:gap-8">
                <div className="md:mr-8 w-[70%] md:border-r border-[var(--textColor)] md:pr-8">
                  <Image
                    src={`${BACKEND_URL}/media/${selectedPet.images[0]}`}
                    alt={selectedPet.name}
                    width={320}
                    height={320}
                    className="object-contain rounded-lg"
                  />
                  <div>
                    <h2 className="text-2xl font-bold mt-4">
                      Name: {selectedPet.name}
                    </h2>
                    <p className="text-sm mt-1 text-[var(--textColor2)]">
                      Owner: {owner}
                    </p>
                    <p className="text-sm mt-1 text-[var(--textColor2)]">
                      Type: {selectedPet.type} | Breed: {selectedPet.breed}
                    </p>
                  </div>
                </div>
                <div className="w-full">
                  <div className="mt-2">
                    <h3 className="font-semibold">Additional Info:</h3>
                    <p>
                      Weight:{" "}
                      {selectedPet.additionalInfo.weight
                        ? selectedPet.additionalInfo.weight
                        : "Not Specified"}
                    </p>
                    <p>
                      Height:{" "}
                      {selectedPet.additionalInfo.height
                        ? selectedPet.additionalInfo.height
                        : "Not Specified"}
                    </p>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold">Sub Notes:</h3>
                    {selectedPet.additionalInfo.subNotes.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {selectedPet.additionalInfo.subNotes.map(
                          (note, idx) => (
                            <li key={idx}>{note}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No sub-notes.</p>
                    )}
                  </div>
                </div>
              </div>
              {/* You can add more pet details here */}
              <button
                className="fixed right-2 top-2 bg-[var(--c4)] hover:scale-110 active:scale-95 transition duration-75 ease-in-out text-[var(--textColor3)] px-2 py-2 rounded-full"
                onClick={() => setSelectedPet(null)}
              >
                <MdOutlineClose />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
