"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { DuplicateCandidate } from "@/lib/duplicates/community-duplicates";
import { DuplicatePreview } from "./duplicate-preview";

export type SupportPointSubmissionFormData = {
  name: string;
  type: string;
  latitude: string;
  longitude: string;
  foodAvailable: boolean;
  waterAvailable: boolean;
  needsRestock: boolean;
  commonHours: string;
  responsibleName: string;
  responsibleContact: string;
  organizationId: string;
  notes: string;
};

type SupportPointSubmissionFormProps = {
  initialData?: SupportPointSubmissionFormData | null;
  duplicates: DuplicateCandidate[];
  isSaving?: boolean;
  onCancel?: () => void;
  onChange?: (data: SupportPointSubmissionFormData) => void;
  onSubmit: (data: SupportPointSubmissionFormData) => void | Promise<void>;
};

const emptyForm: SupportPointSubmissionFormData = {
  name: "",
  type: "donation_point",
  latitude: "",
  longitude: "",
  foodAvailable: false,
  waterAvailable: false,
  needsRestock: false,
  commonHours: "",
  responsibleName: "",
  responsibleContact: "",
  organizationId: "",
  notes: "",
};

export function SupportPointSubmissionForm({
  initialData,
  duplicates,
  isSaving = false,
  onCancel,
  onChange,
  onSubmit,
}: SupportPointSubmissionFormProps) {
  const [form, setForm] = useState<SupportPointSubmissionFormData>(emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData]);

  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  function updateField(
    field: keyof SupportPointSubmissionFormData,
    value: string | boolean,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSupportPointForm(form);
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
          {initialData ? "Editar envio" : "Enviar ponto de apoio"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          O ponto entra como pendente e sera revisado antes de aparecer no mapa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Nome"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <SelectField
          label="Tipo"
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
          options={[
            { value: "petshop", label: "Petshop" },
            { value: "commerce", label: "Comercio" },
            { value: "resident", label: "Morador" },
            { value: "ngo", label: "ONG" },
            { value: "authorized_public_place", label: "Local autorizado" },
            { value: "donation_point", label: "Ponto de doacao" },
          ]}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => updateField("latitude", event.target.value)}
            required
          />
          <InputField
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => updateField("longitude", event.target.value)}
            required
          />
        </div>
        <InputField
          label="Horario comum"
          value={form.commonHours}
          onChange={(event) => updateField("commonHours", event.target.value)}
        />
        <InputField
          label="Responsavel"
          value={form.responsibleName}
          onChange={(event) =>
            updateField("responsibleName", event.target.value)
          }
          required
        />
        <InputField
          label="Contato do responsavel"
          value={form.responsibleContact}
          onChange={(event) =>
            updateField("responsibleContact", event.target.value)
          }
        />
        <InputField
          label="ID da organizacao vinculada"
          value={form.organizationId}
          onChange={(event) => updateField("organizationId", event.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <CheckboxField
          label="Tem racao"
          checked={form.foodAvailable}
          onChange={(value) => updateField("foodAvailable", value)}
        />
        <CheckboxField
          label="Tem agua"
          checked={form.waterAvailable}
          onChange={(value) => updateField("waterAvailable", value)}
        />
        <CheckboxField
          label="Precisa reposicao"
          checked={form.needsRestock}
          onChange={(value) => updateField("needsRestock", value)}
        />
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

function validateSupportPointForm(form: SupportPointSubmissionFormData) {
  if (!form.name.trim()) {
    return "Informe o nome do ponto de apoio.";
  }

  if (!form.type.trim()) {
    return "Informe o tipo do ponto de apoio.";
  }

  if (!form.latitude.trim() || !form.longitude.trim()) {
    return "Informe latitude e longitude do ponto.";
  }

  if (!Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude))) {
    return "Latitude e longitude precisam ser numeros validos.";
  }

  if (!form.responsibleName.trim()) {
    return "Informe o responsavel pelo ponto.";
  }

  if (
    !form.foodAvailable &&
    !form.waterAvailable &&
    !form.needsRestock &&
    form.type !== "donation_point"
  ) {
    return "Informe se ha racao, agua ou necessidade de reposicao.";
  }

  return "";
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-bd-muted bg-surface-4 px-3 text-sm font-bold text-white">
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
