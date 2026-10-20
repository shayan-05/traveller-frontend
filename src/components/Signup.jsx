import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Link, useNavigate,useSearchParams } from "react-router-dom";
import { apiUrl } from "../services/api.js";

export default function Signup() {
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const role = searchParams.get("role") === "driver"
        ? "driver"
        : "rider";
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    

const onSignup = async (data) => {
    setError("");

    try {
        const isDriver = role === "driver";
        const endpoint = isDriver ? "/driver/create" : "/user/create";

        const payload = isDriver
            ? {
                  fullName: data.fullName,
                  email: data.email,
                  password: data.password,
                  phone: data.phone,
                  vehicleNumber: data.vehicleNumber,
                  vehicleType: data.vehicleType,
                  vehicleName: data.vehicleName,
              }
            : {
                  fullName: data.fullName,
                  email: data.email,
                  password: data.password,
                  phone: data.phone,
              };

        const response = await axios.post(
            apiUrl(endpoint),
            payload
        );

        if (response?.data?.data) {
            navigate(`/login?role=${role}`);
        }
    } catch (err) {
        setError(
            err.response?.data?.message ||
            err.message ||
            "Signup failed. Please try again."
        );
    }
};



    return (
        <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100 md:grid-cols-2">
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    Create your {role} account
                </h2>
                {/* Branding section */}
                <div className="hidden flex-col justify-between bg-sky-100 p-10 md:flex">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-2xl font-bold text-white">
                                T
                            </div>
                            <span className="text-2xl font-bold text-slate-900">
                                Traveller
                            </span>
                        </div>

                        <h1 className="mt-16 text-4xl font-bold leading-tight text-slate-900">
                            Your next journey
                            <span className="block text-blue-700">
                                starts here.
                            </span>
                        </h1>

                        <p className="mt-5 max-w-sm leading-7 text-slate-600">
                            Create your account and enjoy a simpler,
                            more convenient way to travel.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-white/70 p-5">
                        <p className="font-semibold text-slate-800">
                            One account. Every journey.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Sign up to get started with RideFlow.
                        </p>
                    </div>
                </div>

                {/* Signup form */}
                <div className="p-6 sm:p-10 md:p-12">
                    <div className="mb-8 md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-xl font-bold text-white">
                                R
                            </div>
                            <span className="text-2xl font-bold text-slate-900">
                                RideFlow
                            </span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                            Get started
                        </p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            Create your account
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Fill in your details to join RideFlow.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit(onSignup)}
                        className="space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="fullName"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Full name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                placeholder="Enter your full name"
                                {...register("fullName", {
                                    required: "Please enter your full name",
                                })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

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
                                    required: "Please enter your email",
                                })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Phone number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="Enter your phone number"
                                {...register("phone", {
                                    required: "Please enter your phone number",
                                })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.phone.message}
                                </p>
                            )}
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
                                autoComplete="new-password"
                                placeholder="Create a password"
                                {...register("password", {
                                    required: "Please enter a password",
                                    minLength: {
                                        value: 8,
                                        message: "Password must be at least 8 characters",
                                    },
                                })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        
                        {role === "driver" && (
                            <>
                                <div>
                                    <label
                                        htmlFor="vehicleNumber"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Vehicle number
                                    </label>
                                    <input
                                        id="vehicleNumber"
                                        type="text"
                                        placeholder="e.g. UP20AB1234"
                                        {...register("vehicleNumber", {
                                            required: "Please enter your vehicle number",
                                        })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors.vehicleNumber && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.vehicleNumber.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="vehicleType"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Vehicle type
                                    </label>
                                    <select
                                        id="vehicleType"
                                        {...register("vehicleType", {
                                            required: "Please select a vehicle type",
                                        })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Select vehicle type
                                        </option>
                                        <option value="bike">Bike</option>
                                        <option value="auto">Auto</option>
                                        <option value="car">Car</option>
                                    </select>
                                    {errors.vehicleType && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.vehicleType.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="vehicleName"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Vehicle name
                                    </label>
                                    <input
                                        id="vehicleName"
                                        type="text"
                                        placeholder="e.g. Honda Activa"
                                        {...register("vehicleName", {
                                            required: "Please enter your vehicle name",
                                        })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors.vehicleName && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.vehicleName.message}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}


                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-blue-900 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-blue-800 hover:text-blue-600"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}