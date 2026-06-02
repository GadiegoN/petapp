# Plataforma Mundo Pet Comunitario

Este documento define a expansao do sistema atual para uma plataforma de cadastro, acompanhamento e apoio comunitario a caes de rua, mantendo o uso comercial por petshops e parceiros.

## Estado Atual

- Next.js App Router com React e Tailwind.
- Login Google via Firebase Authentication.
- Firestore usado diretamente na tela principal.
- Agendamentos em `appointments`, vinculados ao `userId`.
- Regras atuais permitem que cada usuario leia e altere apenas seus agendamentos.

O proximo passo arquitetural e separar dominio, acesso a dados, permissoes e componentes por modulo. A tela `src/app/page.tsx` deve deixar de concentrar regra de negocio e passar a usar componentes e hooks especializados.

## Modulos

### Comunidade

Modulo principal para caes de rua, pontos de apoio, alimentacao, agua, doacoes, patrocinio e historico publico.

Responsabilidades:

- Cadastro e moderacao de caes de rua.
- Historico de atualizacoes do animal.
- Pontos de apoio, alimentacao, agua e doacao.
- Mapa publico e administrativo.
- Pagina publica por QR Code.
- Relatos e observacoes de cuidadores.
- Patrocinios de animais e pontos.

### Petshop e Parceiros

Modulo comercial que preserva e expande a agenda existente.

Responsabilidades:

- Cadastro de tutores.
- Cadastro de animais domesticos.
- Agendamentos.
- Historico de servicos.
- Vacinas, banho, tosa, produtos e servicos utilizados.
- Gestao de clientes por estabelecimento.

### Administracao

Modulo de governanca da plataforma.

Responsabilidades:

- Moderar cadastros publicos.
- Aprovar usuarios autorizados.
- Gerenciar papeis e organizacoes.
- Validar pontos de apoio.
- Revisar denuncias, duplicidades e conteudo sensivel.
- Gerenciar patrocinadores e destaque de parceiros.

## Entidades

### users

Representa o usuario autenticado pelo Google.

Campos principais:

- `id`
- `displayName`
- `email`
- `photoURL`
- `role`: `admin`, `partner`, `volunteer`, `public`
- `organizationIds`
- `createdAt`
- `updatedAt`
- `lastLoginAt`
- `isActive`

### organizations

Representa petshops, ONGs, comercios parceiros e grupos comunitarios.

Campos principais:

- `id`
- `type`: `petshop`, `ngo`, `commerce`, `community_group`, `public_agency`
- `name`
- `document`
- `phone`
- `email`
- `address`
- `location`
- `ownerUserId`
- `memberUserIds`
- `isPublicPartner`
- `status`: `pending`, `approved`, `suspended`
- `createdAt`
- `updatedAt`

### streetDogs

Cadastro de caes de rua, comunitarios ou abandonados.

Campos principais:

- `id`
- `nickname`
- `photoUrl`
- `sex`: `male`, `female`, `unknown`
- `size`: `small`, `medium`, `large`, `giant`, `unknown`
- `color`
- `approximateBreed`
- `temperament`
- `notes`
- `status`: `street`, `rescued`, `adopted`, `missing`, `deceased`
- `vaccination`
- `neutering`
- `mainLocation`
- `regionLabel`
- `qrCodeId`
- `visibility`: `public`, `restricted`
- `createdByUserId`
- `approvedByUserId`
- `approvalStatus`: `pending`, `approved`, `rejected`
- `createdAt`
- `updatedAt`

### streetDogUpdates

Historico de acompanhamento dos caes de rua.

Campos principais:

- `id`
- `streetDogId`
- `type`: `sighting`, `feeding`, `health`, `vaccination`, `neutering`, `status_change`, `note`
- `description`
- `photoUrls`
- `location`
- `createdByUserId`
- `createdAt`
- `isPublic`

### supportPoints

Pontos de alimentacao, agua, apoio, doacao e parceiros.

Campos principais:

