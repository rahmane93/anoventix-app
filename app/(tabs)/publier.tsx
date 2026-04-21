import { addBienImmoMedias, deleteBienImmoMedia, getAnnonceById } from '@/src/api/annonce.api';
import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Input } from '@/src/components/ui/input';
import { REGIONS_GUINEE, useAnnonceStore } from '@/src/stores/annonce.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import {
    DOCUMENTS_LABELS,
    DocumentsDisponibles,
    Localisation,
    Media,
    TYPE_ANNONCE_LABELS,
    TYPE_BIEN_LABELS,
    TYPE_USAGE_LABELS,
    TypeAnnonce,
    TypeBien,
    TypeUsage,
} from '@/src/types/annonce.types';
import { formatNumericInput, humanizeMediaError, parseOptionalNumber } from '@/src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Types erreurs ────────────────────────────────────────────────────────────

type FieldErrors = Record<string, string>;

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = ['Type', 'Localisation', 'Détails', 'Photos'];
const STEP_ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'home-outline',
  'location-outline',
  'document-text-outline',
  'camera-outline',
];
// Couleur propre à chaque étape (fond du cercle)
const STEP_COLORS = ['#1A3C6E', '#E88B2E', '#2A7F9E', '#3A9E78'];

const TYPE_ANNONCES: TypeAnnonce[] = ['VENTE', 'LOCATION', 'BAIL'];
const TYPE_ANNONCE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  VENTE:    'cash-outline',
  LOCATION: 'key-outline',
  BAIL:     'document-outline',
};
// Couleur d'icône par type de transaction
const TYPE_ANNONCE_COLORS: Record<string, string> = {
  VENTE:    '#1A3C6E',
  LOCATION: '#7C5C3E',
  BAIL:     '#9C6B2C',
};
// Fond d'icône (neutre/inactif)
const TYPE_ANNONCE_BG: Record<string, string> = {
  VENTE:    '#E8F0FA',
  LOCATION: '#F5EFE6',
  BAIL:     '#FAF3E0',
};

const TYPE_BIENS: TypeBien[] = ['APPARTEMENT', 'MAISON', 'VILLA', 'TERRAIN', 'MAGASIN', 'BUREAU', 'ENTREPOT', 'AUTRE'];
const TYPE_BIEN_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  APPARTEMENT: 'business-outline',
  MAISON:      'home-outline',
  VILLA:       'home',
  TERRAIN:     'map-outline',
  MAGASIN:     'storefront-outline',
  BUREAU:      'briefcase-outline',
  ENTREPOT:    'cube-outline',
  AUTRE:       'help-circle-outline',
};
// Couleur d'icône par type de bien
const TYPE_BIEN_COLORS: Record<string, string> = {
  APPARTEMENT: '#2A5FA8',
  MAISON:      '#7C5C3E',
  VILLA:       '#3A7D44',
  TERRAIN:     '#B85C1A',
  MAGASIN:     '#C0392B',
  BUREAU:      '#7B3FA8',
  ENTREPOT:    '#4A6B8A',
  AUTRE:       '#6B7280',
};
const TYPE_BIEN_BG: Record<string, string> = {
  APPARTEMENT: '#E8F0FA',
  MAISON:      '#F5EFE6',
  VILLA:       '#E8F5EB',
  TERRAIN:     '#FBF0E6',
  MAGASIN:     '#FAECEC',
  BUREAU:      '#F4ECF7',
  ENTREPOT:    '#EBF2F7',
  AUTRE:       '#F3F4F6',
};
const TYPE_USAGES: TypeUsage[] = ['HABITATION', 'COMMERCIAL', 'AGRICOLE', 'LOISIR', 'PROFESSIONNEL', 'AUTRE'];
const DOCUMENTS: DocumentsDisponibles[] = ['TITRE_FONCIER', 'DONATION', 'ACTE_DE_VENTE', 'CERTIFICAT_USAGE_FONCIER'];

const TYPE_USAGE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  HABITATION:      'home-outline',
  COMMERCIAL:      'storefront-outline',
  AGRICOLE:        'leaf-outline',
  LOISIR:          'football-outline',
  PROFESSIONNEL:   'briefcase-outline',
  AUTRE:           'help-circle-outline',
};
const TYPE_USAGE_COLORS: Record<string, string> = {
  HABITATION:    '#3A9E78',
  COMMERCIAL:    '#1A5FA8',
  AGRICOLE:      '#5C7A2A',
  LOISIR:        '#E88B2E',
  PROFESSIONNEL: '#7B3FA8',
  AUTRE:         '#6B7280',
};
const TYPE_USAGE_BG: Record<string, string> = {
  HABITATION:    '#E8F5F0',
  COMMERCIAL:    '#E8F0FA',
  AGRICOLE:      '#EDF5E8',
  LOISIR:        '#FDF3E8',
  PROFESSIONNEL: '#F4ECF7',
  AUTRE:         '#F3F4F6',
};

