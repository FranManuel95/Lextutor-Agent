import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Copyright } from '@/components/copyright'
import { AuthSubmitButton } from '@/components/auth-submit-button'
import { PasswordMatchValidator } from '@/components/password-match-validator'


export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center py-2 bg-gem-onyx text-gem-offwhite font-sans selection:bg-law-gold selection:text-gem-onyx">
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link href="/">
                    <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 gap-2">
                        <ArrowLeft size={16} /> Volver
                    </Button>
                </Link>
            </div>

            {/* Branding Header */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-serif italic text-white mb-2">
                    Estudiante <span className="text-law-gold">Elite</span>
                </h1>
                <p className="text-gem-offwhite/60 text-sm tracking-widest uppercase">
                    Acceso Cliente
                </p>
            </div>

            <Card className="w-full max-w-[400px] mx-4 border-law-accent/30 bg-gem-slate/50 backdrop-blur-md shadow-2xl shadow-black/40">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-serif italic text-white">Bienvenido</CardTitle>
                    <CardDescription className="text-gem-offwhite/50">
                        Ingresa tus credenciales para acceder al sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gem-mist/50 border border-law-accent/20">
                            <TabsTrigger
                                value="login"
                                className="data-[state=active]:bg-law-gold data-[state=active]:text-gem-onyx text-gem-offwhite/70 hover:text-white transition-all"
                            >
                                Ingresar
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="data-[state=active]:bg-law-gold data-[state=active]:text-gem-onyx text-gem-offwhite/70 hover:text-white transition-all"
                            >
                                Registrarse
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="mt-4 space-y-4">
                            <form action={login} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gem-offwhite/80">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        required
                                        title="Ingresa tu dirección de correo electrónico"
                                        aria-label="Correo electrónico para iniciar sesión"
                                        className="bg-gem-mist/50 border-law-accent/30 text-white placeholder:text-white/20 focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gem-offwhite/80">Contraseña</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        title="Ingresa tu contraseña"
                                        aria-label="Contraseña para iniciar sesión"
                                        minLength={6}
                                        className="bg-gem-mist/50 border-law-accent/30 text-white focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <AuthSubmitButton>
                                    INICIAR SESIÓN
                                </AuthSubmitButton>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="mt-4 space-y-4">
                            <form action={signup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-gem-offwhite/80">Nombre Completo</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        placeholder="Ej: Juan Pérez García"
                                        required
                                        title="Ingresa tu nombre completo"
                                        aria-label="Nombre completo del usuario"
                                        minLength={3}
                                        className="bg-gem-mist/50 border-law-accent/30 text-white placeholder:text-white/20 focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gem-offwhite/80">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        required
                                        title="Ingresa tu correo electrónico"
                                        aria-label="Correo electrónico del usuario"
                                        className="bg-gem-mist/50 border-law-accent/30 text-white placeholder:text-white/20 focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gem-offwhite/80">Contraseña</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        title="Crea una contraseña segura (mínimo 6 caracteres)"
                                        aria-label="Contraseña del usuario"
                                        minLength={6}
                                        className="bg-gem-mist/50 border-law-accent/30 text-white focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gem-offwhite/80">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirma tu contraseña"
                                        required
                                        title="Confirma tu contraseña"
                                        aria-label="Confirmar contraseña del usuario"
                                        minLength={6}
                                        className="bg-gem-mist/50 border-law-accent/30 text-white focus:border-law-gold focus:ring-law-gold/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="birthdate" className="text-gem-offwhite/80">Fecha de Nacimiento</Label>
                                        <Input
                                            id="birthdate"
                                            name="birthdate"
                                            type="date"
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                            title="Selecciona tu fecha de nacimiento"
                                            aria-label="Fecha de nacimiento del usuario"
                                            aria-describedby="birthdate-hint"
                                            className="bg-gem-mist/50 border-law-accent/30 text-white placeholder:text-white/20 focus:border-law-gold focus:ring-law-gold/20"
                                        />
                                        <p id="birthdate-hint" className="text-xs text-gem-offwhite/40">Debes ser mayor de 13 años</p>
                                    </div>
                                    <div className="space-y-2 col-span-2 flex flex-col items-center">
                                        <Label htmlFor="avatar" className="text-gem-offwhite/80 cursor-pointer group relative">
                                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-law-accent/50 group-hover:border-law-gold flex flex-col items-center justify-center bg-gem-mist/20 transition-all overflow-hidden">
                                                <div className="text-law-gold/50 group-hover:text-law-gold transition-colors">
                                                    <span className="text-2xl">📷</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-law-gold mt-1">Avatar</span>
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
                                <AuthSubmitButton>
                                    REGISTRARSE
                                </AuthSubmitButton>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {searchParams?.message && (
                        <div className={`mt-6 p-3 text-sm text-center rounded-md border ${searchParams.message.includes('exitoso')
                            ? "bg-green-900/30 border-green-500/30 text-green-200"
                            : "bg-red-900/30 border-red-500/30 text-red-200"
                            }`}>
                            {searchParams.message}
                        </div>
                    )}
                </CardContent>
            </Card>


            <div className="mt-8">
                <Copyright />
            </div>
        </div>
    )
}
