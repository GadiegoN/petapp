"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { Tutor } from "@/types/domain";

export type DomesticPetSubmissionFormData = {
  tutorId: string;
  name: string;
  species: "dog" | "cat" | "other";
  sex: string;
  size: string;
  breed: string;
  birthDate: string;
  photoUrl: string;
  notes: string;
};

const emptyFormData: DomesticPetSubmissionFormData = {
  tutorId: "",
  name: "",
  species: "dog",
  sex: "unknown",
  size: "unknown",
  breed: "",
  birthDate: "",
  photoUrl: "",
  notes: "",
};

type DomesticPetFormProps = {
  tutors: Tutor[];
  initialData?: DomesticPetSubmissionFormData | null;
  isSaving: boolean;
  onCancel?: () => void;
  onSubmit: (data: DomesticPetSubmissionFormData) => void;
};

export function DomesticPetForm({
  tutors,
  initialData,
  isSaving,
  onCancel,
  onSubmit,
}: DomesticPetFormProps) {
  const [formData, setFormData] = useState<DomesticPetSubmissionFormData>(emptyFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        ...emptyFormData,
        tutorId: tutors.length > 0 ? tutors[0].id : "",
      });
    }
  }, [initialData, tutors]);

  function handleChange(
    field: keyof DomesticPetSubmissionFormData,
    value: string
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formData.name.trim() || !formData.tutorId) {
      return;
    }
    onSubmit(formData);
  }

  const tutorOptions = tutors.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const speciesOptions = [
    { value: "dog", label: "Cachorro" },
    { value: "cat", label: "Gato" },
    { value: "other", label: "Outro" },
  ];

  const sexOptions = [
    { value: "male", label: "Macho" },
    { value: "female", label: "Fêmea" },
    { value: "unknown", label: "Desconhecido" },
  ];

  const sizeOptions = [
    { value: "small", label: "Pequeno" },
    { value: "medium", label: "Médio" },
    { value: "large", label: "Grande" },
    { value: "giant", label: "Gigante" },
    { value: "unknown", label: "Desconhecido" },
  ];

  return (
    <form onSubmit={handleSubmit}>

      {tutors.length === 0 ? (
        <p className="rounded-md border border-warning-border bg-warning-bg/30 px-3 py-3 text-xs text-warning leading-5">
          Atenção: Nenhum tutor cadastrado. Cadastre um tutor antes de adicionar um pet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SelectField
              label="Tutor Responsável *"
              value={formData.tutorId}
              onChange={(e) => handleChange("tutorId", e.target.value)}
              options={tutorOptions}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Nome do Pet *"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Rex, Mel"
            />
          </div>

          <SelectField
            label="Espécie *"
            value={formData.species}
            onChange={(e) => handleChange("species", e.target.value as "dog" | "cat" | "other")}
            options={speciesOptions}
            required
          />

          <InputField
            label="Raça"
            value={formData.breed}
            onChange={(e) => handleChange("breed", e.target.value)}
            placeholder="Ex: Poodle, SRD"
          />

          <SelectField
            label="Sexo"
            value={formData.sex}
            onChange={(e) => handleChange("sex", e.target.value)}
            options={sexOptions}
          />

          <SelectField
            label="Porte"
            value={formData.size}
            onChange={(e) => handleChange("size", e.target.value)}
            options={sizeOptions}
          />

          <InputField
            label="Data de Nascimento"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange("birthDate", e.target.value)}
          />

          <InputField
            label="URL da Foto"
            type="url"
            value={formData.photoUrl}
            onChange={(e) => handleChange("photoUrl", e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
          />

          <div className="sm:col-span-2">
            <TextareaField
              label="Observações / Cuidados Especiais"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Ex: Alergia a picada de pulga, medos..."
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-bd-muted/65 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="md"
            disabled={isSaving}
            icon={<X className="size-4" strokeWidth={2.2} />}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSaving || tutors.length === 0 || !formData.name.trim() || !formData.tutorId}
          icon={<Save className="size-4" strokeWidth={2.2} />}
        >
          {isSaving ? "Salvando..." : "Salvar Pet"}
        </Button>
      </div>
    </form>
  );
}
