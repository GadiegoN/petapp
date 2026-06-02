"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { DuplicateCandidate } from "@/lib/duplicates/community-duplicates";
import { DuplicatePreview } from "./duplicate-preview";

export type StreetDogSubmissionFormData = {
  nickname: string;
  photoUrl: string;
  sex: string;
  size: string;
  color: string;
  approximateBreed: string;
  temperament: string;
  notes: string;
  status: string;
  vaccination: string;
  neutering: string;
  regionLabel: string;
  latitude: string;
  longitude: string;
};

type StreetDogSubmissionFormProps = {
  initialData?: StreetDogSubmissionFormData | null;
  duplicates: DuplicateCandidate[];
  isSaving?: boolean;
  onCancel?: () => void;
  onChange?: (data: StreetDogSubmissionFormData) => void;
  onSubmit: (data: StreetDogSubmissionFormData) => void | Promise<void>;
};

const emptyForm: StreetDogSubmissionFormData = {
  nickname: "",
  photoUrl: "",
  sex: "unknown",
  size: "unknown",
  color: "",
  approximateBreed: "",
  temperament: "",
  notes: "",
  status: "street",
  vaccination: "unknown",
  neutering: "unknown",
  regionLabel: "",
  latitude: "",
  longitude: "",
};

export function StreetDogSubmissionForm({
  initialData,
  duplicates,
  isSaving = false,
  onCancel,
  onChange,
  onSubmit,
}: StreetDogSubmissionFormProps) {
  const [form, setForm] = useState<StreetDogSubmissionFormData>(emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData]);

  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  function updateField(field: keyof StreetDogSubmissionFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateStreetDogForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    await onSubmit(form);
    if (!initialData) {
      setForm(emptyForm);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-bd-muted bg-surface p-4"
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">
          {initialData ? "Editar envio" : "Enviar cao de rua"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          O cadastro entra como pendente e sera revisado por um administrador.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Nome ou apelido"
          value={form.nickname}
          onChange={(event) => updateField("nickname", event.target.value)}
        />
        <InputField
          label="URL da foto"
          value={form.photoUrl}
          onChange={(event) => updateField("photoUrl", event.target.value)}
        />
        <SelectField
          label="Sexo"
          value={form.sex}
          onChange={(event) => updateField("sex", event.target.value)}
          required
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "male", label: "Macho" },
            { value: "female", label: "Femea" },
          ]}
        />
        <SelectField
          label="Porte"
          value={form.size}
          onChange={(event) => updateField("size", event.target.value)}
          required
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "small", label: "Pequeno" },
            { value: "medium", label: "Medio" },
            { value: "large", label: "Grande" },
            { value: "giant", label: "Gigante" },
          ]}
        />
        <InputField
          label="Cor"
          value={form.color}
          onChange={(event) => updateField("color", event.target.value)}
          required
        />
        <InputField
          label="Raca aproximada"
          value={form.approximateBreed}
          onChange={(event) =>
            updateField("approximateBreed", event.target.value)
          }
        />
        <InputField
          label="Temperamento"
          value={form.temperament}
          onChange={(event) => updateField("temperament", event.target.value)}
        />
        <InputField
          label="Regiao"
          value={form.regionLabel}
          onChange={(event) => updateField("regionLabel", event.target.value)}
          required
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
          options={[
            { value: "street", label: "Rua" },
            { value: "rescued", label: "Resgatado" },
            { value: "adopted", label: "Adotado" },
            { value: "missing", label: "Desaparecido" },
            { value: "deceased", label: "Falecido" },
          ]}
        />
        <SelectField
          label="Vacinacao"
          value={form.vaccination}
          onChange={(event) => updateField("vaccination", event.target.value)}
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "yes", label: "Sim" },
            { value: "no", label: "Nao" },
            { value: "partial", label: "Parcial" },
          ]}
        />
        <SelectField
          label="Castracao"
          value={form.neutering}
          onChange={(event) => updateField("neutering", event.target.value)}
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "yes", label: "Sim" },
            { value: "no", label: "Nao" },
            { value: "partial", label: "Parcial" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => updateField("latitude", event.target.value)}
          />
          <InputField
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => updateField("longitude", event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <TextareaField
          label="Observacoes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
      </div>

      <div className="mt-4">
        <DuplicatePreview candidates={duplicates} />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {onCancel ? (
          <Button onClick={onCancel} variant="secondary" size="md">
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSaving} variant="primary" size="md">
          {isSaving ? "Salvando..." : "Enviar"}
        </Button>
      </div>
    </form>
  );
}

function validateStreetDogForm(form: StreetDogSubmissionFormData) {
  if (form.sex === "unknown") {
    return "Informe o sexo do cao ou revise antes de enviar.";
  }

  if (form.size === "unknown") {
    return "Informe o porte do cao.";
  }

  if (!form.color.trim()) {
    return "Informe a cor do cao.";
  }

  if (!form.regionLabel.trim()) {
    return "Informe a regiao onde o cao costuma ficar.";
  }

  if (
    !form.nickname.trim() &&
    !form.photoUrl.trim() &&
    !form.notes.trim()
  ) {
    return "Informe pelo menos apelido, foto ou observacoes para ajudar na identificacao.";
  }

  const hasLatitude = form.latitude.trim().length > 0;
  const hasLongitude = form.longitude.trim().length > 0;

  if (hasLatitude !== hasLongitude) {
    return "Informe latitude e longitude juntas, ou deixe as duas em branco.";
  }

  return "";
}
