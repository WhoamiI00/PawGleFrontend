"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";


export function ImageGrid({ category }) {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState();
  const filteredPets = pets.filter((pet) => pet.type === category);

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
    
  );
}
