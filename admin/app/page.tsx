"use client";

import { useEffect, useState } from "react";
import { Plus, FileCode, AlertTriangle, Database } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { OrchestratorClient } from "./lib/orchestratorClient";

interface RegistryEntity {
  id: string;
  scope: string;
  collectionName: string;
  hasSchema: boolean;
}

export default function Home() {
  const router = useRouter();
  const [entities, setEntities] = useState<RegistryEntity[]>([]);
  const [kpis, setKpis] = useState<{ totalUsers: number, pendingUsers: number, recentAlerts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // 1. Load schemas
    fetch("/admin/api/schemas")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const sortedEntities = data.entities.sort((a: RegistryEntity, b: RegistryEntity) =>
            a.id.localeCompare(b.id)
          );
          setEntities(sortedEntities);
        }
      });

    // 2. Load KPIs
    OrchestratorClient.call<{ totalUsers: number; pendingUsers: number; recentAlerts: number; }>({
      actionId: "get_admin_kpis",
      entityId: "system"
    })
      .then(result => {
        if (result.status === "success" && result.data) {
          setKpis(result.data);
        }
      })
      .catch(err => console.error("Failed to load admin KPIs:", err))
      .finally(() => setLoading(false));

  }, []);

  const handleCreateNew = async () => {
    const name = prompt("Enter new entity name (camelCase, e.g. product):");
    if (!name) return;
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
      return alert("Invalid name. Must be camelCase (e.g., ticketSupport).");
    }
    setCreating(true);
    try {
      const res = await fetch("/admin/api/schemas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityName: name })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/editor/${name}`);
      } else {
        alert(data.error || "Creation failed");
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visual IDE</h1>
          <p className="text-muted-foreground mt-2">
            Manage Zod Database Schemas and Server-Driven Rules (RBAC) dynamically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateNew} disabled={creating} variant="primary">
            <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating..." : "Nuovo Master Schema"}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex h-32 items-center justify-center animate-pulse">
          <span>Loading Dashboard...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1a1a1f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                <span className="text-muted-foreground text-sm font-medium">Utenti Registrati</span>
                <span className="text-3xl font-bold mt-2 text-[#635BFF]">{kpis.totalUsers}</span>
              </div>
              <div className="bg-white dark:bg-[#1a1a1f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                <span className="text-muted-foreground text-sm font-medium">Attivazioni in Sospeso</span>
                <span className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-500">{kpis.pendingUsers}</span>
              </div>
              <div className="bg-white dark:bg-[#1a1a1f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                <span className="text-muted-foreground text-sm font-medium">Ultimi Security Logs</span>
                <span className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">{kpis.recentAlerts}</span>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-semibold mt-12 mb-4">Master Schemas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map(e => (
              <Link key={e.id} href={e.hasSchema ? `/editor/${e.id}` : `#`}>
                <div className={`border rounded-xl p-4 transition-colors bg-card hover:shadow-sm ${e.hasSchema ? 'border-border hover:border-primary cursor-pointer' : 'border-red-500/50 cursor-not-allowed opacity-80'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${e.hasSchema ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                        {e.hasSchema ? <FileCode className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{e.id}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-1">
                          <Database className="w-3 h-3" />
                          {e.collectionName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${e.scope === 'global' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                        {e.scope}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 text-xs">
                    {e.hasSchema ? (
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">AST Compiled</span>
                    ) : (
                      <span className="bg-red-100 flex items-center gap-1 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" /> Missing {e.id}.ts Schema
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
