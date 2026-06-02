"use client";

import { FormEvent, useEffect, useState } from "react";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { Button } from "@/components/ui/button";

export type AdminSupportPointFormData = {
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
  approvalStatus: string;
  visibility: string;
};

type AdminSupportPointFormProps = {
  initialData?: AdminSupportPointFormData | null;
  isSaving?: boolean;
  onCancel?: () => void;
  onSubmit: (data: AdminSupportPointFormData) => void | Promise<void>;
};

const emptyForm: AdminSupportPointFormData = {
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
  approvalStatus: "pending",
  visibility: "public",
};

export function AdminSupportPointForm({
  initialData,
  isSaving = false,
  onCancel,
  onSubmit,
}: AdminSupportPointFormProps) {
  const [form, setForm] = useState<AdminSupportPointFormData>(emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData]);

  function updateField(
    field: keyof AdminSupportPointFormData,
    value: string | boolean,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          {initialData ? "Editar ponto de apoio" : "Novo ponto de apoio"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cadastre locais com racao, agua, doacao, apoio comunitario ou
          parceiros.
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
            { value: "commerce", label: "Comércio" },
            { value: "resident", label: "Residencial" },
            { value: "ngo", label: "ONG" },
            {
              value: "authorized_public_place",
              label: "Local público autorizado",
            },
            { value: "donation_point", label: "Ponto de doação" },
          ]}
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
          onChange={(event) =>
            updateField("organizationId", event.target.value)
          }
        />
        <SelectField
          label="Aprovacao"
          value={form.approvalStatus}
          onChange={(event) =>
            updateField("approvalStatus", event.target.value)
          }
          options={[
            { value: "pending", label: "Pendente" },
            { value: "approved", label: "Aprovado" },
            { value: "rejected", label: "Rejeitado" },
          ]}
        />
        <SelectField
          label="Visibilidade"
          value={form.visibility}
          onChange={(event) => updateField("visibility", event.target.value)}
          options={[
            { value: "public", label: "Público" },
            { value: "restricted", label: "Restrito" },
            { value: "private", label: "Privado" },
          ]}
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

      <div className="mt-5 flex justify-end gap-2">
        {onCancel ? (
          <Button
            onClick={onCancel}
            variant="secondary"
            size="md"
          >
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSaving}
          variant="primary"
          size="md"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
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
