import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
        const response = await api.post(
            "auth/login",
            new URLSearchParams({
            username: email,
            password: password,
            }),
            {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            }
        );

        // Simpan token di localStorage
        localStorage.setItem("access_token", response.data.access_token);

        // Redirect ke dashboard
        navigate("/home");
        } catch (err) {
        setError("Email atau password salah");
        }
    };

    return (
        <div className="min-h-screen flex">
        {/* LEFT SIDE - GREEN BACKGROUND */}
        <div className="w-1/2 bg-[#D5F1D6] flex flex-col justify-center items-center p-10">
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Silakan login untuk melanjutkan</p>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="w-1/2 flex flex-col justify-center px-16">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Login</h2>

            <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                Email
                </label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-green-300 outline-none"
                placeholder="email@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                Password
                </label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-green-300 outline-none"
                placeholder="Masukkan password"
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition cursor-pointer"
            >
                Login
            </button>
            </form>
        </div>
        </div>
    );
}
