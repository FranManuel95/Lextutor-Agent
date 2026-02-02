import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const supabase = createClient();

    // Fetch Stats
    // 1. Total Documents
    const { count: docsCount } = await supabase
        .from("rag_documents")
        .select("*", { count: 'exact', head: true });

    // 2. Total Users
    // Note: 'profiles' table usually maps 1:1 to users, but auth.users is not directly accessible here easily without admin API.
    // relying on profiles is a good proxy.
    const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });

    // 3. Total Messages (Activity proxy)
    const { count: msgsCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true });

    // 4. Total Quizzes/Exams
    const { count: attemptsCount } = await supabase
        .from("exam_attempts")
        .select("*", { count: 'exact', head: true });

    const stats = [
        {
            title: "Documentos RAG",
            value: docsCount || 0,
            icon: FileText,
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            title: "Usuarios Registrados",
            value: usersCount || 0,
            icon: Users,
            color: "text-green-400",
            bg: "bg-green-500/10"
        },
        {
            title: "Mensajes Totales",
            value: msgsCount || 0,
            icon: MessageSquare,
            color: "text-purple-400",
            bg: "bg-purple-500/10"
        },
        {
            title: "Exámenes Realizados",
            value: attemptsCount || 0,
            icon: Database,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10"
        }
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-serif text-law-gold italic">Panel de Control</h2>
                <p className="text-gem-offwhite/60">Visión general del sistema Estudiante Elite.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-gem-slate border-law-accent/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gem-offwhite/80">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
