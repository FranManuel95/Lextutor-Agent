import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Copyright } from "@/components/copyright";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordMatchValidator } from "@/components/password-match-validator";

import { LoginOptimizer } from "./login-optimizer";

import { LoginMessage } from "./login-message";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gem-onyx py-2 font-sans text-gem-offwhite selection:bg-law-gold selection:text-gem-onyx">
      <LoginOptimizer />
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <Link href="/">
          <Button
            variant="ghost"
            className="gap-2 text-gem-muted hover:bg-gem-slate hover:text-gem-offwhite"
          >
            <ArrowLeft size={16} /> Volver
          </Button>
        </Link>
      </div>

      {/* Branding Header */}
      <div className="mb-8 text-center">
        <h1 className="text-shadow-sm mb-2 font-serif text-4xl italic text-gem-offwhite">
          Estudiante <span className="text-law-gold">Elite</span>
        </h1>
        <p className="text-sm uppercase tracking-widest text-gem-offwhite/60">Acceso Cliente</p>
      </div>

      <Suspense>
        <LoginMessage />
      </Suspense>

      <Card className="mx-4 w-full max-w-[400px] border-law-accent/30 bg-gem-mist shadow-2xl shadow-gem-offwhite/10 backdrop-blur-md dark:shadow-black/40">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-serif text-2xl italic text-gem-offwhite">Bienvenido</CardTitle>
          <CardDescription className="text-gem-offwhite/50">
            Ingresa tus credenciales para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 border border-law-accent/20 bg-gem-mist/50">
              <TabsTrigger
                value="login"
                className="text-gem-offwhite/70 transition-all hover:text-gem-offwhite data-[state=active]:bg-law-gold data-[state=active]:text-gem-onyx"
              >
                Ingresar
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-gem-offwhite/70 transition-all hover:text-gem-offwhite data-[state=active]:bg-law-gold data-[state=active]:text-gem-onyx"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-4">
              <form action={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gem-offwhite/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    title="Ingresa tu dirección de correo electrónico"
                    aria-label="Correo electrónico para iniciar sesión"
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite placeholder:text-gem-muted focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gem-offwhite/80">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    title="Ingresa tu contraseña"
                    aria-label="Contraseña para iniciar sesión"
                    minLength={6}
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <AuthSubmitButton>INICIAR SESIÓN</AuthSubmitButton>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <form action={signup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gem-offwhite/80">
                    Nombre Completo
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Ej: Juan Pérez García"
                    required
                    title="Ingresa tu nombre completo"
                    aria-label="Nombre completo del usuario"
                    minLength={3}
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite placeholder:text-gem-muted focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gem-offwhite/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    title="Ingresa tu correo electrónico"
                    aria-label="Correo electrónico del usuario"
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite placeholder:text-gem-muted focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gem-offwhite/80">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    title="Crea una contraseña segura (mínimo 6 caracteres)"
                    aria-label="Contraseña del usuario"
                    minLength={6}
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gem-offwhite/80">
                    Confirmar Contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirma tu contraseña"
                    required
                    title="Confirma tu contraseña"
                    aria-label="Confirmar contraseña del usuario"
                    minLength={6}
                    className="border-law-accent/30 bg-gem-mist text-gem-offwhite focus:border-law-gold focus:ring-law-gold/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="birthdate" className="text-gem-offwhite/80">
                      Fecha de Nacimiento
                    </Label>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      title="Selecciona tu fecha de nacimiento"
                      aria-label="Fecha de nacimiento del usuario"
                      aria-describedby="birthdate-hint"
                      className="border-law-accent/30 bg-gem-mist text-gem-offwhite placeholder:text-gem-muted focus:border-law-gold focus:ring-law-gold/20 dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:brightness-150 [&::-webkit-calendar-picker-indicator]:contrast-125 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 hover:[&::-webkit-calendar-picker-indicator]:brightness-200"
                    />
                    <p id="birthdate-hint" className="text-xs text-gem-offwhite/40">
                      Debes ser mayor de 13 años
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-col items-center space-y-2">
                    <Label
                      htmlFor="avatar"
                      className="group relative cursor-pointer text-gem-offwhite/80"
                    >
                      <div className="flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-law-accent/50 bg-gem-mist transition-all group-hover:border-law-gold">
                        <div className="text-law-gold/50 transition-colors group-hover:text-law-gold">
                          <span className="text-2xl">📷</span>
                        </div>
                        <span className="mt-1 text-[10px] font-bold uppercase text-gem-muted group-hover:text-law-gold">
                          Avatar
                        </span>
                      </div>
                      {/* Hidden Input */}
                      <Input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                    </Label>
                  </div>
                </div>
                <PasswordMatchValidator />
                <AuthSubmitButton>REGISTRARSE</AuthSubmitButton>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Copyright />
      </div>
    </div>
  );
}
