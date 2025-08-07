"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import CirclesBackground from "@/components/background";
import Map from "@/components/Map";
import Link from "next/link";
import Image from "next/image"

export default function PetMapPage() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("all");
  const [windowWidth, setWindowWidth] = useState(0);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(5);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [locationError, setLocationError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  // Request user location permission
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = [position.coords.latitude, position.coords.longitude];
        setUserLocation(location);
        setMapCenter(location);
        setMapZoom(14);
        setLocationPermission("granted");
      },
      (error) => {
        setLocationPermission("denied");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        if (result.state === "granted") {
          requestLocationPermission();
        }
      });
    }

    const fetchPets = async () => {
      try {
        let endpoint;

        if (view === "user") {
          endpoint = `${BACKEND_API_PORT}/api/auth/user/pet-locations/`;
        } else if (view === "all") {
          endpoint = `${BACKEND_API_PORT}/api/auth/pets/locations/`;
        } else {
          endpoint = `${BACKEND_API_PORT}/api/auth/pets/${view}/locations/`;
        }

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${view} pet data`);
        }

        const data = await response.json();
        setPets(data);

        // Calculate center based on markers if available
        if (data.length > 0) {
          const validLocations = data.filter(p => p.latitude && p.longitude);
          if (validLocations.length > 0) {
            const avgLat = validLocations.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / validLocations.length;
            const avgLon = validLocations.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / validLocations.length;
            setMapCenter([avgLat, avgLon]);
            setMapZoom(12);
          }
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
    setWindowWidth(window.innerHeight);
  }, [view, BACKEND_API_PORT]);

  useEffect(() => {
    const storedPetData = localStorage.getItem("selected");
    if (storedPetData) {
      const parsedData = JSON.parse(storedPetData);
      const matchedPet = pets.find(pet => pet.id === parsedData.id);
      if (matchedPet) {
        setSelectedPet(matchedPet);
        localStorage.removeItem("selected");
      }
    }
  }, [pets])
  const MapCenterer = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center, zoom);
      }
    }, [center, zoom, map]);
    return null;
  };
  const handleResolveReport = async (locationId, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    try {
      const response = await fetch(`${BACKEND_API_PORT}/api/auth/pets/locations/${locationId}/status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      if (!response.ok) {
        throw new Error("Failed to update pet status");
      }

      // Update the local state to reflect the change
      setPets(prevPets =>
        prevPets.map(pet =>
          pet.id === locationId ? { ...pet, status: 'resolved' } : pet
        )
      );

    } catch (err) {
      console.error("Error resolving report:", err);
      alert("Failed to resolve the report. Please try again.");
    }
  };

  // Contact Modal Component
  const ContactPetOwnerModal = ({ petLocation, isOpen, onClose }) => {
    const [formData, setFormData] = useState({
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      message: "",
      image: null
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const formPayload = new FormData();
        formPayload.append('pet_location_id', petLocation.id);
        formPayload.append('message', formData.message);
        formPayload.append('contact_name', formData.contact_name);
        formPayload.append('contact_email', formData.contact_email);
        formPayload.append('contact_phone', formData.contact_phone);

        if (formData.image) {
          formPayload.append('image', formData.image);
        }

        const response = await fetch(`${BACKEND_API_PORT}/api/auth/pets/contact-owner/`, {
          method: 'POST',
          body: formPayload,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("accessToken")}`,
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send message');
        }

        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            contact_name: "",
            contact_email: "",
            contact_phone: "",
            message: "",
            image: null
          });
          setImagePreview(null);
        }, 3000);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    // Determine pet name based on whether it's linked to a registered pet
    const petName = petLocation.pet ? petLocation.pet.name : petLocation.pet_name || "Unknown Pet";

    // Determine if this is a lost or found pet
    const petStatus = petLocation.status === "lost" ? "Lost" : "Found";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[var(--backgroundColor)] p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Contact About {petStatus} Pet: {petName}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {success ? (
            <div className="p-4 mb-4 rounded-lg bg-green-600 text-white">
              Your message has been sent successfully! The person who reported this pet will be notified.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              {error && (
                <div className="p-4 mb-4 rounded-lg bg-red-600 text-white">
                  {error}
                </div>
              )}

              <div>
                <p className="mb-4">
                  Your contact information will be shared through our support team.
                  You won&apos;t see their direct contact details, and they won&apos;t see yours unless both parties agree.
                </p>
              </div>

              <div>
                <label className="block mb-1">Your Name*</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Your Email*</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Your Phone (Optional)</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                />
              </div>

              <div>
                <label className="block mb-1">Message*</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                  rows={4}
                  placeholder={petLocation.status === "lost" ?
                    "Describe where and when you saw the pet, any identifying features, etc." :
                    "Describe your pet in detail to help confirm if this is your pet"
                  }
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Attach Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                />
                {imagePreview && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <p className="text-sm mb-2">Image preview:</p>
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-40 rounded-lg"
                      height={100}
                      width={100}

                    />
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)] hover:text-[var(--textColor)]"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <CirclesBackground height={windowWidth} />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
        <main className="flex-1 p-6 mt-20">
          <div className="w-full p-6 rounded-lg shadow-lg relative bg-[var(--backgroundColor)] text-[var(--textColor)] z-10">
            <h1 className="text-2xl font-bold mb-4">Pet Location Map</h1>

            {/* Location permission banner */}
            {locationPermission === "prompt" && (
              <div className="p-4 mb-6 rounded-lg bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <p className="font-semibold">Enable location services</p>
                  <p className="text-sm">See pets near your current location</p>
                </div>
                <button
                  onClick={requestLocationPermission}
                  className="py-2 px-4 rounded-lg bg-white text-blue-600 font-medium hover:bg-gray-100"
                >
                  Allow Location
                </button>
              </div>
            )}

            {locationPermission === "denied" && (
              <div className="p-4 mb-6 rounded-lg bg-yellow-600 text-white">
                <p className="font-semibold">Location access denied</p>
                <p className="text-sm">{locationError || "Please enable location permissions in your browser settings."}</p>
                <button
                  onClick={requestLocationPermission}
                  className="mt-2 py-1 px-3 rounded bg-yellow-700 text-white text-sm hover:bg-yellow-800"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setView("all")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "all"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                All Pets
              </button>
              <button
                onClick={() => setView("lost")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "lost"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                Lost Pets
              </button>
              <button
                onClick={() => setView("found")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "found"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                Found Pets
              </button>
              <button
                onClick={() => setView("user")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "user"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                My Pets
              </button>

              {/* Center on user location button */}
              {userLocation && (
                <button
                  onClick={() => {
                    if (userLocation) {
                      setMapCenter(userLocation);
                      setMapZoom(20);
                      setMapKey(prev => prev + 1); // Force re-render
                    }
                  }}
                  className="py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)]"
                >
                  Center on My Location
                </button>
              )}

              <Link
                href="/pet/report"
                className="ml-auto py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                Report Pet
              </Link>
              <Link
                href="/user"
                className="py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                Back to Profile
              </Link>
              <Link
                href="/user/search"
                className="py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                Search Pet
              </Link>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <p>Loading map data...</p>
              </div>
            ) : error ? (
              <div className="h-96 flex items-center justify-center text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <div className="h-[60vh] bg-[var(--background2)] rounded-lg overflow-hidden">
                <Map
                  key={mapKey}
                  markers={[
                    ...pets.map(pet => ({
                      ...pet,
                      latitude: parseFloat(pet.latitude),
                      longitude: parseFloat(pet.longitude),
                      image: pet.image_url || null
                    })),
                    ...(userLocation ? [{
                      id: "user-location",
                      latitude: userLocation[0],
                      longitude: userLocation[1],
                      animal_name: "Your Location",
                      status: "user",
                      isUserLocation: true
                    }] : [])
                  ]}
                  center={mapCenter}
                  zoom={mapZoom}
                  height="100%"
                  onMarkerClick={(pet) => {
                    setSelectedPet(pet);
                  }}
                  isDark={localStorage.getItem("modeR") === "dark" ? true : false}
                >
                  <MapCenterer center={mapCenter} zoom={mapZoom} />
                </Map>


              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Location List</h2>

              {pets.length === 0 ? (
                <div className="p-4 rounded-lg bg-[var(--background2)]">
                  <p>No {view === "all" ? "pets" : view + " pets"} with location data available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="p-4 rounded-lg bg-[var(--background2)] cursor-pointer hover:bg-[var(--primary1)] transition-colors"
                      onClick={() => {
                        setMapCenter([parseFloat(pet.latitude), parseFloat(pet.longitude)]);
                        setMapZoom(16);
                        setSelectedPet(pet);
                      }}
                    >
                      <div className="flex space-x-3">
                        {pet.image_url && (
                          <div className="w-20 h-20 flex-shrink-0">
                            <Image
                              src={pet.image_url}
                              alt={pet.animal_name?pet.animal_name:'Animal'}
                              className="w-full h-full object-cover rounded-lg"
                              height={100}
                              width={100}
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="font-semibold">{pet.animal_name}</div>
                          <div>{pet.type} {pet.breed}</div>
                          <div className={`font-medium ${pet.status === 'lost' ? 'text-red-400' :
                            pet.status === 'found' ? 'text-green-400' : 'text-gray-400'
                            }`}>
                            Status: {pet.status || 'Unknown'}
                          </div>
                          <div className="text-sm mt-2">
                            {pet.last_seen_date ? `Last seen: ${pet.last_seen_date}` : ''}
                          </div>
                        </div>

                        {/* Resolve button - only show in "user" view and if not already resolved */}
                        {view === "user" && pet.status !== 'resolved' && (
                          <div className="flex items-center">
                            <button
                              onClick={(e) => handleResolveReport(pet.id, e)}
                              className="py-2 px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>
          </div>
          {selectedPet && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--backgroundColor)] p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-bold text-black">{selectedPet.animal_name}</h3>
                  <button
                    onClick={() => setSelectedPet(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {selectedPet.image_url && (
                  <div className="mb-4">
                    <Image
                      src={selectedPet.image_url}
                      alt={selectedPet.animal_name}
                      className="w-full h-auto rounded-lg object-cover"
                      height={100}
                      width={100}
                    />
                  </div>
                )}

                <div className="space-y-2 text-black">
                  <p><span className="font-semibold">Type:</span> {selectedPet.type}</p>
                  <p><span className="font-semibold">Breed:</span> {selectedPet.breed}</p>
                  <p><span className="font-semibold">Category:</span> {selectedPet.category}</p>
                  <p className={`font-medium ${selectedPet.status === 'lost' ? 'text-red-400' :
                    selectedPet.status === 'found' ? 'text-green-400' : 'text-gray-400'
                    }`}>
                    <span className="font-semibold">Status:</span> {selectedPet.status}
                  </p>
                  {selectedPet.description && (
                    <p><span className="font-semibold">Description:</span> {selectedPet.description}</p>
                  )}
                  {selectedPet.last_seen_date && (
                    <p><span className="font-semibold">Last seen:</span> {selectedPet.last_seen_date}</p>
                  )}
                  {selectedPet.status !== "resolved" ? (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setShowContactModal(true);
                        }}
                        className="w-full py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)]"
                      >
                        Contact Owner Securely
                      </button>
                    </div>
                  ) : (
                    <></>
                  )}


                </div>
              </div>
            </div>
          )}

          {showContactModal && selectedPet && (
            <ContactPetOwnerModal
              petLocation={selectedPet}
              isOpen={showContactModal}
              onClose={() => setShowContactModal(false)}
            />

          )}

        </main>
        <Footer />
      </div>
    </>
  );
}