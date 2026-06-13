"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

export function ImageGrid({ category }) {
  const [pets, setPets] = useState([]);
  const filteredPets =
    category === "All"
      ? pets
      : pets.filter((pet) => pet.type === category);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
      {filteredPets.length > 0 ? (
        filteredPets.map((pet, index) => (
          <Card
            key={index}
            className="overflow-hidden bg-[var(--backgroundColor)] shadow-lg text-[var(--textColor)] border-none"
          >
            <CardContent className="p-0">
              {pet.images?.[0] ? (
                <Image
                  src={pet.images[0]}
                  alt={pet.name}
                  width={300}
                  height={250}
                  className="w-full h-[250px] object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-[250px] bg-gray-200" />
              )}
              <div className="p-3">
                <p className="font-semibold">{pet.name}</p>
                <p className="text-sm opacity-70">{pet.breed}</p>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-[var(--textColor)]">
          No public pets available.
        </p>
      )}
    </div>
  );
}
