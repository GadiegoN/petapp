"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Store, Save, MapPin, Navigation, Map } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";
import type { Organization } from "@/types/domain";

// Load LocationSelectorMap dynamically to prevent server-side Leaflet build issues
const LocationSelectorMap = dynamic(
  () =>
    import("@/components/commercial/location-selector-map").then(
      (module) => module.LocationSelectorMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-80 place-items-center rounded-lg border border-bd-muted bg-surface-3 text-sm text-muted">
        Carregando mapa interativo...
      </div>
    ),
  }
);

export default function OrgProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  // Organizations list and selection
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState("");
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("petshop");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Address Fields
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [complement, setComplement] = useState("");

  // Coordinates Fields
  const [lat, setLat] = useState(-19.936);
  const [lng, setLng] = useState(-47.542);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  // Load organizations
  useEffect(() => {
    if (!db || !user || !profile) return;

    setIsOrgsLoading(true);
    let orgsQuery;

    if (profile.role === "admin") {
      orgsQuery = query(collection(db, "organizations"));
    } else if (profile.organizationIds && profile.organizationIds.length > 0) {
      orgsQuery = query(
        collection(db, "organizations"),
        where(documentId(), "in", profile.organizationIds)
      );
    } else {
      setOrganizations([]);
      setIsOrgsLoading(false);
      return;
    }

    return onSnapshot(
      orgsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Organization[];
        setOrganizations(list);
        if (list.length > 0) {
          setActiveOrgId((current) => current || list[0].id);
        }
        setIsOrgsLoading(false);
      },
      () => {
        setIsOrgsLoading(false);
      }
    );
  }, [user, profile]);

  // Load active organization details into form
  useEffect(() => {
    const org = organizations.find((o) => o.id === activeOrgId);
    if (org) {
      setName(org.name || "");
      setType(org.type || "petshop");
      setDocument(org.document || "");
      setPhone(org.phone || "");
      setEmail(org.email || "");
      setIsPublic(org.isPublicPartner === true);

      setStreet(org.address?.street || "");
      setNumber(org.address?.number || "");
      setDistrict(org.address?.district || "");
      setCity(org.address?.city || "");
      setState(org.address?.state || "");
      setPostalCode(org.address?.postalCode || "");
      setComplement(org.address?.complement || "");

      setLat(org.location?.latitude ?? -19.936);
      setLng(org.location?.longitude ?? -47.542);
    }
  }, [activeOrgId, organizations]);

  // Geocode address using Nominatim (OpenStreetMap)
  async function handleGeocode() {
    const addressQueryString = [street, number, district, city, state, postalCode]
      .filter(Boolean)
      .join(" ");

    if (!addressQueryString.trim()) {
      toast.error("Preencha o endereço antes de geolocalizar.");
      return;
    }

    setIsGeocoding(true);
    try {
      const queryParam = encodeURIComponent(
        `${street} ${number}, ${district}, ${city} - ${state}, ${postalCode}, Brasil`
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${queryParam}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const parsedLat = parseFloat(data[0].lat);
        const parsedLng = parseFloat(data[0].lon);
        setLat(parsedLat);
        setLng(parsedLng);
        toast.success("Coordenadas obtidas do mapa com sucesso!");
      } else {
        // Broad search fallback
        const broadQuery = encodeURIComponent(`${district}, ${city} - ${state}, Brasil`);
        const resBroad = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${broadQuery}&limit=1`
        );
        const dataBroad = await resBroad.json();

        if (dataBroad && dataBroad.length > 0) {
          const parsedLat = parseFloat(dataBroad[0].lat);
          const parsedLng = parseFloat(dataBroad[0].lon);
          setLat(parsedLat);
          setLng(parsedLng);
          toast.success("Posicionado no centro do bairro (endereço exato não localizado).");
        } else {
          toast.error("Não foi possível geolocalizar. Posicione o pin manualmente.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao consultar serviço de geolocalização.");
    } finally {
      setIsGeocoding(false);
    }
  }

  // Use current GPS geolocation
  function handleUseGPS() {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização por GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        toast.success("Sua localização GPS foi definida!");
      },
      () => {
        toast.error("Não foi possível obter sua localização atual.");
      }
    );
  }

  // Handle saving profile changes
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !activeOrgId || !can(profile?.role, "manage_organization")) return;

    if (!name.trim()) {
      toast.error("O nome da organização é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "organizations", activeOrgId), {
        name: name.trim(),
        type,
        document: document.trim(),
        phone: phone.trim(),
        email: email.trim(),
        isPublicPartner: isPublic,
        address: {
          street: street.trim(),
          number: number.trim(),
          district: district.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          postalCode: postalCode.trim(),
          complement: complement.trim(),
        },
        location: {
          latitude: lat,
          longitude: lng,
        },
        updatedAt: serverTimestamp(),
      });
      toast.success("Perfil da organização salvo com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar dados do perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isProfileLoading || isOrgsLoading || !user) {
    return (
      <AppLayout showNavigation>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!can(profile?.role, "manage_organization")) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[50vh] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            Seu perfil atual não possui permissão para gerenciar o perfil da organização.
          </section>
        </main>
      </AppLayout>
    );
  }

  const activeOrg = organizations.find((o) => o.id === activeOrgId);

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <UserSummary user={user} profile={profile} isProfileLoading={false} />

        {/* Title and Organization Switcher */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Store className="size-6 text-accent" /> Perfil da Organização
            </h1>
            <p className="mt-2 text-sm text-muted">
              Gerencie as informações públicas de contato, endereço e localização no mapa.
            </p>
          </div>

          {organizations.length > 1 && (
            <label className="block min-w-60">
              <span className="mb-1.5 block text-xs font-bold uppercase text-muted">
                Selecionar Estabelecimento
              </span>
              <select
                value={activeOrgId}
                onChange={(e) => setActiveOrgId(e.target.value)}
                className="h-10 w-full rounded-md border border-bd-muted bg-surface-3 px-3 text-sm text-white outline-none focus:border-accent"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-lg border border-warning-border bg-warning-bg/40 p-5 text-sm text-warning">
            Você não possui nenhuma organização homologada e vinculada ao seu usuário no momento.
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
            
            {/* Left Column: Details & Address */}
            <div className="space-y-6">
              
              {/* General Metadata */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-bd-muted pb-3">
                  Informações Gerais
                </h2>

                <InputField
                  label="Nome da Organização *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome público"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Tipo de Organização *"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    options={[
                      { value: "petshop", label: "Petshop" },
                      { value: "ngo", label: "ONG / Protetora" },
                      { value: "commerce", label: "Comércio" },
                      { value: "community_group", label: "Grupo Comunitário" },
                      { value: "public_agency", label: "Agência Pública" },
                    ]}
                    required
                  />

                  <InputField
                    label="CNPJ / CPF"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Telefone de Contato"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />

                  <InputField
                    label="E-mail de Contato"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-md border border-bd-muted bg-surface-3 px-3 py-2 text-sm font-bold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer"
                  />
                  Exibir no mapa público do Mundo Pet
                </label>
              </section>

              {/* Physical Address */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-bd-muted pb-3">
                  Endereço Físico
                </h2>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-3">
                    <InputField
                      label="Rua / Avenida"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua das Palmeiras"
                    />
                  </div>
                  <InputField
                    label="Número"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Bairro"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Centro"
                  />

                  <InputField
                    label="Complemento"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Sala 2, Fundos"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Belo Horizonte"
                    />
                  </div>

                  <InputField
                    label="Estado (UF)"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="MG"
                    maxLength={2}
                  />
                </div>

                <InputField
                  label="CEP"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00000-000"
                />
              </section>
            </div>

            {/* Right Column: Interactive Map Geolocation */}
            <div className="space-y-6">
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-base font-bold text-white border-b border-bd-muted pb-3 flex items-center gap-2 mb-4">
                    <MapPin className="size-5 text-accent" /> Geolocalização no Mapa
                  </h2>

                  <p className="text-xs text-muted mb-4 leading-relaxed">
                    Clique no mapa ou arraste o pin para definir a localização exata do seu negócio. Se preferir, digite o endereço à esquerda e utilize o botão abaixo para autodetectar.
                  </p>

                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      onClick={() => void handleGeocode()}
                      disabled={isGeocoding}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      icon={<Map className="size-4" />}
                    >
                      {isGeocoding ? "Localizando..." : "Geolocalizar pelo Endereço"}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleUseGPS}
                      variant="outline"
                      size="sm"
                      icon={<Navigation className="size-4" />}
                    >
                      Usar GPS
                    </Button>
                  </div>

                  {/* Leaflet selector map */}
                  <LocationSelectorMap
                    latitude={lat}
                    longitude={lng}
                    onChange={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                  />

                  {/* Lat/Lng Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <InputField
                      label="Latitude"
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      required
                    />

                    <InputField
                      label="Longitude"
                      type="number"
                      step="any"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-bd-muted/50 mt-6 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    disabled={isSaving}
                    icon={<Save className="size-4" />}
                  >
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </section>
            </div>

          </form>
        )}
      </main>
    </AppLayout>
  );
}
