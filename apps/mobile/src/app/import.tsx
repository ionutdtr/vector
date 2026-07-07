import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { type ImportSummary, useImportRevolut } from '@shared/api/import';
import { formatAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { Button, Card, Screen, Text } from '@shared/ui';

const TYPE_RO: Record<string, string> = {
  expense: 'Cheltuieli',
  income: 'Venituri',
  transfer: 'Transferuri',
  smoking: 'Fumat',
};

const SKIP_RO: Record<string, string> = {
  internal: 'mișcări interne (top-up, schimb, economii)',
  not_completed: 'neconfirmate / anulate',
  unknown_type: 'tip necunoscut',
  zero: 'fără valoare',
};

export default function ImportScreen() {
  const router = useRouter();
  const importer = useImportRevolut();
  const [paste, setPaste] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (csv: string) => {
    setError(null);
    setSummary(null);
    if (!csv.trim()) {
      setError('Fișier gol — nimic de importat.');
      return;
    }
    try {
      const s = await importer.mutateAsync(csv);
      setSummary(s);
      setPaste('');
    } catch (e) {
      setError(String(e));
    }
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'public.comma-separated-values-text',
          'text/plain',
          'public.text',
        ],
        copyToCacheDirectory: true,
      });
      const asset = res.canceled ? undefined : res.assets?.[0];
      if (!asset) return;
      const text = await FileSystem.readAsStringAsync(asset.uri);
      await run(text);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <Screen>
      <Text variant="largeTitle">Import Revolut</Text>
      <Text variant="caption" tone="muted">
        Export din Revolut → CSV → importă aici. Se poate reimporta oricând: rândurile
        deja adăugate sunt sărite automat, iar soldul se sincronizează din extras.
      </Text>

      {summary ? <SummaryCard summary={summary} /> : null}

      {error ? (
        <Card className="border border-danger/30" shadow={false}>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </Card>
      ) : null}

      <Button
        label={importer.isPending ? 'Se importă…' : 'Alege fișier CSV'}
        loading={importer.isPending}
        onPress={pickFile}
      />

      <View className="gap-2">
        <Text variant="small" tone="muted">
          Sau lipește conținutul CSV:
        </Text>
        <TextInput
          value={paste}
          onChangeText={setPaste}
          multiline
          placeholder="Type,Product,Started Date,Completed Date,Description,Amount,…"
          placeholderTextColor={colors.content.muted}
          style={{
            minHeight: 120,
            color: colors.content.primary,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.md,
            padding: 14,
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            textAlignVertical: 'top',
          }}
        />
        <Button
          label="Importă textul"
          variant="secondary"
          loading={importer.isPending}
          onPress={() => run(paste)}
        />
      </View>

      <Button label="Închide" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function SummaryCard({ summary }: { summary: ImportSummary }) {
  const skippedTotal = Object.values(summary.skipped).reduce((a, b) => a + b, 0);
  return (
    <Card tone="accent" shadow={false}>
      <Text variant="tag" tone="accent">
        IMPORT REUȘIT
      </Text>
      <Text variant="h2" style={{ marginTop: 8 }}>
        {summary.imported}
        <Text variant="title" tone="secondary">
          {summary.imported === 1 ? ' tranzacție nouă' : ' tranzacții noi'}
        </Text>
      </Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
        {summary.duplicates} deja importate · {skippedTotal}{' '}
        {SKIP_RO.internal.split(' (')[0]}
      </Text>

      {Object.keys(summary.byType).length ? (
        <View className="mt-4 gap-1">
          {Object.entries(summary.byType).map(([k, v]) => (
            <View key={k} className="flex-row justify-between">
              <Text variant="caption" tone="secondary">
                {TYPE_RO[k] ?? k}
              </Text>
              <Text variant="caption" tabular>
                {v}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {summary.reconciled.current != null ? (
        <Text variant="caption" tone="muted" style={{ marginTop: 12 }}>
          Sold Revolut sincronizat: {formatAmount(summary.reconciled.current)} RON
        </Text>
      ) : null}
    </Card>
  );
}
