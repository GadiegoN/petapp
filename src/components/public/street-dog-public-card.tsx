import { MapPin, QrCode } from "lucide-react";
import type { PublicStreetDogProfile } from "@/lib/firebase/community-mappers";

type StreetDogPublicCardProps = {
  dog: PublicStreetDogProfile;
};

export function StreetDogPublicCard({ dog }: StreetDogPublicCardProps) {
  return (
    <section className="grid gap-5 rounded-lg border border-bd-muted bg-surface p-4 md:grid-cols-[18rem_1fr]">
      <div className="overflow-hidden rounded-lg border border-bd-muted bg-surface-3">
        {dog.photoUrl ? (
          <img
            src={dog.photoUrl}
            alt=""
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="grid aspect-square place-items-center text-sm font-bold text-muted">
            Sem foto
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <InfoBadge label={dog.status} />
          <InfoBadge label={dog.size} />
          <InfoBadge label={dog.sex} />
        </div>

        <h2 className="text-2xl font-bold text-white">{dog.nickname}</h2>
        {dog.regionLabel ? (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
            <MapPin className="size-4 text-accent" strokeWidth={2.2} />
            {dog.regionLabel}
          </p>
        ) : null}

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoItem label="Cor" value={dog.color || "Nao informado"} />
          <InfoItem
            label="Raca aproximada"
            value={dog.approximateBreed || "Nao informado"}
          />
          <InfoItem
            label="Temperamento"
            value={dog.temperament || "Nao informado"}
          />
          <InfoItem label="Vacinacao" value={dog.vaccination} />
          <InfoItem label="Castracao" value={dog.neutering} />
          <InfoItem
            label="Localizacao"
            value={
              dog.latitude && dog.longitude
                ? `${dog.latitude}, ${dog.longitude}`
                : "Nao informada"
            }
          />
        </dl>

        {dog.notes ? (
          <div className="mt-5 rounded-lg border border-bd-muted bg-surface-3 p-4">
            <h3 className="text-sm font-bold text-white">Observacoes</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{dog.notes}</p>
          </div>
        ) : null}

        {dog.qrCodeId ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-md border border-bd-muted bg-surface-2 px-3 py-2 text-xs font-bold text-muted-light">
            <QrCode className="size-4 text-accent" strokeWidth={2.2} />
            QR Code: {dog.qrCodeId}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function InfoBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-neutral-border bg-neutral-bg px-2 text-xs font-bold text-neutral">
      {label}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bd-muted bg-surface-3 p-3">
      <dt className="text-xs font-bold uppercase text-placeholder">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-fg">{value}</dd>
    </div>
  );
}
