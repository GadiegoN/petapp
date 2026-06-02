import { AlertTriangle } from "lucide-react";
import type { DuplicateCandidate } from "@/lib/duplicates/community-duplicates";

type DuplicatePreviewProps = {
  candidates: DuplicateCandidate[];
};

export function DuplicatePreview({ candidates }: DuplicatePreviewProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-warning-border bg-warning-bg/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-warning">
        <AlertTriangle className="size-4" strokeWidth={2.3} />
        <h3 className="text-sm font-bold uppercase">
          Possiveis cadastros parecidos
        </h3>
      </div>
      <p className="mb-3 text-sm leading-6 text-warning">
        Confira antes de enviar para evitar duplicidade na fila de aprovacao.
      </p>

      <ul className="space-y-2">
        {candidates.map((candidate) => (
          <li
            key={candidate.id}
            className="rounded-md border border-bd-muted bg-surface-3 p-3"
          >
            <p className="truncate text-sm font-bold text-white">
              {candidate.title}
            </p>
            {candidate.detail ? (
              <p className="truncate text-xs text-muted">{candidate.detail}</p>
            ) : null}
            <p className="mt-1 text-xs text-warning">
              {candidate.reasons.join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
