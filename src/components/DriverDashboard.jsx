
import { useEffect, useState ,useRef} from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { socket } from "../services/socket";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { logout } from "../store/authSlice";
import { apiUrl } from "../services/api.js";
import RideMap from "./RideMap";

export default function DriverDashboard() {
  const driver = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [request, setRequest] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripRoute, setTripRoute] = useState({ pickupLoc: null, dropLoc: null });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const latestLocationRef=useRef(null)
  const toMapPoint = (coords) => {
    if (!coords || !Array.isArray(coords.coordinates) || coords.coordinates.length < 2) {
      return null;
    }

    const [lng, lat] = coords.coordinates;
    return { lat, lng };
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onRideRequest = (data) => {
      setRequest(data);
      setTripRoute({
        pickupLoc: toMapPoint(data?.pickupLocation),
        dropLoc: toMapPoint(data?.dropLocation),
      });
      setMessage("New ride request received.");
    };

    const onRideTaken = () => {
      setRequest(null);
      setMessage("This ride was accepted by another driver.");
    };

    const onAcceptanceSuccess = (data) => {
      setRequest(null);
      setLoading(false);
      const acceptedTrip = {
        tripId: data.tripId,
        status: "ACCEPTED",
        fare: request?.fare ?? 0,
        distance: request?.distance ?? 0,
        duration: request?.duration || "—",
        pickupLocation: request?.pickupLocation,
        dropLocation: request?.dropLocation,
      };
      setActiveTrip(acceptedTrip);
      setTripRoute({
        pickupLoc: toMapPoint(request?.pickupLocation),
        dropLoc: toMapPoint(request?.dropLocation),
      });
      setMessage("Ride accepted successfully.");
    };

    const onRideStarted = (data) => {
      if (!data?.tripId) return;
      setActiveTrip((current) => ({
        ...(current || {}),
        tripId: data.tripId,
        status: data.status || "STARTED",
        fare: data.fare ?? current?.fare,
        distance: data.distance ?? current?.distance,
        duration: data.duration ?? current?.duration,
        pickupLocation: data.pickupLocation ?? current?.pickupLocation,
        dropLocation: data.dropLocation ?? current?.dropLocation,
      }));
      setTripRoute({
        pickupLoc: toMapPoint(data?.pickupLocation),
        dropLoc: toMapPoint(data?.dropLocation),
      });
      setMessage("Ride started.");
    };

    const onRideCompleted = (data) => {
      if (!data?.tripId) return;
      setActiveTrip((current) => ({
        ...(current || {}),
        tripId: data.tripId,
        status: "COMPLETED",
        fare: data.fare ?? current?.fare,
        distance: data.distance ?? current?.distance,
        duration: data.duration ?? current?.duration,
      }));
      setMessage("Ride completed.");
    };

    const onAcceptanceError = (data) => {
      setLoading(false);
      setMessage(data?.message || "Could not accept this ride.");
    };

    socket.on("ride_request", onRideRequest);
    socket.on("ride_request_taken", onRideTaken);
    socket.on("ride_acceptance_success", onAcceptanceSuccess);
    socket.on("ride_started", onRideStarted);
    socket.on("ride_completed", onRideCompleted);
    socket.on("accept_ride_error", onAcceptanceError);

    return () => {
      socket.off("ride_request", onRideRequest);
      socket.off("ride_request_taken", onRideTaken);
      socket.off("ride_acceptance_success", onAcceptanceSuccess);
      socket.off("ride_started", onRideStarted);
      socket.off("ride_completed", onRideCompleted);
      socket.off("accept_ride_error", onAcceptanceError);
    };
  }, [request]);

  useEffect(() => {
    if (!isOnline || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setLocation(nextLocation);

        // Match this payload to your backend's current_location handler.
        socket.emit("current_location", nextLocation);
      },
      (err) => {
        setMessage(
          err.code === 1
            ? "Allow location access to go online."
            : "Unable to get your location. Please try again."
        );
        setIsOnline(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

  function toggleOnline() {
    if (!isOnline) {
      if (!navigator.geolocation) {
        setMessage("Geolocation is not supported by this browser.");
        return;
      }

      setMessage("Getting your location...");
    } else {
      setMessage("You are offline.");
    }

    setIsOnline((previous) => !previous);
  }

  function acceptRide() {
    if (!request?.requestId || loading) return;

    setLoading(true);
    setMessage("Accepting ride...");

    socket.emit("accept_ride", {
      requestId: request.requestId,
    });
  }

  function declineRide() {
    // Remove locally for now. Add a backend decline event if supported.
    setRequest(null);
    setMessage("Request dismissed.");
  }

  async function startTrip() {
    if (!activeTrip?.tripId) return;

    try {
      setLoading(true);
      setMessage("Starting ride...");
      const response = await axios.post(
        apiUrl(`trip/start-ride/${activeTrip.tripId}`),
        {},
        { withCredentials: true }
      );
      const trip = response.data?.data;
      setActiveTrip((current) => ({
        ...(current || {}),
        tripId: trip?.tripId || current?.tripId,
        fare: trip?.fare ?? current?.fare,
        distance: trip?.distance ?? current?.distance,
        duration: trip?.duration ?? current?.duration,
        pickupLocation: trip?.pickupLocation ?? current?.pickupLocation,
        dropLocation: trip?.dropLocation ?? current?.dropLocation,
        status: trip?.status || "STARTED",
      }));
      setTripRoute({
        pickupLoc: toMapPoint(trip?.pickupLocation),
        dropLoc: toMapPoint(trip?.dropLocation),
      });
      setLoading(false);
      setMessage("Ride started.");
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.message || "Unable to start this ride.");
    }
  }

  async function completeTrip() {
    if (!activeTrip?.tripId) return;

    try {
      setLoading(true);
      setMessage("Completing ride...");
      await axios.post(
        apiUrl(`trip/complete-ride/${activeTrip.tripId}`),
        {},
        { withCredentials: true }
      );
      setActiveTrip((current) => ({
        ...(current || {}),
        status: "COMPLETED",
      }));
      setLoading(false);
      setMessage("Ride completed.");
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.message || "Unable to complete this ride.");
    }
  }

  async function logoutDriver() {
    try {
      await axios.post(
        apiUrl("driver/logout"),
        {},
        { withCredentials: true }
      );
      dispatch(logout());
      localStorage.removeItem("role");
      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not log out. Please try again.");
    }
  }

  const mapPickupLoc = tripRoute.pickupLoc;
  const mapDropLoc = tripRoute.dropLoc;
  const mapDriverLoc = location ? { lat: location.latitude, lng: location.longitude } : null;

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[260px] w-full">
            <RideMap
              userLocation={mapDriverLoc}
              pickupLoc={mapPickupLoc}
              dropLoc={mapDropLoc}
              driverLocation={mapDriverLoc}
            />
          </div>
        </div>

        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              DRIVER PORTAL
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Driver Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your availability and ride requests.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              isOnline
                ? "bg-green-100 text-green-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </header>

        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3" aria-label="Driver account">
          <span className="text-sm font-semibold text-slate-700">{driver?.fullName || "Driver account"}</span>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link className="text-emerald-700 hover:text-emerald-500" to="/profile">My profile</Link>
            <Link className="text-emerald-700 hover:text-emerald-500" to="/ride-history">Ride history</Link>
            <button type="button" onClick={logoutDriver} className="text-red-400 hover:text-red-300">Log out</button>
          </div>
        </nav>

        {/* Availability */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">
                Your availability
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isOnline
                  ? "Your location is being shared while you are online."
                  : "Go online to receive nearby ride requests."}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleOnline}
              className={`rounded-xl px-5 py-3 font-semibold text-white transition ${
                isOnline
                  ? "bg-slate-700 hover:bg-slate-800"
                  : "bg-blue-900 hover:bg-blue-800"
              }`}
            >
              {isOnline ? "Go offline" : "Go online"}
            </button>
          </div>

          {location && (
            <p className="mt-3 text-xs text-slate-500">
              GPS: {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </p>
          )}
        </section>

        {/* Status message */}
        {message && (
          <div
            role="status"
            className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800"
          >
            {message}
          </div>
        )}

        {/* Incoming request */}
        {request && (
          <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Incoming request
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  New ride nearby
                </h2>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold capitalize text-blue-800">
                {request.rideType || "Ride"}
              </span>
            </div>

            <div className="my-5 space-y-4">
              <div className="flex gap-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-green-500" />
                <div>
                  <p className="text-xs text-slate-500">Pickup</p>
                  <p className="text-sm font-medium text-slate-900">
                    {request.pickupAddress ||
                      request.pickupLocation?.address ||
                      (request.pickupLocation?.coordinates
                        ? request.pickupLocation.coordinates.join(", ")
                        : "Pickup location")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-red-500" />
                <div>
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="text-sm font-medium text-slate-900">
                    {request.dropAddress ||
                      request.dropLocation?.address ||
                      (request.dropLocation?.coordinates
                        ? request.dropLocation.coordinates.join(", ")
                        : "Drop location")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Distance</p>
                <p className="mt-1 font-bold text-slate-900">
                  {request.distance != null
                    ? `${request.distance} km`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="mt-1 font-bold text-slate-900">
                  {request.duration || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fare</p>
                <p className="mt-1 font-bold text-slate-900">
                  {request.fare != null ? `₹${request.fare}` : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={acceptRide}
                disabled={loading || !isOnline}
                className="rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Accepting..." : "Accept ride"}
              </button>

              <button
                type="button"
                onClick={declineRide}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* Active trip */}
        {activeTrip && (
          <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeTrip.status === "COMPLETED"
                    ? "Ride completed"
                    : activeTrip.status === "STARTED"
                      ? "Ride in progress"
                      : "Ride accepted"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {activeTrip.status === "STARTED"
                    ? "Your trip is moving. Keep sharing your location."
                    : "Your trip has been accepted. Continue sharing your GPS location."}
                </p>
              </div>

              <div className="flex gap-2 text-sm">
                <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">₹{activeTrip.fare ?? "—"}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{activeTrip.distance ?? "—"} km</span>
              </div>
            </div>

            {activeTrip.tripId && (
              <p className="mt-3 break-all text-xs text-slate-500">
                Trip ID: {activeTrip.tripId}
              </p>
            )}

            {activeTrip.status !== "COMPLETED" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {activeTrip.status !== "STARTED" ? (
                  <button
                    type="button"
                    onClick={startTrip}
                    disabled={loading || !isOnline}
                    className="rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Starting..." : "Start ride"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={completeTrip}
                    disabled={loading}
                    className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Completing..." : "Complete ride"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTrip(null)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
    </APIProvider>
  );
}
