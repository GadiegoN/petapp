"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  HeartHandshake,
  MapPin,
  Store,
  Users,
} from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageFrame } from "@/components/admin/admin-page-frame";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { db } from "@/lib/firebase";

type DashboardCounts = {
  users: number;
  appointments: number;
  streetDogs: number;
  supportPoints: number;
  organizations: number;
};

const emptyCounts: DashboardCounts = {
  users: 0,
  appointments: 0,
  streetDogs: 0,
  supportPoints: 0,
  organizations: 0,
};

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>(emptyCounts);
  const [pendingStreetDogs, setPendingStreetDogs] = useState(0);
  const [pendingSupportPoints, setPendingSupportPoints] = useState(0);
  const [pendingOrganizations, setPendingOrganizations] = useState(0);

  useEffect(() => {
    if (!db) {
      return;
    }

    const unsubscribers = [
      onSnapshot(query(collection(db, "users")), (snapshot) => {
        setCounts((current) => ({ ...current, users: snapshot.size }));
      }),
      onSnapshot(query(collection(db, "appointments")), (snapshot) => {
        setCounts((current) => ({ ...current, appointments: snapshot.size }));
      }),
      onSnapshot(query(collection(db, "streetDogs")), (snapshot) => {
        setCounts((current) => ({ ...current, streetDogs: snapshot.size }));
        setPendingStreetDogs(
          snapshot.docs.filter(
            (item) => item.data().approvalStatus === "pending",
          ).length,
        );
      }),
      onSnapshot(query(collection(db, "supportPoints")), (snapshot) => {
        setCounts((current) => ({ ...current, supportPoints: snapshot.size }));
        setPendingSupportPoints(
          snapshot.docs.filter(
            (item) => item.data().approvalStatus === "pending",
          ).length,
        );
      }),
      onSnapshot(query(collection(db, "organizations")), (snapshot) => {
        setCounts((current) => ({ ...current, organizations: snapshot.size }));
        setPendingOrganizations(
          snapshot.docs.filter((item) => item.data().status === "pending")
            .length,
        );
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const totalPending = useMemo(
    () => pendingStreetDogs + pendingSupportPoints + pendingOrganizations,
    [pendingOrganizations, pendingStreetDogs, pendingSupportPoints],
  );

  return (
    <AdminPageFrame
      title="Painel administrativo"
      description="Visao geral da plataforma, usuarios, comunidade, parceiros e itens que precisam de moderacao."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetricCard label="Usuarios" value={counts.users} icon={Users} />
        <AdminMetricCard
          label="Agendamentos"
          value={counts.appointments}
          icon={CalendarDays}
        />
        <AdminMetricCard
          label="Caes de rua"
          value={counts.streetDogs}
          icon={HeartHandshake}
        />
        <AdminMetricCard
          label="Pontos"
          value={counts.supportPoints}
          icon={MapPin}
        />
        <AdminMetricCard
          label="Organizacoes"
          value={counts.organizations}
          icon={Store}
        />
      </div>

      <section className="rounded-lg border border-bd-muted bg-surface p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Pendencias de aprovacao
            </h2>
            <p className="mt-1 text-sm text-muted">
              Conteudo que precisa de revisao antes de aparecer publicamente.
            </p>
          </div>
          <AdminStatusBadge
            label={`${totalPending} pendente(s)`}
            tone={totalPending > 0 ? "warning" : "success"}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <PendingItem label="Caes de rua" value={pendingStreetDogs} />
          <PendingItem label="Pontos de apoio" value={pendingSupportPoints} />
          <PendingItem label="Organizacoes" value={pendingOrganizations} />
        </div>
      </section>
    </AdminPageFrame>
  );
}

function PendingItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-bd-muted bg-surface-3 p-4">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
