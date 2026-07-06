import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Screen, Text } from '@shared/ui';

export default function NewEventModal() {
  const router = useRouter();
  return (
    <Screen>
      <View className="gap-2">
        <Text variant="h2">Eveniment nou</Text>
        <Text variant="body" tone="secondary">
          Salariu, cheltuială, investiție, transfer, o țigară... Totul e un Eveniment.
        </Text>
      </View>
      <Card tone="surface">
        <Text variant="body" tone="secondary">
          Formularul rapid (2 tap-uri) vine în Faza 1: tip → sumă → domeniu → salvezi.
        </Text>
      </Card>
      <Button label="Închide" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
