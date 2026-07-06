import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat, useSendMessage } from '@shared/api/ai';
import { colors } from '@shared/theme/colors';
import { Button, Card, Markdown, Text } from '@shared/ui';

export default function AdvisorScreen() {
  const insets = useSafeAreaInsets();
  const { data, isError } = useChat();
  const send = useSendMessage();
  const [input, setInput] = useState('');

  const messages = data?.messages ?? [];

  const onSend = () => {
    const m = input.trim();
    if (!m || send.isPending) return;
    setInput('');
    send.mutate({ message: m, threadId: data?.threadId });
  };

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-2">
        <Text variant="h1">Advisor</Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
      >
        {messages.length === 0 && !isError ? (
          <Card>
            <Text variant="body" tone="secondary">
              Întreabă-mă orice despre banii tăi — sau spune-mi ce să notez („am
              dat 200 pe benzină"). Răspund cu numerele tale reale și îți citez
              regulile IPS.
            </Text>
          </Card>
        ) : null}

        {isError ? (
          <Card>
            <Text variant="body" tone="secondary">
              AI indisponibil — adaugă `ANTHROPIC_API_KEY` în backend.
            </Text>
          </Card>
        ) : null}

        {messages.map((m, i) => (
          <View
            key={m.id ?? i}
            className={m.role === 'user' ? 'items-end' : 'items-start'}
          >
            <View
              className={`max-w-[85%] rounded-lg px-4 py-3 ${m.role === 'user' ? 'bg-accent' : 'bg-bg-surface'}`}
            >
              <Markdown
                text={m.content}
                tone={m.role === 'user' ? 'primary' : 'secondary'}
              />
            </View>
          </View>
        ))}

        {send.isPending ? (
          <View className="items-start">
            <View className="rounded-lg bg-bg-surface px-4 py-3">
              <Text variant="body" tone="muted">
                …
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="flex-row items-center gap-2 px-5"
          style={{ paddingBottom: 12 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Scrie advisorului…"
            placeholderTextColor={colors.content.muted}
            className="h-14 flex-1 rounded-pill bg-bg-surface2 px-5"
            style={{
              color: colors.content.primary,
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
            }}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <Button label="Trimite" onPress={onSend} className="px-5" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
