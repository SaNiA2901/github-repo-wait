"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type User = {
  id: number;
  email: string;
  name?: string | null;
  createdAt: string;
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function load() {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/users", { cache: "no-store", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users ?? []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }

    startTransition(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не удалось создать пользователя");
        toast.success("Пользователь создан");
        setEmail("");
        setName("");
        await load();
      } catch (e: any) {
        toast.error(e.message || "Ошибка создания пользователя");
      }
    });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Demo: Пользователи (Drizzle + Turso)</h1>
          <p className="text-muted-foreground mt-1">Заменено с Supabase/Prisma на собственный API с Drizzle ORM и Turso (libsql).</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Создать пользователя</CardTitle>
              <CardDescription>Добавьте нового пользователя в базу данных.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Имя (необязательно)</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Создание..." : "Создать"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Состояние</CardTitle>
              <CardDescription>Проверка подключения и подсказки.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Установите переменные окружения TURSO_CONNECTION_URL и TURSO_AUTH_TOKEN.</li>
                <li>Запустите миграции Drizzle (если нужны): npx drizzle-kit push.</li>
                <li>API: GET/POST /api/users — уже готово (Drizzle + Turso).</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Список пользователей</CardTitle>
            <CardDescription>Последние пользователи по дате создания.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-11/12" />
                <Skeleton className="h-8 w-10/12" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет пользователей.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Создан</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono">{u.id}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.name || "—"}</TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}