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
    .select("id", { count: "exact", head: true });

  // 2. Total Users (profiles maps 1:1 to auth.users)
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // 3. Total Messages (Activity proxy)
  const { count: msgsCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true });

  // 4. Total Quizzes/Exams
  const { count: attemptsCount } = await supabase
    .from("exam_attempts")
    .select("id", { count: "exact", head: true });

  const stats = [
    {
      title: "Documentos RAG",
      value: docsCount || 0,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Usuarios Registrados",
      value: usersCount || 0,
      icon: Users,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Mensajes Totales",
      value: msgsCount || 0,
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Exámenes Realizados",
      value: attemptsCount || 0,
      icon: Database,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl italic text-law-gold">Panel de Control</h2>
        <p className="text-gem-offwhite/60">Visión general del sistema Estudiante Elite.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-law-accent/20 bg-gem-slate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gem-offwhite/80">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
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
