import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../services/api.js";

function locationLabel(address, location) {
  if (address) return address;
  const coordinates = location?.coordinates;
  return Array.isArray(coordinates)
    ? coordinates.map((coordinate) => Number(coordinate).toFixed(4)).join(", ")
    : "Location unavailable";
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function RideHistory() {
  const role = localStorage.getItem("role") || "rider";
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const endpoint = role === "driver" ? "driver" : "rider";

    axios
      .get(apiUrl(`trip/${endpoint}/history`), {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (active) setRides(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((requestError) => {
        if (!active) return;

        if (requestError.response?.status === 401) {
          localStorage.removeItem("role");
          setError("Your session has expired. Please sign in again.");
          navigate(role === "driver" ? "/login?role=driver" : "/login?role=rider", { replace: true });
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Ride history could not be loaded. Please try again."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  return (
    <div className="account-page">
      <div className="account-shell">
        <header className="account-topbar">
          <Link className="account-brand" to={role === "driver" ? "/driver/dashboard" : "/"}>
            <span className="account-brand-mark">R</span>
            RideFlow
          </Link>
          <nav className="account-nav" aria-label="Account navigation">
            <Link to={role === "driver" ? "/driver/dashboard" : "/"}>Dashboard</Link>
            <Link to="/profile">My profile</Link>
          </nav>
        </header>

        <section className="account-heading">
          <p className="account-eyebrow">{role === "driver" ? "DRIVER PORTAL" : "YOUR ACCOUNT"}</p>
          <h1>Ride history</h1>
          <p>{role === "driver" ? "A record of the trips you have accepted." : "Every journey, all in one place."}</p>
        </section>

        {error && <div className="history-alert" role="alert">{error}</div>}

        {loading ? (
          <div className="history-empty" role="status">Loading your rides…</div>
        ) : !error && rides.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty-icon" aria-hidden="true">↗</span>
            <h2>Your journeys will show up here</h2>
            <p>{role === "driver" ? "Accepted trips will appear here after your first ride." : "Once you book a ride, you’ll find its details here."}</p>
            {role !== "driver" && <Link className="account-primary-button" to="/">Book a ride</Link>}
          </div>
        ) : (
          <div className="history-list">
            {rides.map((ride) => (
              <article className="history-card" key={ride._id}>
                <div className="history-card-top">
                  <time dateTime={ride.createdAt}>{formatDate(ride.createdAt)}</time>
                  <span className={`history-status status-${(ride.status || "unknown").toLowerCase()}`}>
                    {(ride.status || "Unknown").toLowerCase()}
                  </span>
                </div>
                <div className="history-route">
                  <div className="history-route-markers" aria-hidden="true">
                    <span className="pickup-marker" />
                    <span className="route-line" />
                    <span className="drop-marker" />
                  </div>
                  <div className="history-stops">
                    <div><span>Pickup</span><strong>{locationLabel(ride.pickupAddress, ride.pickupLocation)}</strong></div>
                    <div><span>Destination</span><strong>{locationLabel(ride.dropAddress, ride.dropLocation)}</strong></div>
                  </div>
                </div>
                <div className="history-meta">
                  <div><span>Distance</span><strong>{Number.isFinite(Number(ride.distance)) ? `${Number(ride.distance).toFixed(1)} km` : "—"}</strong></div>
                  <div><span>Fare</span><strong>{Number.isFinite(Number(ride.fare)) ? `₹${Number(ride.fare).toFixed(0)}` : "—"}</strong></div>
                  <div><span>{role === "driver" ? "Rider" : "Driver"}</span><strong>{role === "driver" ? ride.customer?.fullName || "Rider" : ride.driver?.fullName || "Driver"}</strong></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