- `id`
- `name`
- `type`: `petshop`, `commerce`, `resident`, `ngo`, `authorized_public_place`, `donation_point`
- `location`
- `address`
- `foodAvailable`
- `waterAvailable`
- `needsRestock`
- `commonHours`
- `responsibleName`
- `responsibleContact`
- `notes`
- `organizationId`
- `approvalStatus`
- `visibility`
- `createdByUserId`
- `createdAt`
- `updatedAt`

### supportPointUpdates

Historico operacional dos pontos de apoio.

Campos principais:

- `id`
- `supportPointId`
- `type`: `food_refill`, `water_refill`, `stock_empty`, `maintenance`, `note`
- `description`
- `createdByUserId`
- `createdAt`

### sponsors

Cadastro de patrocinadores.

Campos principais:

- `id`
- `name`
- `type`: `person`, `company`, `organization`
- `logoUrl`
- `siteUrl`
- `contact`
- `visibility`
- `status`
- `createdAt`
- `updatedAt`

### sponsorships

Vinculo entre patrocinador e animal, ponto ou campanha.

Campos principais:

- `id`
- `sponsorId`
- `targetType`: `streetDog`, `supportPoint`, `campaign`
- `targetId`
- `title`
- `description`
- `startsAt`
- `endsAt`
- `status`: `active`, `paused`, `ended`
- `publicDisplay`

### tutors

Clientes dos petshops/parceiros.

Campos principais:

- `id`
- `organizationId`
- `name`
- `phone`
- `email`
- `address`
- `notes`
- `createdAt`
- `updatedAt`

### domesticPets

Animais domesticos vinculados a tutores.

Campos principais:

- `id`
- `organizationId`
- `tutorId`
- `name`
- `species`
- `sex`
- `size`
- `breed`
- `birthDate`
- `photoUrl`
- `notes`
- `createdAt`
- `updatedAt`

### appointments

Deve evoluir o modelo atual para pertencer a uma organizacao e, quando possivel, referenciar tutor e animal domestico.

Campos principais:

- `id`
- `organizationId`
- `tutorId`
- `domesticPetId`
- `date`
- `time`
- `period`
- `status`: `scheduled`, `confirmed`, `done`, `cancelled`, `no_show`
- `serviceIds`
- `productIds`
- `notes`
- `createdByUserId`
- `createdAt`
- `updatedAt`

Compatibilidade temporaria:

- Manter `userId`, `petName`, `tutorName`, `phone` durante a migracao.
- Novas telas devem gravar os campos normalizados.
- Um script futuro pode converter registros antigos em `tutors` e `domesticPets`.

### services

Servicos oferecidos por parceiros.

Campos principais:

- `id`
- `organizationId`
- `name`
- `description`
- `price`
- `durationMinutes`
- `isActive`

### products

Produtos usados ou vendidos por parceiros.

Campos principais:

- `id`
- `organizationId`
- `name`
- `description`
- `price`
- `stockQuantity`
- `isActive`

### petHealthRecords

Historico clinico e operacional de animais domesticos.

Campos principais:

- `id`
- `organizationId`
- `domesticPetId`
- `type`: `vaccine`, `bath`, `grooming`, `medicine`, `exam`, `note`
- `description`
- `date`
- `serviceIds`
- `productIds`
- `createdByUserId`
- `createdAt`

## Relacionamentos

- `users` N:N `organizations` por `organizationIds` ou subcolecao futura `organizationMembers`.
- `organizations` 1:N `tutors`.
- `organizations` 1:N `domesticPets`.
- `tutors` 1:N `domesticPets`.
- `domesticPets` 1:N `appointments`.
- `domesticPets` 1:N `petHealthRecords`.
- `organizations` 1:N `services`.
- `organizations` 1:N `products`.
- `streetDogs` 1:N `streetDogUpdates`.
- `supportPoints` 1:N `supportPointUpdates`.
- `sponsors` 1:N `sponsorships`.
- `sponsorships` N:1 `streetDogs`, `supportPoints` ou campanhas.

