"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Store,
  Save,
  MapPin,
  Navigation,
  Map,
  Crown,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
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

  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const isOwnerOrAdmin =
    profile?.role === "admin" || (activeOrg && activeOrg.ownerUserId === user?.uid);

  // Members Management Fields
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

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
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");

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
      const isOrgPlanPro = org.plan === "pro";
      setPlan(org.plan || "free");
      setIsPublic(isOrgPlanPro ? org.isPublicPartner === true : false);

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

  // Handle plan upgrade via Stripe Checkout
  async function handleUpgradePlan() {
    if (!user || !activeOrgId) return;
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrgId,
          userId: user.uid,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erro ao iniciar checkout");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao realizar upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  }

  // Handle adding a team member
  async function handleAddMember() {
    if (!db || !activeOrgId || !activeOrg) return;

    const emailToFind = memberEmail.trim().toLowerCase();
    if (!emailToFind) {
      toast.error("Por favor, digite um e-mail válido.");
      return;
    }

    const currentMembers = activeOrg.members || [];
    if (currentMembers.length >= 3) {
      toast.error("O limite máximo é de 3 membros na equipe.");
      return;
    }

    setIsAddingMember(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", emailToFind), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("Usuário não cadastrado. Peça para o membro se cadastrar no app primeiro.");
        setIsAddingMember(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userUid = userDoc.id;

      if (userUid === activeOrg.ownerUserId) {
        toast.error("Este usuário é o dono da organização.");
        setIsAddingMember(false);
        return;
      }

      const currentMemberIds = activeOrg.memberUserIds || [];
      if (currentMemberIds.includes(userUid)) {
        toast.error("Este usuário já faz parte da equipe.");
        setIsAddingMember(false);
        return;
      }

      const newMember = {
        uid: userUid,
        displayName: userData.displayName || "Sem nome",
        email: userData.email,
      };

      await updateDoc(doc(db, "organizations", activeOrgId), {
        memberUserIds: arrayUnion(userUid),
        members: arrayUnion(newMember),
      });

      setMemberEmail("");
      toast.success("Membro adicionado com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
      toast.error("Erro ao adicionar membro da equipe.");
    } finally {
      setIsAddingMember(false);
    }
  }

  // Handle removing a team member
  async function handleRemoveMember(memberUid: string) {
    if (!db || !activeOrgId || !activeOrg) return;

    const memberToRemove = activeOrg.members?.find((m) => m.uid === memberUid);
    if (!memberToRemove) return;

    try {
      await updateDoc(doc(db, "organizations", activeOrgId), {
        memberUserIds: arrayRemove(memberUid),
        members: arrayRemove(memberToRemove),
      });
      toast.success("Membro removido com sucesso.");
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      toast.error("Erro ao remover membro da equipe.");
    }
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
        isPublicPartner: plan === "pro" ? isPublic : false,
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
            {!isOwnerOrAdmin && (
              <div className="lg:col-span-2 rounded-lg border border-warning-border bg-warning-bg/40 p-4 text-sm text-warning leading-relaxed">
                Você está visualizando esta organização como membro da equipe. Apenas o proprietário (Dono) pode editar as informações ou alterar o plano.
              </div>
            )}
            
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
                  disabled={!isOwnerOrAdmin}
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
                    disabled={!isOwnerOrAdmin}
                  />

                  <InputField
                    label="CNPJ / CPF"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Telefone de Contato"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    disabled={!isOwnerOrAdmin}
                  />

                  <InputField
                    label="E-mail de Contato"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                <label className={`flex items-center gap-3 rounded-md border border-bd-muted bg-surface-3 px-3 py-2 text-sm font-bold text-white select-none ${plan === "free" || !isOwnerOrAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={plan === "pro" && isPublic}
                    disabled={plan === "free" || !isOwnerOrAdmin}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer disabled:cursor-not-allowed"
                  />
                  Exibir no mapa público do Mundo Pet
                </label>
                {plan === "free" && (
                  <p className="text-xs text-amber-500 font-medium mt-1">
                    * Disponível apenas no Plano Pro. Faça o upgrade abaixo para ativar.
                  </p>
                )}
              </section>

              {/* Subscription Plan Section */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-bd-muted pb-3 flex items-center gap-2">
                  <Crown className="size-5 text-accent" /> Plano de Assinatura
                </h2>

                {plan === "pro" ? (
                  <div className="rounded-md border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
                    <div className="size-10 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                      <Crown className="size-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        Plano Pro Ativo <Sparkles className="size-4 text-amber-400 animate-pulse" />
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Todos os limites de clientes, pets e agendamentos foram desbloqueados.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border border-bd-muted bg-surface-3 p-4 flex items-center gap-3">
                      <div className="size-10 rounded-full bg-surface-2 text-muted flex items-center justify-center shrink-0">
                        <Crown className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Plano Gratuito
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          Limite de 5 clientes, 5 pets e 10 agendamentos na plataforma.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => void handleUpgradePlan()}
                      disabled={isUpgrading || !isOwnerOrAdmin}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(155,135,255,0.25)]"
                    >
                      <span>{isUpgrading ? "Processando..." : "Fazer Upgrade para Pro"}</span>
                    </Button>
                  </div>
                )}
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
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>
                  <InputField
                    label="Número"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Bairro"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Centro"
                    disabled={!isOwnerOrAdmin}
                  />

                  <InputField
                    label="Complemento"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Sala 2, Fundos"
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Belo Horizonte"
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>

                  <InputField
                    label="Estado (UF)"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="MG"
                    maxLength={2}
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                <InputField
                  label="CEP"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00000-000"
                  disabled={!isOwnerOrAdmin}
                />
              </section>
            </div>

            {/* Right Column: Interactive Map Geolocation */}
            <div className="space-y-6">
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4 flex flex-col">
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
                      disabled={isGeocoding || !isOwnerOrAdmin}
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
                      disabled={!isOwnerOrAdmin}
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
                    readonly={!isOwnerOrAdmin}
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
                      disabled={!isOwnerOrAdmin}
                    />

                    <InputField
                      label="Longitude"
                      type="number"
                      step="any"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      required
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-bd-muted/50 mt-6 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    disabled={isSaving || !isOwnerOrAdmin}
                    icon={<Save className="size-4" />}
                  >
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </section>

              {/* Seção de Membros da Equipe */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-bd-muted pb-3 flex items-center gap-2">
                  <Users className="size-5 text-accent" /> Membros da Equipe
                </h2>

                {plan !== "pro" ? (
                  <div className="rounded-lg border border-bd-muted bg-surface-3 p-6 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="mx-auto size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Lock className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">Disponível no Plano Pro</h3>
                      <p className="text-xs text-muted max-w-xs mx-auto">
                        Adicione até 3 membros na sua equipe para colaborar e gerenciar clientes, pets e a agenda.
                      </p>
                    </div>
                    {isOwnerOrAdmin && (
                      <Button
                        type="button"
                        onClick={() => void handleUpgradePlan()}
                        disabled={isUpgrading}
                        variant="primary"
                        size="sm"
                        className="w-full max-w-xs mx-auto flex items-center justify-center"
                      >
                        {isUpgrading ? "Processando..." : "Fazer Upgrade para Pro"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Listagem de Membros */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase text-muted tracking-wider">
                        Membros Ativos ({activeOrg?.members?.length || 0} de 3)
                      </h3>

                      {!activeOrg?.members || activeOrg.members.length === 0 ? (
                        <p className="text-xs text-muted italic p-3 bg-surface-3 rounded-md border border-bd-muted/50">
                          Nenhum membro adicionado ainda.
                        </p>
                      ) : (
                        <div className="divide-y divide-bd-muted/30 rounded-md border border-bd-muted/50 bg-surface-3 overflow-hidden">
                          {activeOrg.members.map((member) => (
                            <div key={member.uid} className="flex items-center justify-between p-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">
                                  {member.displayName}
                                </p>
                                <p className="text-xs text-muted truncate">
                                  {member.email}
                                </p>
                              </div>
                              {isOwnerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveMember(member.uid)}
                                  className="p-1 text-muted hover:text-danger transition-colors rounded hover:bg-surface-4 ml-2"
                                  title="Remover membro"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Formulário para Adicionar */}
                    {isOwnerOrAdmin && (
                      <div className="pt-2 border-t border-bd-muted/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase text-muted tracking-wider">
                          Adicionar Novo Membro
                        </h3>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <InputField
                              label="E-mail do Usuário"
                              type="email"
                              placeholder="exemplo@email.com"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              disabled={isAddingMember || (activeOrg?.members?.length || 0) >= 3}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => void handleAddMember()}
                            disabled={isAddingMember || !memberEmail.trim() || (activeOrg?.members?.length || 0) >= 3}
                            variant="primary"
                            className="h-11 shrink-0"
                            icon={<Plus className="size-4" />}
                          >
                            {isAddingMember ? "..." : "Adicionar"}
                          </Button>
                        </div>
                        {(activeOrg?.members?.length || 0) >= 3 && (
                          <p className="text-xs text-warning-border">
                            Limite de 3 membros atingido. Remova um membro para adicionar outro.
                          </p>
                        )}
                        <p className="text-[10px] text-muted leading-normal">
                          O usuário precisa já estar cadastrado na plataforma para ser adicionado à equipe.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

          </form>
        )}
      </main>
    </AppLayout>
  );
}
