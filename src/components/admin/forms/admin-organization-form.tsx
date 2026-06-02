"use client";

import { FormEvent, useEffect, useState } from "react";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";

export type AdminOrganizationFormData = {
  name: string;
  type: string;
  document: string;
  phone: string;
  email: string;
  ownerUserId: string;
  status: string;
  isPublicPartner: boolean;
};

type AdminOrganizationFormProps = {
  initialData?: AdminOrganizationFormData | null;
  isSaving?: boolean;
  onCancel?: () => void;
  onSubmit: (data: AdminOrganizationFormData) => void | Promise<void>;
};

const emptyForm: AdminOrganizationFormData = {
  name: "",
  type: "petshop",
  document: "",
  phone: "",
  email: "",
  ownerUserId: "",
  status: "pending",
  isPublicPartner: false,
};

export function AdminOrganizationForm({
  initialData,
  isSaving = false,
  onCancel,
  onSubmit,
}: AdminOrganizationFormProps) {
  const [form, setForm] = useState<AdminOrganizationFormData>(emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData]);

  function updateField(
    field: keyof AdminOrganizationFormData,
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
          {initialData ? "Editar organizacao" : "Nova organizacao"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cadastre petshops, ONGs, comercios partners e grupos comunitarios.
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
            { value: "ngo", label: "ONG" },
            { value: "commerce", label: "Comércio" },
            { value: "community_group", label: "Grupo comunitário" },
            { value: "public_agency", label: "Agência pública" },
          ]}
        />
        <InputField
          label="Documento"
          value={form.document}
          onChange={(event) => updateField("document", event.target.value)}
        />
        <InputField
          label="Telefone"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />
        <InputField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
        <InputField
          label="ID do usuario responsavel"
          value={form.ownerUserId}
          onChange={(event) => updateField("ownerUserId", event.target.value)}
          required
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
          options={[
            { value: "pending", label: "Pendente" },
            { value: "approved", label: "Aprovado" },
            { value: "suspended", label: "Suspenso" },
          ]}
        />
        <label className="flex min-h-11 items-center gap-3 rounded-md border border-bd-muted bg-surface-4 px-3 text-sm font-bold text-white">
          <input
            type="checkbox"
            checked={form.isPublicPartner}
            onChange={(event) =>
              updateField("isPublicPartner", event.target.checked)
            }
            className="size-4 accent-accent"
          />
          Parceiro publico
        </label>
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
