"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { StreetDogPublicCard } from "@/components/public/street-dog-public-card";
import {
  publicStreetDogProfileFromFirestore,
  type PublicStreetDogProfile,
} from "@/lib/firebase/community-mappers";
import { db } from "@/lib/firebase";

export default function PublicStreetDogPage() {
  const params = useParams<{ id: string }>();
  const [dog, setDog] = useState<PublicStreetDogProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDog() {
      if (!db || !params.id) {
        setIsLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "streetDogs", params.id));

        if (!snapshot.exists()) {
          setDog(null);
          setError("Cao nao encontrado ou nao disponivel publicamente.");
          return;
        }

        const data = snapshot.data();

        if (
          data.visibility !== "public" ||
          data.approvalStatus !== "approved"
        ) {
          setDog(null);
          setError("Cao nao encontrado ou nao disponivel publicamente.");
          return;
        }

        setDog(publicStreetDogProfileFromFirestore(snapshot.id, data));
        setError("");
      } catch {
        setDog(null);
        setError("Nao foi possivel carregar o cadastro publico.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDog();
  }, [params.id]);

  return (
    <PublicPageShell
      title="Cadastro publico do cao"
      description="Informacoes basicas para identificacao, acompanhamento comunitario e apoio ao animal."
    >
      {isLoading ? (
        <p className="rounded-lg border border-bd-muted bg-surface px-4 py-5 text-sm text-muted">
          Carregando cadastro...
        </p>
      ) : dog ? (
        <StreetDogPublicCard dog={dog} />
      ) : (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-4 py-5 text-sm text-danger">
          {error || "Cadastro nao encontrado."}
        </p>
      )}
    </PublicPageShell>
  );
}
