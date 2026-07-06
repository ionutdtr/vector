import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useAccounts } from '@shared/api/accounts';
import { type ReceiptScan, useScanReceipt } from '@shared/api/ai';
import { useCreateEvent } from '@shared/api/events';
import { DOMAIN_OPTIONS } from '@shared/constants';
import { colors } from '@shared/theme/colors';
import {
  Button,
  Card,
  Field,
  Screen,
  Segmented,
  SelectPills,
  Text,
} from '@shared/ui';

const TYPE_OPTIONS = [
  { key: 'expense', label: 'Cheltuială' },
  { key: 'smoking', label: 'Fumat' },
] as const;

const CURRENCY_OPTIONS = [
  { key: 'RON', label: 'RON' },
  { key: 'EUR', label: 'EUR' },
  { key: 'USD', label: 'USD' },
] as const;

type Phase = 'idle' | 'scanning' | 'review';
type TypeKey = (typeof TYPE_OPTIONS)[number]['key'];
type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];
type CurrencyKey = (typeof CURRENCY_OPTIONS)[number]['key'];

const CURRENCY_KEYS = CURRENCY_OPTIONS.map((o) => o.key) as CurrencyKey[];

export default function ScanReceiptModal() {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const scan = useScanReceipt();
  const createEvent = useCreateEvent();

  const [phase, setPhase] = useState<Phase>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Review fields — prefilled from the scan, then the user's to confirm.
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TypeKey>('expense');
  const [domain, setDomain] = useState<DomainKey>('personal');
  const [currency, setCurrency] = useState<CurrencyKey>('RON');
  const [detectedDate, setDetectedDate] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ReceiptScan['confidence']>('high');
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  const numeric = Number(amount.replace(',', '.'));
  const canSave = title.trim().length > 0 && numeric > 0 && !createEvent.isPending;

  const applyScan = (r: ReceiptScan) => {
    if (!r.is_receipt) {
      setNote('Nu pare a fi un bon. Încearcă o poză mai clară.');
      setPhase('idle');
      setPreview(null);
      return;
    }
    setTitle(r.merchant || 'Bon');
    setAmount(r.total > 0 ? String(r.total) : '');
    setType(r.type);
    setCurrency(
      CURRENCY_KEYS.includes(r.currency as CurrencyKey)
        ? (r.currency as CurrencyKey)
        : 'RON',
    );
    setDetectedDate(r.date ?? null);
    setConfidence(r.confidence);
    setPhase('review');
  };

  const pick = async (from: 'camera' | 'library') => {
    setNote(null);
    try {
      const perm =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNote(
          from === 'camera'
            ? 'Accesul la cameră e necesar pentru scanare.'
            : 'Accesul la poze e necesar pentru scanare.',
        );
        return;
      }

      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({
              quality: 1,
              mediaTypes: 'images',
            });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      setPreview(uri);
      setPhase('scanning');

      // Normalize to a small JPEG — iOS photos are HEIC (which the vision API
      // rejects) and full-res is needless payload. 1600px keeps a bon legible.
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: 1600 });
      const rendered = await ctx.renderAsync();
      const out = await rendered.saveAsync({
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!out.base64) {
        setNote('Nu am putut procesa imaginea.');
        setPhase('idle');
        return;
      }

      const r = await scan.mutateAsync({
        image: out.base64,
        mediaType: 'image/jpeg',
      });
      applyScan(r);
    } catch {
      setNote('Scanarea nu e disponibilă. Reconstruiește aplicația (npm run ios).');
      setPhase('idle');
      setPreview(null);
    }
  };

  const onSave = () => {
    // The receipt's own date is the true transaction time; fall back to now.
    const occurredAt = detectedDate
      ? new Date(`${detectedDate}T12:00:00.000Z`).toISOString()
      : new Date().toISOString();
    createEvent.mutate(
      {
        domain,
        type,
        title: title.trim(),
        amount: numeric,
        currency,
        occurredAt,
        accountId,
      },
      { onSuccess: () => router.back() },
    );
  };

  const reset = () => {
    setPhase('idle');
    setPreview(null);
    setNote(null);
  };

  const accountOptions = (accounts ?? [])
    .filter((a) => a.domain === domain && !a.isArchived)
    .map((a) => ({ key: a.id, label: a.name }));

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Scanează bon</Text>
        <Text variant="body" tone="secondary">
          O poză → o cheltuială. Confirmi tu înainte să o notez.
        </Text>
      </View>

      {preview ? (
        <Image
          source={{ uri: preview }}
          className="h-48 w-full rounded-card"
          resizeMode="cover"
        />
      ) : null}

      {note ? (
        <Text variant="caption" tone="danger">
          {note}
        </Text>
      ) : null}

      {phase === 'idle' ? (
        <View className="gap-3">
          <Button label="Fotografiază bon" onPress={() => pick('camera')} />
          <Button
            label="Alege din galerie"
            variant="secondary"
            onPress={() => pick('library')}
          />
        </View>
      ) : null}

      {phase === 'scanning' ? (
        <Card>
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color={colors.accent.default} />
            <Text variant="body" tone="secondary">
              Citesc bonul…
            </Text>
          </View>
        </Card>
      ) : null}

      {phase === 'review' ? (
        <View className="gap-5">
          {confidence === 'low' ? (
            <Card tone="surface2">
              <Text variant="caption" tone="secondary">
                Citire nesigură — verifică suma și comerciantul înainte de a
                salva.
              </Text>
            </Card>
          ) : null}

          <View className="gap-3">
            <Text variant="caption" tone="secondary">
              Tip
            </Text>
            <Segmented
              options={[...TYPE_OPTIONS]}
              value={type}
              onChange={setType}
            />
          </View>

          <Segmented
            options={[...DOMAIN_OPTIONS]}
            value={domain}
            onChange={(v) => {
              setDomain(v);
              setAccountId(undefined);
            }}
          />

          <Field
            label="Comerciant"
            value={title}
            onChangeText={setTitle}
            placeholder="ex. Kaufland"
          />
          <Field
            label="Sumă"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="decimal-pad"
          />

          <View className="gap-2">
            <Text variant="caption" tone="secondary">
              Monedă
            </Text>
            <Segmented
              options={[...CURRENCY_OPTIONS]}
              value={currency}
              onChange={setCurrency}
            />
          </View>

          {detectedDate ? (
            <Text variant="caption" tone="muted">
              Data pe bon: {detectedDate}
            </Text>
          ) : null}

          {accountOptions.length > 0 ? (
            <View className="gap-3">
              <Text variant="caption" tone="secondary">
                Cont (opțional)
              </Text>
              <SelectPills
                options={accountOptions}
                value={accountId}
                onChange={setAccountId}
              />
            </View>
          ) : null}

          {createEvent.isError ? (
            <Text variant="caption" tone="danger">
              Nu am putut salva. Verifică API-ul.
            </Text>
          ) : null}

          <Button
            label="Salvează cheltuiala"
            loading={createEvent.isPending}
            onPress={canSave ? onSave : undefined}
            className={canSave ? '' : 'opacity-40'}
          />
          <Button label="Reia" variant="ghost" onPress={reset} />
        </View>
      ) : null}

      {phase !== 'review' ? (
        <Button label="Renunță" variant="ghost" onPress={() => router.back()} />
      ) : null}
    </Screen>
  );
}
