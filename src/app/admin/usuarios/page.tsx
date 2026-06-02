"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  collection,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageFrame } from "@/components/admin/admin-page-frame";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/config/roles";
import { db } from "@/lib/firebase";
import { profileFromFirestore } from "@/lib/firebase/profile-mapper";
import type { AuthenticatedProfile, UserRole } from "@/types/domain";

const roleOptions: UserRole[] = ["admin", "partner", "volunteer", "public"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthenticatedProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState("");

  useEffect(() => {
    if (!db) {
      setIsUsersLoading(false);
      return;
    }

    setIsUsersLoading(true);

    return onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        setUsers(
          snapshot.docs.map((userDoc) =>
            profileFromFirestore(userDoc.id, userDoc.data()),
          ),
        );
        setError("");
        setIsUsersLoading(false);
      },
      () => {
        setError("Nao foi possivel carregar os usuarios.");
        setIsUsersLoading(false);
      },
    );
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((first, second) =>
        first.email.localeCompare(second.email),
      ),
    [users],
  );

  async function handleRoleChange(userId: string, role: UserRole) {
    if (!db) {
      return;
    }

    setSavingUserId(userId);
    try {
      await updateDoc(doc(db, "users", userId), { role });
      setError("");
    } catch {
      setError("Nao foi possivel alterar o papel do usuario.");
    } finally {
      setSavingUserId("");
    }
  }

  async function handleActiveChange(userId: string, isActive: boolean) {
    if (!db) {
      return;
    }

    setSavingUserId(userId);
    try {
      await updateDoc(doc(db, "users", userId), { isActive });
      setError("");
    } catch {
      setError("Nao foi possivel alterar o status do usuario.");
    } finally {
      setSavingUserId("");
    }
  }

  return (
    <AdminPageFrame
      title="Usuarios"
      description="Visualize usuarios cadastrados, defina papeis de acesso e ative ou inative contas."
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr] gap-3 border-b border-bd-muted px-4 py-3 text-xs font-bold uppercase text-muted max-md:hidden">
          <span>Usuario</span>
          <span>Papel</span>
          <span>Status</span>
        </div>

        {isUsersLoading ? (
          <p className="px-4 py-5 text-sm text-muted">Carregando usuarios...</p>
        ) : sortedUsers.length > 0 ? (
          <ul>
            {sortedUsers.map((listedUser) => (
              <li
                key={listedUser.id}
                className="grid gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_0.8fr] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {listedUser.displayName || "Sem nome"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {listedUser.email || listedUser.id}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase text-placeholder md:hidden">
                    Papel
                  </span>
                  <select
                    value={listedUser.role}
                    disabled={savingUserId === listedUser.id}
                    onChange={(event) =>
                      void handleRoleChange(
                        listedUser.id,
                        event.target.value as UserRole,
                      )
                    }
                    className="h-10 w-full rounded-md border border-bd-muted bg-surface-4 px-3 text-sm text-white outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center gap-3">
                  <AdminStatusBadge
                    label={listedUser.isActive ? "Ativo" : "Inativo"}
                    tone={listedUser.isActive ? "success" : "danger"}
                  />
                  <Button
                    disabled={savingUserId === listedUser.id}
                    onClick={() =>
                      void handleActiveChange(
                        listedUser.id,
                        !listedUser.isActive,
                      )
                    }
                    variant="secondary"
                    size="sm"
                  >
                    {listedUser.isActive ? "Inativar" : "Ativar"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <AdminEmptyState
              title="Nenhum usuario encontrado"
              description="Quando alguem fizer login com Google, o perfil sera criado automaticamente nesta lista."
            />
          </div>
        )}
      </section>
    </AdminPageFrame>
  );
}
