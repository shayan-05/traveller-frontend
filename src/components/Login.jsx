import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import axios from "axios";
import { login } from "../store/authSlice";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { apiUrl } from "../services/api.js";

export default function Login() {
const { register, handleSubmit } = useForm();
const dispatch = useDispatch();
const navigate = useNavigate();
const [searchParams] = useSearchParams();

const [role, setRole] = useState(searchParams.get("role") === "driver" ? "driver" : "rider");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const loginHandler = async (data) => {
setError("");
setLoading(true);

try {
  const endpoint =
    role === "rider" ? "/user/login" : "/driver/login";

  const response = await axios.post(
    apiUrl(endpoint),
    {
        email: data.email,
        password: data.password,
    },
    { withCredentials: true }
  );

  const result = response?.data?.data;

  if (!result) {
    throw new Error("Invalid response from server.");
  }

  // Keep the authenticated account in Redux.
  dispatch(login(result));
  localStorage.setItem("role",role)
  // Navigate to the appropriate dashboard.
  navigate(role === "rider" ? "/" : "/driver/dashboard");
} catch (err) {
  setError(
    err.response?.data?.message ||
      err.message ||
      "Login failed. Please try again."
  );
} finally {
  setLoading(false);
}

};

return (
<div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-10">
<div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100 md:grid-cols-2">

    {/* Branding section */}
    <div className="hidden flex-col justify-between bg-sky-100 p-10 md:flex">
      <div>
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-xl font-bold text-white">
            T
          </div>
          <span className="text-2xl font-bold tracking-tight text-blue-900">
            Traveller
          </span>
        </div>

        <h1 className="text-4xl font-bold leading-tight text-blue-900">
          Your journey,
          <br />
          <span className="text-blue-700">your way.</span>
        </h1>

        <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
          Book a convenient ride or join our driver community
          and get on the road.
        </p>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-white/70 p-5">
        <p className="text-sm font-semibold text-blue-800">
          One platform, two journeys.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose the account type that fits you.
        </p>
      </div>
    </div>

    {/* Authentication section */}
    <div className="p-6 sm:p-10 md:p-12">
      <div className="mb-8 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-lg font-bold text-white">
            R
          </div>
          <span className="text-2xl font-bold text-slate-900">
            RideFlow
          </span>
        </div>
      </div>

      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Welcome back
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Sign in
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Choose how you want to use RideFlow.
        </p>
      </div>

      {/* Rider / Driver selector */}
      <div className="mb-7 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setRole("rider");
            setError("");
          }}
          className={`rounded-xl border p-4 text-left transition ${
            role === "rider"
              ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="block text-2xl">🧑</span>
          <span className="mt-2 block font-bold text-slate-900">
            Rider
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Book a ride
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("driver");
            setError("");
          }}
          className={`rounded-xl border p-4 text-left transition ${
            role === "driver"
              ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="block text-2xl">🚗</span>
          <span className="mt-2 block font-bold text-slate-900">
            Driver
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Earn with rides
          </span>
        </button>
      </div>

      <p className="mb-5 text-sm text-slate-600">
        Signing in as{" "}
        <span className="font-bold text-blue-900">
          {role === "rider" ? "Rider" : "Driver"}
        </span>
      </p>

      <form
        onSubmit={handleSubmit(loginHandler)}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email", {
              required: "Enter your email",
            })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password", {
              required: "Enter your password",
            })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-900 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Signing in..."
            : `Sign in as ${role === "rider" ? "Rider" : "Driver"}`}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        Don't have a {role} account?{" "}
        <Link
          to={`/signup?role=${role}`}
          className="font-semibold text-blue-800 hover:text-blue-600"
        >
          Sign up
        </Link>
      </p>

      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        By continuing, you agree to use RideFlow responsibly and safely.
      </p>
    </div>
  </div>
</div>

);
}