import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";

const MIN_PASSWORD = 8;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  // Mirrors the server rule so the failure surfaces before a round trip.
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD
      ? `At least ${MIN_PASSWORD} characters.`
      : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (passwordError) return;

    try {
      await register(email, password, displayName);
      navigate("/onboarding");
    } catch {
      setError("Couldn't create that account. The email may already be in use.");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Two minutes to set up, then start talking."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-soft hover:text-ink">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-3.5 py-2.5 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          placeholder="What should the tutor call you?"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          error={passwordError}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
