"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { db } from "@/lib/firebase";

export default function QRCodePublicPage() {
  const router = useRouter();
  const params = useParams<{ qrCodeId: string }>();
  const [error, setError] = useState("");

  useEffect(() => {
    async function resolveQRCode() {
      if (!db || !params.qrCodeId) {
        setError("QR Code invalido.");
        return;
      }

      try {
        const qrSnapshot = await getDoc(doc(db, "qrCodes", params.qrCodeId));

        if (qrSnapshot.exists()) {
          const qrCode = qrSnapshot.data();

          if (
            qrCode.isActive === true &&
            qrCode.targetType === "streetDog" &&
            typeof qrCode.targetId === "string"
          ) {
            router.replace(`/caes/${qrCode.targetId}`);
            return;
          }
        }

        const dogsSnapshot = await getDocs(
          query(
            collection(db, "streetDogs"),
            where("qrCodeId", "==", params.qrCodeId),
            where("visibility", "==", "public"),
            where("approvalStatus", "==", "approved"),
            limit(1),
          ),
        );

        const dog = dogsSnapshot.docs[0];

        if (dog) {
          router.replace(`/caes/${dog.id}`);
          return;
        }

        setError("QR Code nao encontrado ou desativado.");
      } catch {
        setError("Nao foi possivel consultar este QR Code.");
      }
    }

    void resolveQRCode();
  }, [params.qrCodeId, router]);

  return (
    <PublicPageShell
      title="Consulta por QR Code"
      description="Estamos localizando o cadastro publico vinculado a este identificador."
    >
      <p
        className={`rounded-lg border px-4 py-5 text-sm ${
          error
            ? "border-danger-border bg-danger-bg text-danger"
            : "border-bd-muted bg-surface text-muted"
        }`}
      >
        {error || "Redirecionando..."}
      </p>
    </PublicPageShell>
  );
}
