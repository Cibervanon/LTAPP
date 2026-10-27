"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { signIn, signUp, loading, session } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      router.push("/inventario");
    }
  }, [session, router]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signin") {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
          toast({ title: "Error al iniciar sesión", description: err.message, variant: "critical" });
        }
      } else {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err.message);
          toast({ title: "Error al crear cuenta", description: err.message, variant: "critical" });
        } else {
          toast({ title: "Cuenta creada", description: "Verifica tu email e inicia sesión", variant: "success" });
          setMode("signin");
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    }
  };

  if (session?.user) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-10 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-border/50 overflow-hidden shadow-lg">
            <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black text-primary-text tracking-tighter uppercase">Lifting Trust</span>
          <p className="text-xs text-secondary-text uppercase tracking-widest">ERP Operativo</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-critical/10 border border-critical/20"
          >
            <div className="flex items-start gap-3">
              <span className="text-critical mt-0.5">⚠</span>
              <p className="text-sm text-critical">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handle} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-secondary-text uppercase tracking-wider mb-2">
              Correo electrónico
            </label>
            <Input
              type="email"
              required
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-4 h-4 text-[#5A5A5A]" />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-secondary-text uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-[#5A5A5A]" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-success text-[#121212] font-semibold py-3.5 text-lg rounded-xl disabled:opacity-60 hover:shadow-lg hover:shadow-success/20 transition-all"
          >
            {loading ? (
              <motion.span animate={{ rotate: 360 }} className="inline-block">⟳</motion.span>
            ) : mode === "signin" ? (
              "Ingresar"
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border/50" />
            <span className="px-3 text-xs text-secondary-text uppercase tracking-wider">
              O continuar con
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button variant="ghost" size="lg" onClick={() => {}}>
              Google
            </Button>
            <Button variant="outline" size="lg" onClick={() => {}}>
              Apple
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-secondary-text">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-success font-medium hover:underline transition-colors"
          >
            {mode === "signin" ? "Regístrate" : "Ya tengo cuenta"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
