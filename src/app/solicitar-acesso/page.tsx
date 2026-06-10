"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  HeartHandshake,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  FileText,
  Mail,
  Building,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";

type ActiveTab = "volunteer" | "partner";

type RequestStatus = {
  id: string;
  type: "volunteer" | "partner";
  name?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
};

export default function SolicitarAcessoPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("volunteer");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRequests, setUserRequests] = useState<RequestStatus[]>([]);

  // Form Volunteer
  const [vPhone, setVPhone] = useState("");
  const [vRegion, setVRegion] = useState("");
  const [vMotivation, setVMotivation] = useState("");

  // Form Partner
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState("petshop");
  const [pDocument, setPDocument] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pNotes, setPNotes] = useState("");

  // Listen to user's existing requests
  useEffect(() => {
    if (!db || !user) return;

    const unsubscribers = [
      onSnapshot(
        query(collection(db, "roleRequests"), where("userId", "==", user.uid)),
        (snapshot) => {
          const vRequests = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: "volunteer" as const,
              status: data.status,
              createdAt: data.createdAt,
            };
          });
          setUserRequests((prev) => {
            const partners = prev.filter((r) => r.type === "partner");
            return [...partners, ...vRequests];
          });
        }
      ),
      onSnapshot(
        query(collection(db, "organizations"), where("ownerUserId", "==", user.uid)),
        (snapshot) => {
          const pRequests = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: "partner" as const,
              name: data.name,
              status: data.status,
              createdAt: data.createdAt,
            };
          });
          setUserRequests((prev) => {
            const volunteers = prev.filter((r) => r.type === "volunteer");
            return [...volunteers, ...pRequests];
          });
        }
      ),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user]);

  async function handleVolunteerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user) return;

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "roleRequests"), {
        userId: user.uid,
        requestedRole: "volunteer",
        phone: vPhone.trim(),
        region: vRegion.trim(),
        motivation: vMotivation.trim(),
        status: "pending",
        displayName: user.displayName || "Usuário",
        email: user.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage("Solicitação de voluntário enviada com sucesso! O administrador revisará seu pedido em breve.");
      setVPhone("");
      setVRegion("");
      setVMotivation("");
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user) return;

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "organizations"), {
        name: pName.trim(),
        type: pType,
        document: pDocument.trim(),
        phone: pPhone.trim(),
        email: pEmail.trim(),
        notes: pNotes.trim(),
        status: "pending",
        ownerUserId: user.uid,
        memberUserIds: [user.uid],
        isPublicPartner: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage("Solicitação de cadastro de organização enviada com sucesso! O administrador revisará sua organização em breve.");
      setPName("");
      setPDocument("");
      setPPhone("");
      setPEmail("");
      setPNotes("");
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout showNavigation>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mb-6 inline-flex size-14 items-center justify-center rounded-full bg-warning-bg border border-warning-border text-warning">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
          <p className="mt-2 text-sm text-muted">
            Você precisa estar logado na plataforma para enviar solicitações de acesso.
          </p>
          <div className="mt-8">
            <Button onClick={() => router.push("/login")} variant="primary" size="lg">
              Fazer Login
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  const role = profile?.role ?? "public";

  // If the user already has access, let them know, but still allow registration if they are a volunteer/partner but want to see requests, OR if they are admin.
  // Wait, if a volunteer wants to register an organization, that's possible. But let's show status of their role.
  const roleLabels = {
    admin: "Administrador",
    partner: "Parceiro",
    volunteer: "Voluntário (Cuidador)",
    public: "Usuário Público",
  };

  return (
    <AppLayout showNavigation>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        
        {/* Header Section */}
        <section className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Quero Ajudar
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            Seja cuidando de animais necessitados como Voluntário ou integrando seu negócio/ONG como Parceiro.
          </p>
          
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-bd-muted bg-surface-3 px-3 py-1 text-xs">
            <span className="text-muted">Seu papel atual:</span>
            <span className="font-bold text-accent">{roleLabels[role]}</span>
          </div>
        </section>

        {/* Display Status of Existing Requests */}
        {userRequests.length > 0 && (
          <section className="mb-10 rounded-lg border border-bd-muted bg-surface p-5 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <Clock className="size-5 text-accent" />
              Suas Solicitações Anteriores
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {userRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-md border border-bd-muted bg-surface-3 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {request.type === "volunteer"
                        ? "Acesso de Voluntário"
                        : `Organização: ${request.name || "Sem Nome"}`}
                    </p>
                    <p className="text-xs text-muted">
                      {request.type === "volunteer" ? "Candidatura" : "Parceria comercial/ONG"}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      request.status === "approved"
                        ? "bg-success-bg text-success-light border border-success"
                        : request.status === "rejected"
                        ? "bg-error-bg text-error-light border border-error"
                        : "bg-warning-bg text-warning-light border border-warning-border"
                    }`}
                  >
                    {request.status === "approved"
                      ? "Aprovado"
                      : request.status === "rejected"
                      ? "Rejeitado"
                      : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Success or Error Alert */}
        {successMessage && (
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-success bg-success-bg px-4 py-3 text-sm text-success-light">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {role === "public" ? (
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            
            {/* Nav Cards */}
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("volunteer");
                  setError("");
                  setSuccessMessage("");
                }}
                className={`group flex items-start gap-4 rounded-lg border p-4 text-left transition ${
                  activeTab === "volunteer"
                    ? "border-accent bg-accent/10"
                    : "border-bd-muted bg-surface hover:border-bd-muted/80 hover:bg-surface-2"
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                  activeTab === "volunteer" ? "bg-accent text-accent-contrast" : "bg-surface-3 text-muted group-hover:text-white"
                }`}>
                  <HeartHandshake className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Quero ser Voluntário</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Ajude cuidando de animais comunitários, alimentando pontos de apoio e registrando cães.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("partner");
                  setError("");
                  setSuccessMessage("");
                }}
                className={`group flex items-start gap-4 rounded-lg border p-4 text-left transition ${
                  activeTab === "partner"
                    ? "border-accent bg-accent/10"
                    : "border-bd-muted bg-surface hover:border-bd-muted/80 hover:bg-surface-2"
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                  activeTab === "partner" ? "bg-accent text-accent-contrast" : "bg-surface-3 text-muted group-hover:text-white"
                }`}>
                  <Store className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Cadastrar Organização</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Registre seu Petshop, Clínica, ONG ou Comércio parceiro para gerenciar serviços e parcerias.
                  </p>
                </div>
              </button>
            </div>

            {/* Form Box */}
            <div className="rounded-lg border border-bd-muted bg-surface p-6 shadow-xl shadow-black/10">
              {activeTab === "volunteer" ? (
                <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Candidatura a Voluntário</h2>
                    <p className="mt-1 text-xs text-muted">
                      Preencha os dados abaixo. Após aprovação, você receberá permissão para registrar e editar animais de rua e pontos de apoio.
                    </p>
                  </div>

                  <InputField
                    label="Telefone para Contato"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    icon={<Phone className="size-4" />}
                    required
                  />

                  <InputField
                    label="Região / Cidade de Atuação"
                    type="text"
                    placeholder="Ex: Zona Norte, Centro, Copacabana"
                    value={vRegion}
                    onChange={(e) => setVRegion(e.target.value)}
                    icon={<MapPin className="size-4" />}
                    required
                  />

                  <TextareaField
                    label="Por que deseja se voluntariar? (Motivação)"
                    placeholder="Conte resumidamente como pretende ajudar e sua relação com os animais..."
                    value={vMotivation}
                    onChange={(e) => setVMotivation(e.target.value)}
                    required
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                      className="w-full"
                    >
                      {isSubmitting ? "Enviando..." : "Enviar Candidatura"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePartnerSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Cadastro de Organização</h2>
                    <p className="mt-1 text-xs text-muted">
                      Registre sua ONG ou empresa comercial. O administrador revisará os dados para ativação e vinculação do seu papel de Parceiro.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="Nome da Organização"
                      type="text"
                      placeholder="Ex: Clínica Veterinária Amigo Pet"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      icon={<Building className="size-4" />}
                      required
                    />

                    <SelectField
                      label="Tipo da Organização"
                      value={pType}
                      onChange={(e) => setPType(e.target.value)}
                      options={[
                        { value: "petshop", label: "Petshop" },
                        { value: "ngo", label: "ONG / Protetora" },
                        { value: "commerce", label: "Comércio Solidário" },
                        { value: "community_group", label: "Grupo Comunitário" },
                        { value: "public_agency", label: "Agência Pública" },
                      ]}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="CNPJ / CPF"
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={pDocument}
                      onChange={(e) => setPDocument(e.target.value)}
                      icon={<FileText className="size-4" />}
                      required
                    />

                    <InputField
                      label="E-mail da Organização"
                      type="email"
                      placeholder="contato@organizacao.com"
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                      icon={<Mail className="size-4" />}
                      required
                    />
                  </div>

                  <InputField
                    label="Telefone da Organização"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    icon={<Phone className="size-4" />}
                    required
                  />

                  <TextareaField
                    label="Observações / Notas Adicionais"
                    placeholder="Adicione qualquer detalhe que ajude na homologação (ex: link do instagram, site, etc.)"
                    value={pNotes}
                    onChange={(e) => setPNotes(e.target.value)}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                      className="w-full"
                    >
                      {isSubmitting ? "Enviando..." : "Enviar Solicitação de Parceria"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        ) : (
          <div className="rounded-lg border border-bd-muted bg-surface p-8 text-center max-w-lg mx-auto shadow-xl">
            <div className="mb-6 inline-flex size-14 items-center justify-center rounded-full bg-accent/10 border border-accent text-accent">
              <UserCheck className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Você já possui acesso de nível:</h2>
            <p className="mt-1 text-sm font-bold text-accent uppercase tracking-wider">
              {roleLabels[role]}
            </p>
            <p className="mt-4 text-xs text-muted leading-relaxed">
              Você já pode utilizar os recursos correspondentes ao seu perfil de acesso. Caso precise de alteração para outro tipo de conta especial, entre em contato diretamente com o administrador.
            </p>
            <div className="mt-8">
              <Button onClick={() => router.push("/")} variant="primary" size="md">
                Ir para o Início
              </Button>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}
