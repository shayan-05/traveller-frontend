import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function MyProfile() {
  const user = useSelector((state) => state.auth.userData);
  const role = localStorage.getItem("role") || "rider";
  const fullName = user?.fullName || "Name not provided";
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const details = [
    ["Email address", user?.email || "Not provided"],
    ["Phone number", user?.phone || user?.phoneNumber || "Not provided"],
    ...(role === "driver"
      ? [
          ["Vehicle", user?.vehicleName || "Not provided"],
          ["Vehicle type", user?.vehicleType || "Not provided"],
          ["Registration", user?.vehicleNumber || "Not provided"],
        ]
      : []),
  ];

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
            <Link to="/ride-history">Ride history</Link>
          </nav>
        </header>

        <section className="account-heading">
          <p className="account-eyebrow">ACCOUNT</p>
          <h1>My profile</h1>
          <p>Your personal details and {role} account information.</p>
        </section>

        <section className="profile-card">
          <div className="profile-banner">
            <div className="profile-avatar" aria-hidden="true">{initials || "U"}</div>
            <div>
              <p className="profile-role">{role} account</p>
              <h2>{fullName}</h2>
              <p>{user?.email || "Your RideFlow account"}</p>
            </div>
          </div>
          <div className="profile-details">
            <h3>Personal information</h3>
            <dl>
              {details.map(([label, value]) => (
                <div className="profile-detail" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="profile-footer">
            <span>Need a record of a recent journey?</span>
            <Link to="/ride-history">View ride history <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
