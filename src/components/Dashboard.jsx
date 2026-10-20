
import { useState, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import LocationInput from "./LocationInput";
import RideMap from "./RideMap";
import { socket } from "../services/socket";
import axios from "axios"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { logout } from "../store/authSlice"
import { apiUrl } from "../services/api.js";

function getErrorMessage(error, fallback) {
    const message = error?.response?.data?.message || error?.message;
    return typeof message === "string" && message.trim()
        ? message
        : fallback;
}

export default function Dashboard() {
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState("");
    const [pickupLoc,setPickupLoc]=useState(null)
    const [dropLoc,setDropLoc]=useState(null)
    const [searchingRide,setSearchingRide]=useState(false)
    const [activeTrip, setActiveTrip] = useState(null);
    
    const [rideType, setRideType] = useState("bike");
    function handlePickupSelect(location){
       
            setPickupLoc(location)
        
    }

    function handleDropSelect(location){
  
            setDropLoc(location)
        
    }
    
    const bookRide = async () => {
        setError("");

        if (!pickupLoc || !dropLoc) {
            setError("Please select both pickup and drop locations.");
            return;
        }

        try {
            setSearchingRide(true);
            setTripId(null);
            setDriverLocation(null);

            const pickupLocation = {
                type: "Point",
                coordinates: [pickupLoc.lng, pickupLoc.lat],
            };

            const dropLocation = {
                type: "Point",
                coordinates: [dropLoc.lng, dropLoc.lat],
            };

            const response = await axios.post(
                apiUrl("trip/book-ride"),
                {
                    pickupLocation,
                    dropLocation,
                    pickupAddress: pickupLoc.address,
                    dropAddress: dropLoc.address,
                    rideType
                },
                { withCredentials: true }
            );

            const id = response.data?.data?.requestId ?? response.data?.message?.requestId;

            if (!id) {
                throw new Error("No request ID returned by the server.");
            }

            setRequestId(id);
        } catch (err) {
            setSearchingRide(false);
            if (err.response?.status === 401) {
                setError("Your session is no longer valid. Please sign in again.");
                dispatch(logout());
                localStorage.removeItem("role");
                socket.disconnect();
                navigate("/login?role=rider", { replace: true });
                return;
            }
            setError(getErrorMessage(err, "Failed to request a ride."));
        }
    };


    
const getUserLocation = () => {
  if (!navigator.geolocation) {
    setError("Your browser does not support location access.");
    return;
  }

  setError("Detecting your location...");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const location = {
        lat: coords.latitude,
        lng: coords.longitude,
      };

      // Update the map marker and map center
      setUserLocation(location);

      try {
        // Convert coordinates into a readable address
        const params = new URLSearchParams({
          lat: String(location.lat),
          lon: String(location.lng),
        });

        const response = await fetch(
          `https://photon.komoot.io/reverse?${params}`
        );

        if (!response.ok) {
          throw new Error("Address lookup failed");
        }

        const data = await response.json();
        const place = data.features?.[0]?.properties;

        const address = place
          ? [
              place.name,
              place.street,
              place.locality,
              place.city,
              place.state,
            ]
              .filter(Boolean)
              .filter((value, index, array) => array.indexOf(value) === index)
              .join(", ")
          : "";

        if (!address) {
          setError("Location found, but its address could not be determined.");
          return;
        }

        // Fill the pickup field
        setPickupLoc({
          ...location,
          address,
        });

        setError("");
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        setError(
          "Your coordinates were found, but the address lookup failed. Please select a pickup address manually."
        );
      }
    },
    (err) => {
      setError(
        err.code === 1
          ? "Please allow location access in your browser."
          : err.code === 3
            ? "Location request timed out. Please try again."
            : "Unable to detect your location."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};



async function logoutHandler() {
        try {
            const accountType = localStorage.getItem("role") === "driver" ? "driver" : "user";
            await axios.post(
                apiUrl(`${accountType}/logout`),
                {},
                { withCredentials: true }
            );
            dispatch(logout());
            localStorage.removeItem("role");
            navigate("/");
        } catch (logoutError) {
            setError(getErrorMessage(logoutError, "Could not log out. Please try again."));
        }
}

const [requestId, setRequestId] = useState(null);
const [tripId, setTripId] = useState(null);
const [driverLocation, setDriverLocation] = useState(null);

const handleCompleteTrip = async () => {
    if (!activeTrip?.tripId) return;

    try {
        await axios.post(
            apiUrl(`trip/complete-ride/${activeTrip.tripId}`),
            {},
            { withCredentials: true }
        );
        setActiveTrip((current) => ({ ...current, status: "COMPLETED" }));
    } catch (err) {
        setError(err.response?.data?.message || "Could not complete this ride.");
    }
};
useEffect(() => {
    // Connect only once for this mounted dashboard.
    if (!socket.connected) {
        socket.connect();
    }

    const onRideAccepted = (data) => {
    console.log("Ride accepted event received:", data);
    console.log("Current request ID:", requestId);

    if (!data?.tripId) {
        console.error("ride_accepted event has no tripId");
        return;
    }

    if (requestId && data.requestId !== requestId) {
        console.error("Request ID mismatch", {
            expected: requestId,
            received: data.requestId,
        });
        return;
    }

    const acceptedTrip = {
        tripId: data.tripId,
        fare: data.fare ?? 0,
        status: data.status || "ACCEPTED",
        pickupLocation: data.pickupLocation ?? pickupLoc,
        dropLocation: data.dropLocation ?? dropLoc,
        distance: data.distance ?? 0,
        duration: data.duration || "—",
    };

    setSearchingRide(false);
    setTripId(data.tripId);
    setActiveTrip(acceptedTrip);
    setError("");

    socket.emit("join_trip", {
        tripId: data.tripId,
    },[requestId,pickupLoc,dropLoc]);
};

    const onRideStarted = (data) => {
        if (!data?.tripId) return;
        setActiveTrip((current) => ({
            ...(current || {}),
            tripId: data.tripId,
            fare: data.fare ?? current?.fare,
            distance: data.distance ?? current?.distance,
            duration: data.duration ?? current?.duration,
            pickupLocation: data.pickupLocation ?? current?.pickupLocation ?? pickupLoc,
            dropLocation: data.dropLocation ?? current?.dropLocation ?? dropLoc,
            status: data.status || "STARTED",
        }));
        setTripId(data.tripId);
        setError("");
    };

    const onRideCompleted = (data) => {
        if (!data?.tripId) return;
        setActiveTrip((current) => ({
            ...(current || {}),
            tripId: data.tripId,
            status: "COMPLETED",
            fare: data.fare ?? current?.fare,
        }));
        setTripId(data.tripId);
        setError("");
    };

    const onRideUnavailable = (data) => {
        setSearchingRide(false);
        setError(getErrorMessage(data, "No driver accepted your ride."));
    };

    const onRideAcceptedError = (data) => {
        setSearchingRide(false);
        setError(getErrorMessage(data, "Ride acceptance failed."));
    };

    const onDriverLocation = (data) => {
        setDriverLocation({
            lat: data.latitude,
            lng: data.longitude,
        });
    };

    socket.on("ride_accepted", onRideAccepted);
    socket.on("ride_started", onRideStarted);
    socket.on("ride_completed", onRideCompleted);
    socket.on("ride_unavailable", onRideUnavailable);
    socket.on("accept_ride_error", onRideAcceptedError);
    socket.on("driver_location", onDriverLocation);

    return () => {
        socket.off("ride_accepted", onRideAccepted);
        socket.off("ride_started", onRideStarted);
        socket.off("ride_completed", onRideCompleted);
        socket.off("ride_unavailable", onRideUnavailable);
        socket.off("accept_ride_error", onRideAcceptedError);
        socket.off("driver_location", onDriverLocation);

        // Don't disconnect here if other app pages share this socket.
    };
}, []);


    
        

   

return (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <div className="relative flex min-h-screen flex-col overflow-y-auto border-t border-slate-200 bg-white px-5 py-5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:px-8">

      {/* Upper section: Map */}
      <div className="relative h-[55vh] min-h-[350px] w-full shrink-0">
        <RideMap userLocation={userLocation}
            pickupLoc={pickupLoc}
            dropLoc={dropLoc}
            driverLocation={tripId?driverLocation:null}
        />
        
      {/* Profile menu */}
      <div className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6">
        <button
          onClick={() => setProfileOpen((open) => !open)}
          aria-label="Open profile menu"
          aria-expanded={profileOpen}
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-900 text-lg font-bold text-white shadow-lg transition hover:bg-blue-800"
        >
          {(user?.fullName || "U")
            .charAt(0)
            .toUpperCase()}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            {/* User details */}
            <div className="border-b border-slate-100 px-4 py-4">
              <p className="truncate font-semibold text-slate-900">
                {user?.fullName || "User"}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user?.email || "No email available"}
              </p>
            </div>

            <div className="p-2">
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span aria-hidden="true">◉</span>
                My Profile
              </Link>

              <Link
                to="/ride-history"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span aria-hidden="true">↻</span>
                Ride History
              </Link>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logoutHandler();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <span aria-hidden="true">↪</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>


        {/* Current location button */}
        <div className="absolute left-4 top-4 z-10">
          <button
            onClick={getUserLocation}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg transition hover:bg-slate-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              <circle cx="12" cy="12" r="8" />
            </svg>
            My location
          </button>
        </div>
      </div>
        
{activeTrip && (
  <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl">
          <span aria-hidden="true">🚕</span>
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {activeTrip.status === "COMPLETED"
              ? "Ride completed"
              : activeTrip.status === "STARTED"
                ? "Ride in progress"
                : "Your driver has accepted!"}
          </p>
          <p className="text-sm text-slate-600">
            {activeTrip.status === "STARTED"
              ? "Your trip is live. Follow the route on the map."
              : "Track your driver on the map."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-white px-2.5 py-1 text-slate-700">₹{activeTrip.fare || "—"}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-slate-700">{activeTrip.distance || "—"} km</span>
      </div>
    </div>

    {(activeTrip.status === "STARTED" || activeTrip.status === "ACCEPTED") && (
      <div className="mt-3 grid gap-2 rounded-xl border border-blue-200 bg-white p-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4">
          <span>Route</span>
          <span className="font-semibold text-slate-900">Active</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>ETA</span>
          <span className="font-semibold text-slate-900">{activeTrip.duration || "—"}</span>
        </div>
      </div>
    )}

    {activeTrip.status === "STARTED" && (
      <button
        type="button"
        onClick={handleCompleteTrip}
        className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
      >
        Complete ride
      </button>
    )}
  </div>
)}

      {/* Lower section: Booking panel */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:px-8">

        <div className="mx-auto max-w-2xl">

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Your next journey
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Where to?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose your pickup and destination.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <LocationInput
              label="Pickup location"
              placeholder="Enter pickup address"
              value={pickupLoc?.address || ""}
              onLocationSelect={handlePickupSelect}
            />

            <LocationInput
              label="Drop location"
              placeholder="Where are you going?"
              value={dropLoc?.address || ""}
              onLocationSelect={handleDropSelect}
            />
            
{/* Ride type selector */}
<div className="mt-5">
  <label className="mb-3 block text-sm font-semibold text-slate-700">
    Choose your ride
  </label>

  <div className="grid grid-cols-3 gap-3">
    {[
      {
        id: "bike",
        name: "Bike",
        description: "Quick & affordable",
        icon: "🏍️",
      },
      {
        id: "auto",
        name: "Auto",
        description: "For short trips",
        icon: "🛺",
      },
      {
        id: "car",
        name: "Car",
        description: "Comfortable ride",
        icon: "🚗",
      },
    ].map((ride) => (
      <button
        key={ride.id}
        type="button"
        onClick={() => setRideType(ride.id)}
        aria-pressed={rideType === ride.id}
        className={`rounded-xl border p-3 text-center transition duration-200 ${
          rideType === ride.id
            ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100"
            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        <span className="block text-2xl">{ride.icon}</span>

        <span className="mt-1 block text-sm font-bold text-slate-900">
          {ride.name}
        </span>

        <span className="mt-1 block text-xs text-slate-500">
          {ride.description}
        </span>
      </button>
    ))}
  </div>
</div>


          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={bookRide}
            disabled={searchingRide}
            className="mt-4 w-full rounded-xl bg-blue-900 px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchingRide ? "Finding your ride..." : "Find a ride"}
          </button>

          {searchingRide && (
            <p className="mt-2 text-center text-sm text-slate-500">
              Looking for nearby drivers...
            </p>
          )}

        </div>
      </div>

    </div>
  </APIProvider>
);

}