## Rotas e Paginas

## Navegacao

A aplicacao deve usar um unico componente de navegacao global baseado no papel do usuario. Nenhuma pagina autenticada deve montar menu proprio de troca entre areas principais.

Componente atual:

- `src/components/navigation/role-navigation.tsx`

Itens por papel:

- `admin`: Agenda, Admin, Caes de rua, Pontos de apoio, Mapa.
- `partner`: Agenda, Caes de rua, Pontos de apoio, Mapa.
- `volunteer`: Caes de rua, Pontos de apoio, Mapa.
- `public`: Mapa.

Subnavegacoes internas sao permitidas apenas dentro do modulo. Exemplo: o painel administrativo pode ter uma navegacao secundaria para Usuarios, Organizacoes, Aprovacoes e Moderacao, mas a navegacao global continua sendo a mesma.

### Publicas

- `/mapa`: mapa publico com caes, pontos, parceiros e doacoes.
- `/caes/[id]`: pagina publica do cachorro.
- `/q/[qrCodeId]`: rota curta aberta pelo QR Code.
- `/pontos/[id]`: pagina publica de ponto de apoio.
- `/parceiros`: lista de parceiros e patrocinadores publicos.

### Autenticadas

Depois do login, o usuario deve ser redirecionado diretamente conforme seu papel:

- `admin`: `/admin`
- `partner`: `/agenda`
- `volunteer`: `/caes-rua`
- `public`: `/mapa`

Rotas autenticadas:

- `/`: home publica.
- `/agenda`: agenda de petshop/parceiro.
- `/clientes`: tutores.
- `/pets`: animais domesticos.
- `/pets/[id]`: historico do animal domestico.
- `/caes-rua`: envio e acompanhamento de cadastros de caes de rua por usuarios autorizados.
- `/pontos-apoio`: envio e acompanhamento de pontos de apoio por usuarios autorizados.
- `/patrocinios`: patrocinadores e vinculos.

### Administrativas

- `/admin`: visao geral.
- `/admin/aprovacoes`: aprovacoes de caes, pontos e parceiros.
- `/admin/usuarios`: usuarios e papeis.
- `/admin/organizacoes`: organizacoes.
- `/admin/moderacao`: conteudo reportado e historicos sensiveis.

## Permissoes

### Administrador

- Gerencia todos os cadastros.
- Aprova, edita e remove conteudo.
- Define papeis.
- Modera dados publicos.

### Parceiro/Petshop

- Gerencia sua organizacao.
- Gerencia tutores, animais domesticos, agendamentos, servicos e produtos da organizacao.
- Pode cadastrar ponto de apoio vinculado ao estabelecimento, sujeito a regras de aprovacao.

### Cuidador ou voluntario

- Cadastra e atualiza caes de rua, conforme aprovacao.
- Registra alimentacao, avistamentos e observacoes.
- Atualiza necessidade de reposicao em pontos de apoio.
- Nao acessa dados privados de clientes de petshops.

### Publico

- Visualiza mapa publico.
- Consulta QR Codes.
- Visualiza dados publicos de animais e pontos.
- Nao altera dados.

## Painel Administrativo

Estrutura sugerida:

- Dashboard com contadores: caes em rua, resgatados, adotados, desaparecidos, pontos com reposicao necessaria e aprovacoes pendentes.
- Fila de aprovacoes: caes, pontos, parceiros, atualizacoes sensiveis.
- Mapa administrativo com filtros por status, especie de ponto, necessidade de reposicao e parceiro.
- Usuarios e permissoes.
- Organizacoes e estabelecimentos.
- Patrocinios e destaques publicos.
- Auditoria de alteracoes.

## Organizacao de Codigo em Next.js

Estrutura sugerida:

