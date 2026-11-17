import React, { useState, useRef } from "react";
import {
  Zap,
  Camera,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

export default function AuthModal({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [step, setStep] = useState("form"); // 'form' | 'verify'

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Dynamically points to the laptop's IP whether accessed locally or over Wi-Fi/hotspot
  const API_BASE = `http://${window.location.hostname}:8000`;

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // 1. Submit initial Sign Up or Sign In form
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to send verification code");

        setInfoMsg(`A 6-digit verification code was sent to ${email}. (Code: ${data.dev_code})`);
        setStep("verify");
      } catch (err) {
        setErrorMsg(err.message || "Failed to reach backend server");
      } finally {
        setLoading(false);
      }
    } else {
      // Direct Sign In
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Invalid login credentials");

        onLoginSuccess(data);
      } catch (err) {
        setErrorMsg(err.message || "Failed to reach backend server");
      } finally {
        setLoading(false);
      }
    }
  };

  // 2. Finalize Registration after confirming code
  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Verify Code
      const verifyRes = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.detail || "Invalid code");

      // Register user in SQLite
      const regRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
        }),
      });
      const userData = await regRes.json();
      if (!regRes.ok) throw new Error(userData.detail || "Could not complete registration");

      let finalUser = userData;

      // Upload Avatar if one was selected
      if (avatarFile && userData?.id) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const avRes = await fetch(`${API_BASE}/api/auth/${userData.id}/avatar`, {
          method: "POST",
          body: formData,
        });
        if (avRes.ok) {
          const avData = await avRes.json();
          finalUser.avatar_url = avData.avatar_url;
        }
      }

      onLoginSuccess(finalUser);
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 min-h-screen w-screen p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-100 my-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-3">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {step === "verify"
              ? "Verify Your Email"
              : isSignUp
              ? "Create Your PM Account"
              : "Sign In to SpecRoute"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 text-center">
            {step === "verify"
              ? "Enter the 6-digit confirmation code to activate your account."
              : isSignUp
              ? "Sign up with your credentials to manage project triage."
              : "Welcome back! Enter your credentials to access your dashboard."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-medium">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-lg text-center font-medium">
            {infoMsg}
          </div>
        )}

        {step === "verify" ? (
          <form onSubmit={handleVerifyAndComplete} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-center tracking-widest text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Verifying..." : "Confirm & Launch Dashboard"}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full text-xs text-slate-500 hover:text-slate-800 transition text-center"
            >
              ← Back to registration details
            </button>
          </form>
        ) : (
          <form onSubmit={handleInitialSubmit} className="space-y-3.5">
            {isSignUp && (
              <>
                {/* Photo Picker */}
                <div className="flex flex-col items-center justify-center mb-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImagePick}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="relative h-18 w-18 rounded-full border-2 border-dashed border-slate-300 hover:border-indigo-500 flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50 transition group"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-600">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px] mt-0.5 font-medium">Photo</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Profile picture</span>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mercy Ifeduora"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Work Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="pm@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Processing..." : isSignUp ? "Continue to Email Verification" : "Sign In"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {/* Toggle Login/Sign Up */}
        {step === "form" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setInfoMsg("");
              }}
              className="text-xs text-indigo-600 hover:underline font-medium cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account yet? Sign Up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}