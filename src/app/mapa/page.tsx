"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { PublicPageShell } from "@/components/public/public-page-shell";
import {
  publicMapDogFromFirestore,
  publicSupportPointFromFirestore,
  publicMapPartnerFromFirestore,
  type PublicMapDog,
  type PublicMapSupportPoint,
  type PublicMapPartner,
} from "@/lib/firebase/community-mappers";
import { db } from "@/lib/firebase";

const CommunityMap = dynamic(
  () =>
    import("@/components/public/community-map").then(
      (module) => module.CommunityMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-128 place-items-center rounded-lg border border-bd-muted bg-surface text-sm text-muted">
        Carregando mapa...
      </div>
    ),
  },
);

export default function PublicMapPage() {
  const [dogs, setDogs] = useState<PublicMapDog[]>([]);
  const [supportPoints, setSupportPoints] = useState<PublicMapSupportPoint[]>(
    [],
  );
  const [partners, setPartners] = useState<PublicMapPartner[]>([]);
  const [showDogs, setShowDogs] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showPartners, setShowPartners] = useState(true);
  const [showDonationPoints, setShowDonationPoints] = useState(true);

  useEffect(() => {
    if (!db) {
      return;
    }

    const dogsQuery = query(
      collection(db, "streetDogs"),
      where("visibility", "==", "public"),
      where("approvalStatus", "==", "approved"),
    );
    const pointsQuery = query(
      collection(db, "supportPoints"),
      where("visibility", "==", "public"),
      where("approvalStatus", "==", "approved"),
    );
    const partnersQuery = query(
      collection(db, "organizations"),
      where("isPublicPartner", "==", true),
      where("status", "==", "approved"),
    );

    const unsubscribeDogs = onSnapshot(dogsQuery, (snapshot) => {
      setDogs(
        snapshot.docs
          .map((item) => publicMapDogFromFirestore(item.id, item.data()))
          .filter((item): item is PublicMapDog => Boolean(item)),
      );
    });

    const unsubscribePoints = onSnapshot(pointsQuery, (snapshot) => {
      setSupportPoints(
        snapshot.docs
          .map((item) => publicSupportPointFromFirestore(item.id, item.data()))
          .filter((item): item is PublicMapSupportPoint => Boolean(item)),
      );
    });

    const unsubscribePartners = onSnapshot(partnersQuery, (snapshot) => {
      setPartners(
        snapshot.docs
          .map((item) => publicMapPartnerFromFirestore(item.id, item.data()))
          .filter((item): item is PublicMapPartner => Boolean(item)),
      );
    });

    return () => {
      unsubscribeDogs();
      unsubscribePoints();
      unsubscribePartners();
    };
  }, []);

  return (
    <PublicPageShell
      title="Mapa comunitario"
      description="Consulte caes cadastrados, pontos de alimentacao, agua, doacao, parceiros e locais de apoio."
    >
      <section className="mb-4 flex flex-wrap gap-2">
        <MapFilter checked={showDogs} label="Caes" onChange={setShowDogs} />
        <MapFilter checked={showFood} label="Racao" onChange={setShowFood} />
        <MapFilter checked={showWater} label="Agua" onChange={setShowWater} />
        <MapFilter
          checked={showPartners}
          label="Parceiros"
          onChange={setShowPartners}
        />
        <MapFilter
          checked={showDonationPoints}
          label="Doacao"
          onChange={setShowDonationPoints}
        />
      </section>

      <CommunityMap
        dogs={dogs}
        supportPoints={supportPoints}
        partners={partners}
        showDogs={showDogs}
        showFood={showFood}
        showWater={showWater}
        showPartners={showPartners}
        showDonationPoints={showDonationPoints}
      />
    </PublicPageShell>
  );
}

function MapFilter({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-md border border-bd-muted bg-surface px-3 text-sm font-bold text-fg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-accent"
      />
      {label}
    </label>
  );
}