```txt
src/
  app/
    (public)/
      mapa/
      caes/[id]/
      q/[qrCodeId]/
      pontos/[id]/
      parceiros/
    caes-rua/
    pontos-apoio/
    clientes/
    pets/
    patrocinios/
    admin/
      page.tsx
      aprovacoes/
      usuarios/
      organizacoes/
      moderacao/
  components/
    layout/
    navigation/
    appointments/
    street-dogs/
    support-points/
    map/
    sponsorships/
    ui/
  config/
    navigation.ts
  contexts/
  hooks/
    appointments/
    street-dogs/
    support-points/
  lib/
    firebase/
    permissions/
    repositories/
    validators/
  types/
    domain/
```

Regras de organizacao:

- `page.tsx` deve orquestrar dados e montar a tela, nao concentrar formularios grandes.
- Componentes de dominio ficam em pastas proprias: `street-dogs`, `support-points`, `appointments`.
- Campos reutilizaveis continuam em `components/ui`.
- Acesso ao Firestore deve sair das paginas e ir para `lib/repositories`.
- Permissoes devem ficar em `lib/permissions`.
- Tipos de dominio devem ficar em `types/domain`.
- Hooks devem encapsular leitura e escrita por modulo.
- Utilitarios puros devem ficar em `lib` ou `utils`, nunca misturados dentro de componentes.

## Componentes Prioritarios

### Comunidade

- `StreetDogForm`
- `StreetDogCard`
- `StreetDogStatusBadge`
- `StreetDogUpdateTimeline`
- `StreetDogPublicProfile`
- `QRCodePanel`
- `SupportPointForm`
- `SupportPointCard`
- `SupportPointAvailabilityBadge`
- `CommunityMap`
- `MapFilters`
- `SponsorshipBanner`

### Petshop

- `AppointmentCalendar`
- `AppointmentForm`
- `TutorForm`
- `TutorList`
- `DomesticPetForm`
- `DomesticPetProfile`
- `HealthRecordTimeline`
- `ServiceSelector`
- `ProductSelector`

### Administracao

- `AdminMetricGrid`
- `ApprovalQueue`
- `ModerationTable`
- `UserRoleEditor`
- `OrganizationStatusBadge`

## Mapa

Biblioteca recomendada:

- `leaflet` com `react-leaflet`, se quiser baixo custo e mapas OpenStreetMap.
- Google Maps apenas se houver necessidade de geocoding mais robusto, Places ou infraestrutura comercial.

Camadas do mapa:

- Caes cadastrados.
- Pontos de alimentacao.
- Pontos de agua.
- Parceiros.
- Locais de apoio.
- Pontos de doacao.
- Pontos com reposicao necessaria.

## QR Code

Fluxo:

1. Criar registro em `qrCodes`.
2. Vincular `qrCodeId` ao `streetDog`.
3. Gerar imagem do QR apontando para `/q/[qrCodeId]`.
4. `/q/[qrCodeId]` resolve o animal e redireciona ou renderiza perfil publico.

Entidade `qrCodes`:

- `id`
- `targetType`
- `targetId`
- `publicPath`
- `createdAt`
- `createdByUserId`
- `isActive`

## Firestore Rules

Direcao para regras:

- Publico pode ler apenas documentos com `visibility == "public"` e `approvalStatus == "approved"`.
- Voluntarios autenticados podem criar atualizacoes, mas edicoes sensiveis dependem de regra ou moderacao.
- Parceiros acessam dados comerciais apenas quando `organizationId` pertence ao usuario.
- Administradores acessam tudo.
- Dados privados de tutores e clientes nunca devem ser publicos.

## Fases de Implementacao

1. Criar perfil de usuario e modelo de permissoes.
2. Separar a agenda atual em componentes/hooks/repository sem criar rota intermediaria.
3. Adicionar entidades comerciais: organizacoes, tutores, animais domesticos, servicos e produtos.
4. Criar cadastro de caes de rua e historico.
5. Criar pontos de apoio e reposicao.
6. Criar mapa publico e operacional.
7. Criar QR Codes e paginas publicas.
8. Criar painel administrativo e moderacao.
9. Criar patrocinio e exibicao de parceiros.
10. Endurecer regras do Firestore e criar scripts de migracao.