const DOCUMENTS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  TITRE_FONCIER:            'ribbon-outline',
  DONATION:                 'gift-outline',
  ACTE_DE_VENTE:            'receipt-outline',
  CERTIFICAT_USAGE_FONCIER: 'shield-checkmark-outline',
  AUTRE:                    'document-outline',
};
const DOCUMENTS_COLORS: Record<string, string> = {
  TITRE_FONCIER:            '#1A3C6E',
  DONATION:                 '#2A9E8E',
  ACTE_DE_VENTE:            '#B85C1A',
  CERTIFICAT_USAGE_FONCIER: '#3A9E78',
  AUTRE:                    '#6B7280',
};
const DOCUMENTS_BG: Record<string, string> = {
  TITRE_FONCIER:            '#E8F0FA',
  DONATION:                 '#E8F5F4',
  ACTE_DE_VENTE:            '#FBF0E6',
  CERTIFICAT_USAGE_FONCIER: '#E8F5F0',
  AUTRE:                    '#F3F4F6',
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={s.stepRow}>
      {STEPS.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[
                s.stepCircle,
                { backgroundColor: isDone || isActive ? STEP_COLORS[i] : colors.border },
                isActive && s.stepCircleRing,
              ]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Ionicons
                    name={STEP_ICONS[i]}
                    size={14}
                    color={isActive ? colors.white : colors.textMuted}
                  />
                )}
              </View>
              <Text style={[s.stepLabel, isActive && s.stepLabelActive, isDone && s.stepLabelDone]}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[s.stepLine, isDone && s.stepLineActive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  getLabel,
  value,
  onChange,
  error,
  columns,
}: {
  label: string;
  options: T[];
  getLabel: (v: T) => string;
  value: T | '';
  onChange: (v: T) => void;
  error?: string;
  columns?: number;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={columns ? s.chipGridWrap : s.chipWrap}>
        {options.map((opt) =>
          columns ? (
            <View key={opt} style={{ width: `${100 / columns}%` as any, padding: 3 }}>
              <TouchableOpacity
                style={[s.chip, s.chipFill, value === opt && s.chipActive, !!error && s.chipError]}
                onPress={() => onChange(opt)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, value === opt && s.chipTextActive]}>{getLabel(opt)}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              key={opt}
              style={[s.chip, value === opt && s.chipActive, !!error && s.chipError]}
              onPress={() => onChange(opt)}
              activeOpacity={0.75}
            >
              <Text style={[s.chipText, value === opt && s.chipTextActive]}>{getLabel(opt)}</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

function SelectRow({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[s.selectBtn, disabled && s.selectBtnDisabled, !!error && s.selectBtnError]}
        onPress={() => !disabled && setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[s.selectBtnText, !value && { color: colors.textMuted }]}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={s.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[s.dropdownItem, value === opt && s.dropdownItemActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[s.dropdownText, value === opt && s.dropdownTextActive]}>{opt}</Text>
                {value === opt && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function PublierScreen() {
  const { isAuthenticated } = useAuthStore();
  const { isLoadingLoc, isCreating, error, loadLocalisationsByRegion, createAnnonce, updateAnnonce, clearError } =
    useAnnonceStore();

  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params?.editId ? Number(params.editId) : null;
  const isEditMode = Number.isFinite(editId) && editId != null;

  const [isPrefilling, setIsPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [existingMedias, setExistingMedias] = useState<Media[]>([]);
  const [isMediaBusy, setIsMediaBusy] = useState(false);

  const [step, setStep] = useState(0);
  const [successId, setSuccessId] = useState<string | null>(null);
  const shouldResetOnNextFocusRef = useRef(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldErrors = () => setFieldErrors({});

  const resetCreateForm = useCallback(() => {
    setSuccessId(null);
    setStep(0);
    setTypeAnnonce('');
    setTypeBien('');
    setRegion('');
    setPrefecture('');
    setCommune('');
    setQuartier('');
    setLocalisationId('');
    setTitre('');
    setDescription('');
    setPrix('');
    setFraisHonoraire('');
    setSurfaceTotal('');
    setComplementAdresse('');
    setTypeUsage('');
    setDocuments('');
    setMedias([]);
    setExistingMedias([]);
    setLocByRegion([]);
    setPrefillError(null);
    clearFieldErrors();
    clearError();
  }, [clearError]);

  const setFieldError = (field: string, message: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: message }));

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  // Étape 1 — Type
  const [typeAnnonce, setTypeAnnonce] = useState<TypeAnnonce | ''>('');
  const [typeBien, setTypeBien] = useState<TypeBien | ''>('');

  // Étape 2 — Localisation
  const [region, setRegion] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [commune, setCommune] = useState('');
  const [quartier, setQuartier] = useState('');
  const [localisationId, setLocalisationId] = useState('');

  // Étape 3 — Détails
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [fraisHonoraire, setFraisHonoraire] = useState('');
  const [surfaceTotal, setSurfaceTotal] = useState('');
  const [complementAdresse, setComplementAdresse] = useState('');
  const [typeUsage, setTypeUsage] = useState<TypeUsage | ''>('');
  const [documents, setDocuments] = useState<DocumentsDisponibles | ''>('');

  // Étape 4 — Photos
  const [medias, setMedias] = useState<{ uri: string; name: string; type: string }[]>([]);

  // ── Localisation data ─
  const regions = REGIONS_GUINEE;
  const [locByRegion, setLocByRegion] = useState<Localisation[]>([]);

  const prefectures = useMemo(
    () => [...new Set((Array.isArray(locByRegion) ? locByRegion : []).map((l) => l.prefecture))].sort(),
    [locByRegion],
  );

  const communes = useMemo(
    () =>
      [...new Set((Array.isArray(locByRegion) ? locByRegion : []).filter((l) => l.prefecture === prefecture).map((l) => l.commune))].sort(),
    [locByRegion, prefecture],
  );

  const quartiers = useMemo(
    () =>
      (Array.isArray(locByRegion) ? locByRegion : [])
        .filter((l) => l.prefecture === prefecture && l.commune === commune)
        .sort((a, b) => a.quartier.localeCompare(b.quartier)),
    [locByRegion, prefecture, commune],
  );

  const handleRegionChange = async (r: string) => {
    clearFieldErrors();
    setRegion(r);
    setPrefecture('');
    setCommune('');
    setQuartier('');
    setLocalisationId('');
    const list = await loadLocalisationsByRegion(r);
    setLocByRegion(list);
  };

  const handlePrefectureChange = (p: string) => {
    clearFieldErrors();
    setPrefecture(p);
    setCommune('');
    setQuartier('');
    setLocalisationId('');
  };

  const handleCommuneChange = (c: string) => {
    clearFieldErrors();
    setCommune(c);
    setQuartier('');
    setLocalisationId('');
  };

  const handleQuartierChange = (loc: Localisation) => {
    clearFieldErrors();
    setQuartier(loc.quartier);
    setLocalisationId(loc.id);
  };

  // ── Pré-remplissage en mode édition ─
  useEffect(() => {
    if (!isEditMode || !editId) return;

    let cancelled = false;
    (async () => {
      try {
        setIsPrefilling(true);
        clearError();
        clearFieldErrors();
        setPrefillError(null);

        const a = await getAnnonceById(editId);
        if (cancelled || !a) return;

        setExistingMedias(a.medias ?? []);

        setTypeAnnonce(a.typeAnnonce ?? '');
        setTypeBien(a.typeBien ?? '');
        setTitre(a.titre ?? '');
        setDescription(a.description ?? '');
        setPrix(a.prix != null ? formatNumericInput(String(a.prix)) : '');
        setFraisHonoraire(a.fraisHonoraire != null ? formatNumericInput(String(a.fraisHonoraire)) : '');
        setSurfaceTotal(a.surfaceTotal != null ? String(a.surfaceTotal) : '');
        setComplementAdresse(a.complementAdresse ?? '');
        setTypeUsage(a.typeUsage ?? '');
        setDocuments(a.documentsDisponibles ?? '');

        // Localisation (si embarquée)
        if (a.localisation?.region) {
          const r = a.localisation.region;
          setRegion(r);
          const list = await loadLocalisationsByRegion(r);
          if (cancelled) return;
          setLocByRegion(list);

          setPrefecture(a.localisation.prefecture ?? '');
          setCommune(a.localisation.commune ?? '');
          setQuartier(a.localisation.quartier ?? '');
        }
        setLocalisationId(a.localisationId ?? '');
      } catch (err: any) {
        setPrefillError(err?.message ?? "Impossible de charger l'annonce.");
      } finally {
        if (!cancelled) setIsPrefilling(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId]);

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode && shouldResetOnNextFocusRef.current) {
        shouldResetOnNextFocusRef.current = false;
        resetCreateForm();
      }

      return () => {
        if (!isEditMode && successId) {
          shouldResetOnNextFocusRef.current = true;
        }
      };
    }, [isEditMode, successId, resetCreateForm]),
  );

  // ── Validation au blur (quitter le champ) ─
  const validateTitreOnBlur = () => {
    const t = titre.trim();
    if (!isNonEmpty(t)) {
      setFieldError('titre', 'Le titre est obligatoire.');
      return;
    }
    if (t.length < 5 || t.length > 100) {
      setFieldError('titre', 'Le titre doit contenir entre 5 et 100 caractères.');
      return;
    }
    clearFieldError('titre');
  };

  const validateDescriptionOnBlur = () => {
    const d = description.trim();
    if (!isNonEmpty(d)) {
      setFieldError('description', 'La description est obligatoire.');
      return;
    }
    if (d.length < 20 || d.length > 2000) {
      setFieldError('description', 'La description doit contenir entre 20 et 2000 caractères.');
      return;
    }
    clearFieldError('description');
  };

  // ── Sélection de photos ─
  const refreshAnnonceMedias = async () => {
    if (!isEditMode || !editId) return;
    const a = await getAnnonceById(editId);
    setExistingMedias(a.medias ?? []);
  };

  useEffect(() => {
    if (!isEditMode || !editId) return;
    if (step !== 3) return;
    (async () => {
      try {
        await refreshAnnonceMedias();
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isEditMode, editId]);

  const pickPhotosForCreate = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const existingCount = existingMedias.length;
    const remaining = Math.max(0, 10 - existingCount - medias.length);
    if (remaining === 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remaining,
    });

    if (result.canceled || !result.assets) return;

    const newFiles = result.assets.map((a) => ({
      uri: a.uri,
      name: a.uri.split('/').pop() ?? 'photo.jpg',
      type: a.mimeType ?? 'image/jpeg',
    }));
    setMedias((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  const pickAndUploadPhotos = async () => {
    if (!isEditMode || !editId) return;
    if (isMediaBusy) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const remaining = Math.max(0, 10 - existingMedias.length);
    if (remaining === 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remaining,
    });

    if (result.canceled || !result.assets) return;

    const newFiles = result.assets.map((a) => ({
      uri: a.uri,
      name: a.uri.split('/').pop() ?? 'photo.jpg',
      type: a.mimeType ?? 'image/jpeg',
    }));

    try {
      setIsMediaBusy(true);
      setPrefillError(null);
      await addBienImmoMedias(editId, newFiles);
      await refreshAnnonceMedias();
    } catch (err: any) {
      setPrefillError(humanizeMediaError(err, "Impossible d’ajouter les images."));
      // Best effort: l'opération peut réussir mais la réponse échouer côté backend
      try {
        await refreshAnnonceMedias();
      } catch {
        // ignore
      }
    } finally {
      setIsMediaBusy(false);
    }
  };

  const removeExistingMedia = async (mediaId: number) => {
    if (!isEditMode || !editId) return;
    if (isMediaBusy) return;

    try {
      setIsMediaBusy(true);
      setPrefillError(null);
      await deleteBienImmoMedia(editId, mediaId);
      await refreshAnnonceMedias();
    } catch (err: any) {
      setPrefillError(humanizeMediaError(err, 'Impossible de supprimer le média.'));
      // Best effort: l'opération peut réussir mais la réponse échouer côté backend
      try {
        await refreshAnnonceMedias();
      } catch {
        // ignore
      }
    } finally {
      setIsMediaBusy(false);
    }
  };

  const removePhoto = (idx: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validation par étape ─
  const getStepErrors = (stepIndex: number): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (stepIndex === 0) {
      if (!typeAnnonce) nextErrors.typeAnnonce = "Le type d'annonce est obligatoire";
      if (!typeBien) nextErrors.typeBien = 'Le type de bien est obligatoire';
    }

    if (stepIndex === 1) {
      if (!region) nextErrors.region = 'Veuillez sélectionner une région.';
      if (!prefecture) nextErrors.prefecture = 'Veuillez sélectionner une préfecture.';
      if (!commune) nextErrors.commune = 'Veuillez sélectionner une commune.';
      if (!localisationId) nextErrors.localisationId = 'Le quartier est obligatoire';
    }

    if (stepIndex === 2) {
      const t = titre.trim();
      const d = description.trim();
      if (!isNonEmpty(t)) nextErrors.titre = 'Le titre est obligatoire.';
      if (t.length > 0 && (t.length < 5 || t.length > 100)) {
        nextErrors.titre = 'Le titre doit contenir entre 5 et 100 caractères.';
      }
      if (!isNonEmpty(d)) nextErrors.description = 'La description est obligatoire.';
      if (d.length > 0 && (d.length < 20 || d.length > 2000)) {
        nextErrors.description = 'La description doit contenir entre 20 et 2000 caractères.';
      }

      const prixNumber = parseOptionalNumber(prix);
      if (prixNumber === null) nextErrors.prix = 'Le prix est obligatoire';
      else if (prixNumber <= 0) nextErrors.prix = 'Le prix doit être supérieur à 0';

      const fraisNumber = parseOptionalNumber(fraisHonoraire);
      if (fraisHonoraire.trim().length > 0 && (fraisNumber === null || fraisNumber < 0)) {
        nextErrors.fraisHonoraire = 'Les frais honoraire doit être supérieur ou egal à 0';
      }

      if (!documents) {
        nextErrors.documentsDisponibles = 'Vous devez mentionner au moins un document';
      }
    }

    return nextErrors;
  };

  const getAllErrors = (): FieldErrors => {
    return {
      ...getStepErrors(0),
      ...getStepErrors(1),
      ...getStepErrors(2),
    };
  };

  const validateStep = (stepIndex: number): boolean => {
    const nextErrors = getStepErrors(stepIndex);
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const canNext: boolean = (() => {
    if (step === 0) return !!typeAnnonce && !!typeBien;
    if (step === 1) return !!localisationId;
    if (step === 2) {
      const t = titre.trim();
      const d = description.trim();
      const okTitle = t.length >= 5 && t.length <= 100;
      const okDesc = d.length >= 20 && d.length <= 2000;
      const priceNumber = parseOptionalNumber(prix);
      const okPrice = priceNumber !== null && priceNumber > 0;
      const okDocs = !!documents;
      return okTitle && okDesc && okPrice && okDocs;
    }
    return true;
  })();

  const handleNext = () => {
    clearError();
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    clearError();
    clearFieldErrors();
    if (step > 0) setStep((s) => s - 1);
  };

  // ── Soumission finale ─
  const handleSubmit = async () => {
    clearError();
    clearFieldErrors();

    // Validation finale avant appel API
    const allErrors = getAllErrors();
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstKey = Object.keys(allErrors)[0];
      const stepByField: Record<string, number> = {
        typeAnnonce: 0,
        typeBien: 0,
        region: 1,
        prefecture: 1,
        commune: 1,
        quartier: 1,
        localisationId: 1,
        titre: 2,
        description: 2,
        prix: 2,
        fraisHonoraire: 2,
        documentsDisponibles: 2,
        medias: 3,
      };
      if (firstKey && typeof stepByField[firstKey] === 'number') setStep(stepByField[firstKey]);
      return;
    }

    try {
      const prixNumber = parseOptionalNumber(prix);
      const fraisNumber = parseOptionalNumber(fraisHonoraire);

      const basePayload = {
        titre: titre.trim(),
        description: description.trim(),
        prix: prixNumber!,
        typeAnnonce: typeAnnonce as TypeAnnonce,
        typeBien: typeBien as TypeBien,
        localisationId,
        typeUsage: typeUsage || undefined,
        documentsDisponibles: documents || undefined,
        fraisHonoraire: fraisHonoraire ? fraisNumber ?? undefined : undefined,
        surfaceTotal: surfaceTotal ? Number(surfaceTotal) : undefined,
        complementAdresse: complementAdresse.trim() || undefined,
      };

      const annonce = isEditMode && editId
        ? await updateAnnonce(editId, basePayload)
        : await createAnnonce({ ...basePayload, medias });

      setSuccessId(annonce.referenceAnnonce);
    } catch (err: any) {
      // erreurs dans le store + erreurs champs renvoyées par l'API
      // Le backend peut renvoyer : { message, errors: { field: msg } }
      // On applique ces erreurs sur les champs correspondants.
      const apiErrors: FieldErrors | null | undefined = err?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setFieldErrors(apiErrors);
        const firstKey = Object.keys(apiErrors)[0];
        if (firstKey) {
          const stepByField: Record<string, number> = {
            typeAnnonce: 0,
            typeBien: 0,
            region: 1,
            prefecture: 1,
            commune: 1,
            quartier: 1,
            localisationId: 1,
            titre: 2,
            description: 2,
            prix: 2,
            fraisHonoraire: 2,
            documentsDisponibles: 2,
            medias: 3,
          };
          const targetStep = stepByField[firstKey];
          if (typeof targetStep === 'number') setStep(targetStep);
        }
      }
    }
  };

  // ── Garde auth ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // ── Succès ─
  if (successId) {
    return (
      <View style={s.successContainer}>
        <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        <Text style={s.successTitle}>{isEditMode ? 'Annonce modifiée !' : 'Annonce publiée !'}</Text>
        <Text style={s.successRef}>Référence : {successId}</Text>
        <TouchableOpacity
          style={s.successBtn}
          onPress={() => {
            if (isEditMode) {
              setSuccessId(null);
              router.push('/(tabs)/mes-annonces');
              return;
            }

            resetCreateForm();
          }}
          activeOpacity={0.85}
        >
          <Text style={s.successBtnText}>{isEditMode ? 'Retour à mes annonces' : 'Publier une autre annonce'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.successSecondary} onPress={() => router.push('/(tabs)')} activeOpacity={0.7}>
          <Text style={s.successSecondaryText}>Retour à l’accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* ── Indicateur d'étapes ── */}
      <View style={s.stepHeader}>
        <StepIndicator current={step} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isPrefilling ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={s.loadingText}>Chargement de l’annonce…</Text>
          </View>
        ) : null}

        {prefillError ? (
          <View style={{ marginBottom: spacing.base }}>
            <AlertBanner message={prefillError} variant="error" />
          </View>
        ) : null}

        {error ? (
          <View style={{ marginBottom: spacing.base }}>
            <AlertBanner message={error} variant="error" />
          </View>
        ) : null}

        {/* ═══════════ ÉTAPE 1 : Type ═══════════ */}
        {step === 0 && (
          <View>
            <Text style={s.sectionTitle}>Quel type d’annonce ?</Text>

            {/* Type de transaction */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Type de transaction</Text>
              <View style={s.iconCardRow}>
                {TYPE_ANNONCES.map((opt) => {
                  const isActive = typeAnnonce === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[s.iconCard, s.iconCardTall, isActive && s.iconCardActive, !!fieldErrors.typeAnnonce && s.chipError]}
                      onPress={() => { clearFieldErrors(); setTypeAnnonce(opt); }}
                      activeOpacity={0.75}
                    >
                      <View style={[s.iconCardIconWrap, s.iconCardIconWrapLg, { backgroundColor: TYPE_ANNONCE_BG[opt] }]}>
                        <Ionicons name={TYPE_ANNONCE_ICONS[opt]} size={34} color={TYPE_ANNONCE_COLORS[opt]} />
                      </View>
                      <Text style={[s.iconCardLabel, s.iconCardLabelMd, isActive && s.iconCardLabelActive]}>
                        {TYPE_ANNONCE_LABELS[opt]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!!fieldErrors.typeAnnonce && <Text style={s.errorText}>{fieldErrors.typeAnnonce}</Text>}
            </View>

            {/* Type de bien — grille 4 colonnes */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Type de bien</Text>
              <View style={s.iconCardGrid}>
                {TYPE_BIENS.map((opt) => {
                  const isActive = typeBien === opt;
                  return (
                    <View key={opt} style={s.iconCardGridCell}>
                      <TouchableOpacity
                        style={[s.iconCard, s.iconCardSquare, isActive && s.iconCardActive, !!fieldErrors.typeBien && s.chipError]}
                        onPress={() => { clearFieldErrors(); setTypeBien(opt); }}
                        activeOpacity={0.75}
                      >
                        <View style={[s.iconCardIconWrap, { backgroundColor: TYPE_BIEN_BG[opt] }]}>
                          <Ionicons name={TYPE_BIEN_ICONS[opt]} size={24} color={TYPE_BIEN_COLORS[opt]} />
                        </View>
                        <Text style={[s.iconCardLabel, isActive && s.iconCardLabelActive]} numberOfLines={2}>
                          {TYPE_BIEN_LABELS[opt]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              {!!fieldErrors.typeBien && <Text style={s.errorText}>{fieldErrors.typeBien}</Text>}
            </View>
          </View>
        )}

        {/* ═══════════ ÉTAPE 2 : Localisation ═══════════ */}
        {step === 1 && (
          <View>
            <Text style={s.sectionTitle}>Où se trouve le bien ?</Text>

            {isLoadingLoc && (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={s.loadingText}>Chargement des localisations…</Text>
              </View>
            )}

            <SelectRow
              label="Région"
              value={region}
              placeholder="Sélectionnez une région"
              options={regions}
              onSelect={handleRegionChange}
              error={fieldErrors.region}
            />

            <SelectRow
              label="Préfecture"
              value={prefecture}
              placeholder="Sélectionnez une préfecture"
              options={prefectures}
              onSelect={handlePrefectureChange}
              disabled={!region}
              error={fieldErrors.prefecture}
            />

            <SelectRow
              label="Commune"
              value={commune}
              placeholder="Sélectionnez une commune"
              options={communes}
              onSelect={handleCommuneChange}
              disabled={!prefecture}
              error={fieldErrors.commune}
            />

            {/* Quartier — liste de cartes cliquables */}
            {commune ? (
              <View style={s.field}>
                <Text style={s.fieldLabel}>Quartier</Text>
                <View style={s.quartierGrid}>
                  {quartiers.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[s.quartierChip, localisationId === loc.id && s.quartierChipActive]}
                      onPress={() => handleQuartierChange(loc)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.quartierChipText, localisationId === loc.id && s.quartierChipTextActive]}>
                        {loc.quartier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!!fieldErrors.localisationId && <Text style={s.errorText}>{fieldErrors.localisationId}</Text>}
              </View>
            ) : null}

            {/* Résumé localisation sélectionnée */}
            {localisationId ? (
              <View style={s.locSummary}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={s.locSummaryText}>
                  {quartier}, {commune}, {prefecture}, {region}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ═══════════ ÉTAPE 3 : Détails ═══════════ */}
        {step === 2 && (
          <View>
            <Text style={s.sectionTitle}>Informations du bien</Text>

            <Input
              label="Titre de l'annonce *"
              placeholder="Ex : Belle villa avec jardin"
              value={titre}
              onChangeText={(v) => {
                clearFieldError('titre');
                setTitre(v);
              }}
              onBlur={validateTitreOnBlur}
              autoCapitalize="sentences"
              error={fieldErrors.titre}
            />
            <Input
              label="Description *"
              placeholder="Décrivez le bien en détail…"
              value={description}
              onChangeText={(v) => {
                clearFieldError('description');
                setDescription(v);
              }}
              onBlur={validateDescriptionOnBlur}
              multiline
              numberOfLines={5}
              style={s.textarea}
              autoCapitalize="sentences"
              error={fieldErrors.description}
            />
            <Input
              label="Prix (GNF) *"
              placeholder="Ex : 80000"
              value={prix}
              onChangeText={(v) => { clearFieldErrors(); setPrix(formatNumericInput(v)); }}
              keyboardType="numeric"
              error={fieldErrors.prix}
            />
            <Input
              label="Frais d'honoraire (GNF)"
              placeholder="Optionnel"
              value={fraisHonoraire}
              onChangeText={(v) => { clearFieldErrors(); setFraisHonoraire(formatNumericInput(v)); }}
              keyboardType="numeric"
              error={fieldErrors.fraisHonoraire}
            />
            <Input
              label="Surface totale (m²)"
              placeholder="Ex : 500"
              value={surfaceTotal}
              onChangeText={setSurfaceTotal}
              keyboardType="numeric"
            />
            <Input
              label="Complément d'adresse"
              placeholder="Ex : Près du marché central"
              value={complementAdresse}
              onChangeText={setComplementAdresse}
              autoCapitalize="sentences"
            />

            {/* Usage du bien — grille icônes */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Usage du bien</Text>
              <View style={s.iconCardGrid}>
                {TYPE_USAGES.map((opt) => {
                  const isActive = typeUsage === opt;
                  return (
                    <View key={opt} style={s.iconCardGridCell}>
                      <TouchableOpacity
                        style={[s.iconCard, s.iconCardSquare, isActive && s.iconCardActive]}
                        onPress={() => { clearFieldErrors(); setTypeUsage(opt); }}
                        activeOpacity={0.75}
                      >
                        <View style={[s.iconCardIconWrap, { backgroundColor: TYPE_USAGE_BG[opt] }]}>
                          <Ionicons name={TYPE_USAGE_ICONS[opt]} size={24} color={TYPE_USAGE_COLORS[opt]} />
                        </View>
                        <Text style={[s.iconCardLabel, isActive && s.iconCardLabelActive]} numberOfLines={2}>
                          {TYPE_USAGE_LABELS[opt]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Documents disponibles — grille icônes */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Documents disponibles</Text>
              <View style={s.iconCardGrid}>
                {DOCUMENTS.map((opt) => {
                  const isActive = documents === opt;
                  return (
                    <View key={opt} style={s.iconCardGridCell}>
                      <TouchableOpacity
                        style={[s.iconCard, s.iconCardSquare, isActive && s.iconCardActive, !!fieldErrors.documentsDisponibles && s.chipError]}
                        onPress={() => { clearFieldErrors(); setDocuments(opt); }}
                        activeOpacity={0.75}
                      >
                        <View style={[s.iconCardIconWrap, { backgroundColor: DOCUMENTS_BG[opt] }]}>
                          <Ionicons name={DOCUMENTS_ICONS[opt]} size={24} color={DOCUMENTS_COLORS[opt]} />
                        </View>
                        <Text style={[s.iconCardLabel, isActive && s.iconCardLabelActive]} numberOfLines={2}>
                          {DOCUMENTS_LABELS[opt]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              {!!fieldErrors.documentsDisponibles && <Text style={s.errorText}>{fieldErrors.documentsDisponibles}</Text>}
            </View>
          </View>
        )}

        {/* ═══════════ ÉTAPE 4 : Photos ═══════════ */}
        {step === 3 && (
          <View>
            <Text style={s.sectionTitle}>Ajoutez des photos</Text>
            {isEditMode ? (
              <Text style={s.sectionHint}>
                Vous pouvez ajouter ou supprimer des images ici.
              </Text>
            ) : (
              <Text style={s.sectionHint}>Maximum 10 photos. Les meilleures photos attirent plus d’acheteurs.</Text>
            )}

            <TouchableOpacity
              style={[s.photoPickerBtn, isMediaBusy && s.photoPickerBtnDisabled]}
              onPress={isEditMode ? pickAndUploadPhotos : pickPhotosForCreate}
              disabled={isMediaBusy}
              activeOpacity={0.8}
            >
              <Ionicons
                name="images-outline"
                size={22}
                color={isMediaBusy ? colors.textMuted : colors.primary}
              />
              <Text style={[s.photoPickerText, isMediaBusy && { color: colors.textMuted }]}>
                {isEditMode
                  ? `Ajouter des photos (${existingMedias.length}/10)`
                  : medias.length === 0
                    ? 'Choisir des photos'
                    : `Ajouter des photos (${medias.length}/10)`}
              </Text>
              {isMediaBusy ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
            </TouchableOpacity>

            {(existingMedias.length > 0 || medias.length > 0) && (
              <View style={s.photoGrid}>
                {existingMedias.map((m, i) => (
                  <View key={`existing-${m.id}`} style={s.photoThumb}>
                    <Image source={{ uri: m.url }} style={s.photoImg} />
                    {i === 0 && medias.length === 0 && (
                      <View style={s.photoBadge}>
                        <Text style={s.photoBadgeText}>Principale</Text>
                      </View>
                    )}
                    {isEditMode ? (
                      <TouchableOpacity
                        style={s.photoRemove}
                        onPress={() => removeExistingMedia(m.id)}
                        disabled={isMediaBusy}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
                {medias.map((m, i) => (
                  <View key={i} style={s.photoThumb}>
                    <Image source={{ uri: m.uri }} style={s.photoImg} />
                    {i === 0 && existingMedias.length === 0 && (
                      <View style={s.photoBadge}>
                        <Text style={s.photoBadgeText}>Principale</Text>
                      </View>
                    )}
                    <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(i)}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Navigation bas ── */}
      <View style={s.footer}>
        <View style={s.footerBtns}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={18} color={colors.primary} />
              <Text style={s.backBtnText}>Retour</Text>
            </TouchableOpacity>
          )}

          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, !canNext && s.nextBtnDisabled]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, isCreating && s.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={isCreating}
              activeOpacity={0.85}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={s.nextBtnText}>Publier l’annonce</Text>
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Indicateur étapes
  stepHeader: {
    backgroundColor: colors.white,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleRing: {
    borderWidth: 2.5,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stepLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 3 },
  stepLabelActive: { color: colors.primary, fontWeight: '700' },
  stepLabelDone: { color: colors.textSecondary },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginBottom: 14,
  },
  stepLineActive: { backgroundColor: colors.primary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, paddingBottom: 100 },

  // Titres
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  sectionHint: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.base,
    lineHeight: 18,
  },

  // Champ générique
  field: { marginBottom: spacing.base },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipGridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center' as const,
  },
  chipFill: { flex: 1 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  chipError: { borderColor: colors.error },
  chipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },

  // Cartes icônes (étape 1)
  iconCardRow: { flexDirection: 'row', gap: spacing.sm },
  iconCardGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconCardGridCell: { width: '25%', padding: 3 },
  iconCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  iconCardTall: {
    minHeight: 110,
    paddingVertical: spacing.lg,
  },
  iconCardSquare: { aspectRatio: 1, paddingVertical: spacing.sm },
  iconCardActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySurface },
  iconCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconCardIconWrapLg: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
  },
  iconCardIconWrapActive: { backgroundColor: colors.white },
  iconCardLabel: { fontSize: typography.sizes.xs, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' as const },
  iconCardLabelMd: { fontSize: typography.sizes.sm },
  iconCardLabelActive: { color: colors.primary, fontWeight: '700' },

  // Select
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  selectBtnError: { borderColor: colors.error },
  selectBtnDisabled: { backgroundColor: colors.background, opacity: 0.5 },
  selectBtnText: { fontSize: typography.sizes.md, color: colors.textPrimary },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
    zIndex: 99,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: colors.primarySurface },
  dropdownText: { fontSize: typography.sizes.md, color: colors.textPrimary },
  dropdownTextActive: { color: colors.primary, fontWeight: '600' },

  // Quartiers
  quartierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quartierChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  quartierChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  quartierChipText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  quartierChipTextActive: { color: colors.primary, fontWeight: '700' },

  // Résumé localisation
  locSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  locSummaryText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: '600', flex: 1 },

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.base },
  loadingText: { fontSize: typography.sizes.sm, color: colors.textSecondary },

  // Textarea
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: spacing.sm },
  errorText: { marginTop: spacing.xs, fontSize: typography.sizes.xs, color: colors.error },

  // Photos
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  photoPickerBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  photoPickerText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumb: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26,60,110,0.75)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  photoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },

  // Footer navigation
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  footerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepPillRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  backBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: typography.sizes.md, color: colors.white, fontWeight: '700' },

  // Succès
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.base,
  },
  successTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successRef: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  successBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.base,
  },
  successBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.md },
  successSecondary: { marginTop: spacing.sm },
  successSecondaryText: { color: colors.primary, fontWeight: '600', fontSize: typography.sizes.sm },
});
