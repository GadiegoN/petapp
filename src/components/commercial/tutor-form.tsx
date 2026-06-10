"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { TextareaField } from "@/components/ui/textarea-field";

export type TutorSubmissionFormData = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string;
};

const emptyFormData: TutorSubmissionFormData = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  postalCode: "",
  complement: "",
};

type TutorFormProps = {
  initialData?: TutorSubmissionFormData | null;
  isSaving: boolean;
  onCancel?: () => void;
  onSubmit: (data: TutorSubmissionFormData) => void;
};

export function TutorForm({
  initialData,
  isSaving,
  onCancel,
  onSubmit,
}: TutorFormProps) {
  const [formData, setFormData] = useState<TutorSubmissionFormData>(emptyFormData);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Auto-expand address if any address field is filled
      const hasAddress = Boolean(
        initialData.street ||
          initialData.number ||
          initialData.district ||
          initialData.city ||
          initialData.state ||
          initialData.postalCode ||
          initialData.complement
      );
      if (hasAddress) {
        setShowAddress(true);
      }
    } else {
      setFormData(emptyFormData);
      setShowAddress(false);
    }
  }, [initialData]);

  function handleChange(
    field: keyof TutorSubmissionFormData,
    value: string
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <InputField
            label="Nome do Tutor *"
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nome completo do tutor"
          />
        </div>

        <InputField
          label="Telefone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="(00) 00000-0000"
        />

        <InputField
          label="E-mail"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="exemplo@email.com"
        />

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setShowAddress(!showAddress)}
            className="flex items-center gap-1 text-xs font-bold uppercase text-accent transition hover:text-accent-2"
          >
            {showAddress ? (
              <>
                Ocultar Endereço <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                Adicionar Endereço <ChevronDown className="size-4" />
              </>
            )}
          </button>
        </div>

        {showAddress && (
          <div className="grid gap-4 sm:grid-cols-3 sm:col-span-2 rounded-md border border-bd-muted/50 bg-surface-2 p-4">
            <div className="sm:col-span-2">
              <InputField
                label="Rua"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                placeholder="Rua, avenida, etc."
              />
            </div>
            <InputField
              label="Número"
              value={formData.number}
              onChange={(e) => handleChange("number", e.target.value)}
              placeholder="123"
            />
            <InputField
              label="Bairro"
              value={formData.district}
              onChange={(e) => handleChange("district", e.target.value)}
              placeholder="Bairro"
            />
            <InputField
              label="Cidade"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Cidade"
            />
            <InputField
              label="Estado"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
            <InputField
              label="CEP"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              placeholder="00000-000"
            />
            <div className="sm:col-span-2">
              <InputField
                label="Complemento"
                value={formData.complement}
                onChange={(e) => handleChange("complement", e.target.value)}
                placeholder="Apto, Bloco, etc."
              />
            </div>
          </div>
        )}

        <div className="sm:col-span-2">
          <TextareaField
            label="Observações"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Informações adicionais do cliente..."
          />
        </div>
      </div>

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
          disabled={isSaving || !formData.name.trim()}
          icon={<Save className="size-4" strokeWidth={2.2} />}
        >
          {isSaving ? "Salvando..." : "Salvar Tutor"}
        </Button>
      </div>
    </form>
  );
}
