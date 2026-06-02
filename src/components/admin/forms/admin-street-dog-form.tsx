"use client";

import { FormEvent, useEffect, useState } from "react";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { Button } from "@/components/ui/button";

export type AdminStreetDogFormData = {
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
  approvalStatus: string;
  visibility: string;
};

type AdminStreetDogFormProps = {
  initialData?: AdminStreetDogFormData | null;
  isSaving?: boolean;
  onCancel?: () => void;
  onSubmit: (data: AdminStreetDogFormData) => void | Promise<void>;
};

const emptyForm: AdminStreetDogFormData = {
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
  approvalStatus: "pending",
  visibility: "public",
};

export function AdminStreetDogForm({
  initialData,
  isSaving = false,
  onCancel,
  onSubmit,
}: AdminStreetDogFormProps) {
  const [form, setForm] = useState<AdminStreetDogFormData>(emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData]);

  function updateField(field: keyof AdminStreetDogFormData, value: string) {
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
          {initialData ? "Editar cao de rua" : "Novo cao de rua"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Registre dados publicos, saude, localizacao e situacao do animal.
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
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "male", label: "Macho" },
            { value: "female", label: "Fêmea" },
          ]}
        />
        <SelectField
          label="Porte"
          value={form.size}
          onChange={(event) => updateField("size", event.target.value)}
          options={[
            { value: "unknown", label: "Desconhecido" },
            { value: "small", label: "Pequeno" },
            { value: "medium", label: "Médio" },
            { value: "large", label: "Grande" },
            { value: "giant", label: "Gigante" },
          ]}
        />
        <InputField
          label="Cor"
          value={form.color}
          onChange={(event) => updateField("color", event.target.value)}
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
            { value: "no", label: "Não" },
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
            { value: "no", label: "Não" },
            { value: "partial", label: "Parcial" },
          ]}
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
