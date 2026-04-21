import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { getRoleFlags } from '@/src/lib/roles';
import {
    AgentFormData,
    EntrepriseFormData,
    agentSchema,
    entrepriseSchema,
} from '@/src/lib/validation';
import { useAuthStore } from '@/src/stores/auth.store';
import { useEntrepriseStore } from '@/src/stores/entreprise.store';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { TYPE_ANNONCE_LABELS, TYPE_BIEN_LABELS } from '@/src/types/annonce.types';
import type { AgentDTO } from '@/src/types/entreprise.types';
import { formatFullLocalisation, formatPrix } from '@/src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} style={styles.infoIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function AgentCard({
  agent,
  onToggleStatus,
  onRemove,
  isToggling,
  isRemoving,
  canToggle,
  canRemove,
}: {
  agent: AgentDTO;
  onToggleStatus: () => void;
  onRemove: () => void;
  isToggling: boolean;
  isRemoving: boolean;
  canToggle: boolean;
  canRemove: boolean;
}) {
  const initials = [agent.prenom, agent.nom]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join('') || agent.username[0].toUpperCase();

  const statutColor =
    agent.statut === 'ACTIF' ? colors.success :
    agent.statut === 'INACTIF' ? colors.error :
    colors.textMuted;
  const isActive = agent.statut === 'ACTIF';
  const toggleLabel = isActive ? 'Suspendre' : 'Activer';
  const toggleIcon = isActive ? 'pause-circle-outline' : 'play-circle-outline';
  const toggleColor = isActive ? '#D97706' : colors.success;

  return (
    <View style={styles.agentCard}>
      <View style={styles.agentAvatar}>
        <Text style={styles.agentInitials}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.agentName}>
          {[agent.prenom, agent.nom].filter(Boolean).join(' ') || agent.username}
        </Text>
        <Text style={styles.agentEmail}>{agent.email}</Text>
        {agent.telephone ? (
          <Text style={styles.agentPhone}>{agent.telephone}</Text>
        ) : null}
        <View style={styles.agentStatutRow}>
          <View style={[styles.agentStatutDot, { backgroundColor: statutColor }]} />
          <Text style={[styles.agentStatut, { color: statutColor }]}>{agent.statut}</Text>
        </View>
      </View>
      {(canToggle || canRemove) ? (
        <View style={styles.agentActions}>
          {canToggle ? (
            <TouchableOpacity
              onPress={onToggleStatus}
              disabled={isToggling || isRemoving}
              style={[
                styles.agentActionBtn,
                styles.agentToggleBtn,
                { borderColor: toggleColor, backgroundColor: `${toggleColor}14` },
              ]}
              activeOpacity={0.7}
            >
              {isToggling ? (
                <ActivityIndicator size="small" color={toggleColor} />
              ) : (
                <>
                  <Ionicons name={toggleIcon as any} size={16} color={toggleColor} />
                  <Text style={[styles.agentActionText, { color: toggleColor }]}>{toggleLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
          {canRemove ? (
            <TouchableOpacity
              onPress={onRemove}
              disabled={isRemoving || isToggling}
              style={[styles.agentActionBtn, styles.agentRemoveBtn]}
              activeOpacity={0.7}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons name="person-remove-outline" size={16} color={colors.error} />
                  <Text style={[styles.agentActionText, { color: colors.error }]}>Retirer</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function EntrepriseScreen() {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const {
    entreprise,
    annonces,
    isLoading,
    isSaving,
    error,
    fetchByUserId,
    fetchById,
    createEntreprise,
    updateEntreprise,
    addAgent,
    suspendAgent,
    activateAgent,
    removeAgent,
    clearError,
  } = useEntrepriseStore();

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingAgentId, setRemovingAgentId] = useState<string | null>(null);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [annonceReferenceFilter, setAnnonceReferenceFilter] = useState('');
  const roles = profile?.roles ?? user?.roles ?? [];
  const effectiveUserId = user?.id ?? profile?.id;
  const { canManageEntreprise, isAgentProfessionnel, canAccessEntreprise } = getRoleFlags(
    roles,
    profile?.type ?? null,
  );
  const canViewAgents = canManageEntreprise || isAgentProfessionnel;
  const canToggleAgents = canManageEntreprise;

  // ── Chargement au focus ──────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (profile?.entrepriseId) {
        fetchById(profile.entrepriseId);
      } else if (effectiveUserId) {
        fetchByUserId(effectiveUserId);
      }
    }, [profile?.entrepriseId, effectiveUserId, fetchById, fetchByUserId]),
  );

  // ── Formulaire Entreprise ────────────────────────────────────────────────
  const entrepriseForm = useForm<EntrepriseFormData>({
    resolver: zodResolver(entrepriseSchema),
    defaultValues: {
      nom: entreprise?.nom ?? '',
      description: entreprise?.description ?? '',
      telephone: entreprise?.telephone ?? '',
      email: entreprise?.email ?? '',
      adresse: entreprise?.adresse ?? '',
      pays: entreprise?.pays ?? '',
      numeroRCCM: entreprise?.numeroRCCM ?? '',
    },
  });

  // ── Formulaire Agent ─────────────────────────────────────────────────────
  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: { nom: '', prenom: '', email: '', telephone: '', username: '' },
  });

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredAnnonces = useMemo(() => {
    const query = annonceReferenceFilter.trim().toLowerCase();
    if (!query) return annonces;
    return annonces.filter((annonce) =>
      annonce.referenceAnnonce?.toLowerCase().includes(query),
    );
  }, [annonces, annonceReferenceFilter]);

  // ── Soumission création / édition entreprise ─────────────────────────────
  const onSubmitEntreprise = async (data: EntrepriseFormData) => {
    clearError();
    const payload = {
      nom: data.nom,
      description: data.description || undefined,
      telephone: data.telephone || undefined,
      email: data.email || undefined,
      adresse: data.adresse || undefined,
      pays: data.pays || undefined,
      numeroRCCM: data.numeroRCCM || undefined,
    };
    try {
      if (entreprise) {
        await updateEntreprise(entreprise.id, payload);
        flash('Entreprise mise à jour !');
        setEditOpen(false);
      } else {
        const created = await createEntreprise(payload);
        entrepriseForm.reset({
          nom: created.nom,
          description: created.description ?? '',
          telephone: created.telephone ?? '',
          email: created.email ?? '',
          adresse: created.adresse ?? '',
          pays: created.pays ?? '',
          numeroRCCM: created.numeroRCCM ?? '',
        });
        flash('Entreprise créée avec succès !');
      }
    } catch {
      // error déjà stockée dans le store
    }
  };

  // ── Soumission invitation agent ──────────────────────────────────────────
  const onSubmitAgent = async (data: AgentFormData) => {
    if (!entreprise) return;
    clearError();
    try {
      await addAgent(entreprise.id, {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone || undefined,
        username: data.username,
      });
      agentForm.reset();
      setInviteOpen(false);
      flash('Agent invité ! Un email avec son mot de passe temporaire lui a été envoyé.');
    } catch {
      // error déjà stockée dans le store
    }
  };

  // ── Suppression agent ────────────────────────────────────────────────────
  const handleRemoveAgent = (agent: AgentDTO) => {
    Alert.alert(
      'Retirer l\'agent',
      `Voulez-vous retirer ${agent.prenom ?? ''} ${agent.nom ?? agent.username} ? Son compte sera désactivé.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            if (!entreprise) return;
            setRemovingAgentId(agent.id);
            try {
              await removeAgent(entreprise.id, agent.id);
              flash('Agent retiré.');
            } catch {
              // error dans le store
            } finally {
              setRemovingAgentId(null);
            }
          },
        },
      ],
    );
  };

  const handleToggleAgentStatus = (agent: AgentDTO) => {
    if (!entreprise) return;

    const isActive = agent.statut === 'ACTIF';
    const actionLabel = isActive ? 'suspendre' : 'activer';
    const successLabel = isActive ? 'Agent suspendu.' : 'Agent activé.';

    Alert.alert(
      isActive ? 'Suspendre l\'agent' : 'Activer l\'agent',
      `Voulez-vous ${actionLabel} ${agent.prenom ?? ''} ${agent.nom ?? agent.username} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isActive ? 'Suspendre' : 'Activer',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            setTogglingAgentId(agent.id);
            try {
              if (isActive) {
                await suspendAgent(entreprise.id, agent.id);
              } else {
                await activateAgent(entreprise.id, agent.id);
              }
              flash(successLabel);
            } catch {
              // error dans le store
            } finally {
              setTogglingAgentId(null);
            }
          },
        },
      ],
    );
  };

  // ── Chargement initial ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Bannières globales ─────────────────────────────────────────── */}
      {successMsg && <AlertBanner message={successMsg} variant="success" />}
      {error && <AlertBanner message={error} variant="error" />}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CAS 1 : Pas encore d'entreprise → formulaire de création        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!entreprise && canManageEntreprise && (
        <>
          <View style={styles.emptyHeader}>
            <View style={styles.emptyIcon}>
              <Ionicons name="business" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Créez votre entreprise</Text>
            <Text style={styles.emptySubtitle}>
              Renseignez les informations de votre agence immobilière pour commencer à publier des annonces.
            </Text>
          </View>

          <SectionLabel title="Informations de l'entreprise" />
          <View style={styles.card}>
            <EntrepriseFormFields form={entrepriseForm} />
            <Button
              title="Créer mon entreprise"
              onPress={entrepriseForm.handleSubmit(onSubmitEntreprise)}
              isLoading={isSaving}
              style={styles.btnTop}
            />
          </View>
        </>
      )}

      {!entreprise && isAgentProfessionnel && (
        <View style={styles.card}>
          <Text style={styles.emptyInfo}>
            Aucune entreprise rattachée à votre compte pour le moment.
          </Text>
        </View>
      )}

      {!entreprise && !canAccessEntreprise && (
        <View style={styles.card}>
          <Text style={styles.emptyInfo}>
            Impossible d'afficher les informations de l'entreprise pour ce compte.
          </Text>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CAS 2 : Entreprise existante → fiche + agents                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {entreprise && (
        <>
          {/* ── En-tête entreprise ──────────────────────────────────── */}
          <View style={styles.entrepriseHeader}>
            <View style={styles.entrepriseIcon}>
              <Ionicons name="business" size={30} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.entrepriseNom}>{entreprise.nom}</Text>
              <Text style={styles.entrepriseProp}>@{entreprise.proprietaireUsername}</Text>
            </View>
            {canManageEntreprise ? (
              <TouchableOpacity
                onPress={() => {
                  entrepriseForm.reset({
                    nom: entreprise.nom,
                    description: entreprise.description ?? '',
                    telephone: entreprise.telephone ?? '',
                    email: entreprise.email ?? '',
                    adresse: entreprise.adresse ?? '',
                    pays: entreprise.pays ?? '',
                    numeroRCCM: entreprise.numeroRCCM ?? '',
                  });
                  setEditOpen((v) => !v);
                }}
                style={styles.editBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={editOpen ? 'close-outline' : 'pencil-outline'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Infos (mode lecture) ─────────────────────────────────── */}
          {!editOpen && (
            <View style={styles.card}>
              {entreprise.description ? (
                <Text style={styles.description}>{entreprise.description}</Text>
              ) : null}
              <InfoRow icon="mail-outline" label="Email" value={entreprise.email} />
              <InfoRow icon="call-outline" label="Téléphone" value={entreprise.telephone} />
              <InfoRow icon="location-outline" label="Adresse" value={entreprise.adresse} />
              <InfoRow icon="flag-outline" label="Pays" value={entreprise.pays} />
              <InfoRow icon="document-text-outline" label="N° RCCM" value={entreprise.numeroRCCM} />
              {!entreprise.description && !entreprise.email && !entreprise.telephone &&
               !entreprise.adresse && !entreprise.pays && !entreprise.numeroRCCM && (
                <Text style={styles.emptyInfo}>Aucune information complémentaire enregistrée.</Text>
              )}
            </View>
          )}

          {/* ── Formulaire édition ───────────────────────────────────── */}
          {editOpen && canManageEntreprise && (
            <>
              <SectionLabel title="Modifier l'entreprise" />
              <View style={styles.card}>
                <EntrepriseFormFields form={entrepriseForm} />
                <Button
                  title="Enregistrer les modifications"
                  onPress={entrepriseForm.handleSubmit(onSubmitEntreprise)}
                  isLoading={isSaving}
                  style={styles.btnTop}
                />
              </View>
            </>
          )}

          {canViewAgents ? (
            <>
              {/* ── Section Agents ───────────────────────────────────────── */}
              <View style={styles.agentsSectionHeader}>
                <SectionLabel title={`Agents (${(entreprise.agents ?? []).length})`} />
                {canManageEntreprise ? (
                  <TouchableOpacity
                    onPress={() => setInviteOpen((v) => !v)}
                    style={styles.inviteBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={inviteOpen ? 'close-outline' : 'person-add-outline'}
                      size={18}
                      color={colors.white}
                    />
                    <Text style={styles.inviteBtnText}>
                      {inviteOpen ? 'Annuler' : 'Inviter'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* ── Formulaire invitation ────────────────────────────────── */}
              {inviteOpen && canManageEntreprise && (
                <View style={styles.card}>
                  <Text style={styles.inviteNote}>
                    L'agent recevra un email avec son mot de passe temporaire. Il devra le changer à sa première connexion.
                  </Text>
                  <Controller
                    control={agentForm.control}
                    name="prenom"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Prénom *"
                        placeholder="ex: Ibrahima"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={agentForm.formState.errors.prenom?.message}
                        autoCapitalize="words"
                      />
                    )}
                  />
                  <Controller
                    control={agentForm.control}
                    name="nom"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Nom *"
                        placeholder="ex: Camara"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={agentForm.formState.errors.nom?.message}
                        autoCapitalize="words"
                      />
                    )}
                  />
                  <Controller
                    control={agentForm.control}
                    name="username"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Nom d'utilisateur *"
                        placeholder="ex: i.camara"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={agentForm.formState.errors.username?.message}
                        autoCapitalize="none"
                      />
                    )}
                  />
                  <Controller
                    control={agentForm.control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email *"
                        placeholder="ex: i.camara@agence.com"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={agentForm.formState.errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    )}
                  />
                  <Controller
                    control={agentForm.control}
                    name="telephone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Téléphone"
                        placeholder="+224 621 000 000"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={agentForm.formState.errors.telephone?.message}
                        keyboardType="phone-pad"
                      />
                    )}
                  />
                  <Button
                    title="Envoyer l'invitation"
                    onPress={agentForm.handleSubmit(onSubmitAgent)}
                    isLoading={isSaving}
                    style={styles.btnTop}
                  />
                </View>
              )}

              {/* ── Liste des agents ─────────────────────────────────────── */}
              {(entreprise.agents ?? []).length === 0 && !inviteOpen ? (
                <View style={styles.emptyAgents}>
                  <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyAgentsText}>
                    {canManageEntreprise
                      ? `Aucun agent pour le moment.${'\n'}Invitez votre premier collaborateur !`
                      : 'Aucun agent rattaché à cette entreprise pour le moment.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.agentsList}>
                  {(entreprise.agents ?? []).map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onToggleStatus={() => handleToggleAgentStatus(agent)}
                      onRemove={() => handleRemoveAgent(agent)}
                      isToggling={togglingAgentId === agent.id}
                      isRemoving={removingAgentId === agent.id}
                      canToggle={canToggleAgents}
                      canRemove={canManageEntreprise}
                    />
                  ))}
                </View>
              )}
            </>
          ) : null}

          <SectionLabel title={`Annonces (${filteredAnnonces.length}/${annonces.length})`} />
          <View style={styles.card}>
            <Input
              label="Filtrer par référence"
              placeholder="ex: REF-2026-0001"
              value={annonceReferenceFilter}
              onChangeText={setAnnonceReferenceFilter}
              autoCapitalize="characters"
            />
          </View>
          {filteredAnnonces.length === 0 ? (
            <View style={styles.emptyAgents}>
              <Ionicons name="home-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyAgentsText}>
                {annonces.length === 0
                  ? 'Aucune annonce liée à cette entreprise pour le moment.'
                  : 'Aucune annonce ne correspond à cette référence.'}
              </Text>
            </View>
          ) : (
            <View style={styles.annoncesList}>
              {filteredAnnonces.map((annonce) => (
                <TouchableOpacity
                  key={annonce.id}
                  style={styles.annonceCard}
                  onPress={() => router.push(`/annonce/${annonce.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.annonceTopRow}>
                      <Text style={styles.annonceType}>
                        {TYPE_ANNONCE_LABELS[annonce.typeAnnonce]} • {TYPE_BIEN_LABELS[annonce.typeBien]}
                      </Text>
                      {!annonce.actif ? <Text style={styles.annonceInactive}>Inactif</Text> : null}
                    </View>
                    <Text style={styles.annonceReference}>Réf. {annonce.referenceAnnonce}</Text>
                    <Text style={styles.annoncePublisher}>
                      Publiée par {[
                        annonce.annonceur?.prenom,
                        annonce.annonceur?.nom,
                      ].filter(Boolean).join(' ') || annonce.annonceur?.username || '—'}
                    </Text>
                    <Text style={styles.annonceTitle} numberOfLines={2}>{annonce.titre}</Text>
                    <Text style={styles.annoncePrice}>{formatPrix(annonce.prixRevise ?? annonce.prix)}</Text>
                    {annonce.localisation ? (
                      <Text style={styles.annonceLocation} numberOfLines={1}>
                        {formatFullLocalisation(annonce.localisation)}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      <View style={{ height: spacing['2xl'] }} />
    </ScrollView>
  );
}

// ─── Sous-formulaire réutilisable (création + édition) ────────────────────────

function EntrepriseFormFields({ form }: { form: ReturnType<typeof useForm<EntrepriseFormData>> }) {
  const { control, formState: { errors } } = form;
  return (
    <>
      <Controller
        control={control}
        name="nom"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nom de l'entreprise *"
            placeholder="ex: Immo Guinée SARL"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.nom?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description *"
            placeholder="Présentation de votre agence…"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.description?.message}
            multiline
            numberOfLines={3}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email professionnel *"
            placeholder="contact@agence.com"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      <Controller
        control={control}
        name="telephone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Téléphone *"
            placeholder="+224 620 000 000"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.telephone?.message}
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="adresse"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Adresse *"
            placeholder="ex: Kipé, Ratoma, Conakry"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.adresse?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="numeroRCCM"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Numéro RCCM *"
            placeholder="ex: RC-GN-2024-001"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.numeroRCCM?.message}
            autoCapitalize="characters"
          />
        )}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  loadingText: { fontSize: typography.sizes.sm, color: colors.textSecondary },

  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.base,
    ...shadows.sm,
  },

  btnTop: { marginTop: spacing.xs },

  // ── En-tête vide ──────────────────────────────────────────────────────────
  emptyHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight ?? '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.base,
  },

  // ── En-tête entreprise ────────────────────────────────────────────────────
  entrepriseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.base,
    ...shadows.sm,
    marginTop: spacing.sm,
  },
  entrepriseIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight ?? '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrepriseNom: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  entrepriseProp: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  editBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight ?? '#EAF0FF',
  },

  // ── Infos lecture ─────────────────────────────────────────────────────────
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoIcon: { marginTop: 2 },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  emptyInfo: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Agents ────────────────────────────────────────────────────────────────
  agentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.base,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  inviteBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  inviteNote: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.base,
    lineHeight: 18,
  },
  emptyAgents: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.base,
  },
  emptyAgentsText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  agentsList: { gap: spacing.sm },
  annoncesList: { gap: spacing.sm },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.base,
    ...shadows.sm,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight ?? '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  agentInitials: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  agentName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  agentEmail: { fontSize: typography.sizes.xs, color: colors.textMuted },
  agentPhone: { fontSize: typography.sizes.xs, color: colors.textMuted },
  agentStatutRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  agentStatutDot: { width: 6, height: 6, borderRadius: 3 },
  agentStatut: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  agentActions: {
    gap: spacing.xs,
    flexShrink: 0,
  },
  agentActionBtn: {
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  agentToggleBtn: {
    borderColor: colors.border,
  },
  agentActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  agentRemoveBtn: {
    borderColor: `${colors.error}55`,
    backgroundColor: `${colors.error}12`,
  },
  annonceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  annonceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  annonceType: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    flex: 1,
  },
  annonceInactive: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
  annonceTitle: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  annonceReference: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  annoncePublisher: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  annoncePrice: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  annonceLocation: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
