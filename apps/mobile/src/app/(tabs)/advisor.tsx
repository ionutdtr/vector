import { Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ChatMessage, useChat, useSendMessage } from '@shared/api/ai';
import { selectionTick } from '@shared/lib/haptics';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { Button, Markdown, Text } from '@shared/ui';

/** Quick openers — a mix of the three questions the CFO answers + natural-language logging. */
const SUGGESTIONS = [
  'Cum stau cu apartamentul?',
  'Îmi permit un MacBook Pro?',
  'Cât am pierdut pe fumat luna asta?',
  'Notează: 200 lei benzină',
  'Unde pierd cei mai mulți bani?',
];

export default function AdvisorScreen() {
  const insets = useSafeAreaInsets();
  const { data, isError } = useChat();
  const send = useSendMessage();
  const [input, setInput] = useState('');
  // The just-sent message, shown optimistically until the thread refetches.
  const [pending, setPending] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const messages = data?.messages ?? [];
  const isEmpty = messages.length === 0 && !pending;
  // Glass tab bar is an absolute overlay (height 62 + safe area in the tabs
  // layout); the composer must clear it when idle and sit flush above the
  // keyboard when typing — hence the matching keyboardVerticalOffset.
  const tabBar = 62 + insets.bottom;

  const sendText = (raw: string) => {
    const m = raw.trim();
    if (!m || send.isPending) return;
    selectionTick();
    setInput('');
    setPending(m);
    send.mutate(
      { message: m, threadId: data?.threadId },
      { onSettled: () => setPending(null) },
    );
  };

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <AdvisorHeader />

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16, gap: 14 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {isEmpty && !isError ? <EmptyIntro /> : null}

        {isError ? (
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderRadius: radius.chip,
              borderWidth: 1,
              borderColor: colors.hairline,
              padding: 16,
            }}
          >
            <Text variant="body" tone="secondary">
              Advisor indisponibil — adaugă `ANTHROPIC_API_KEY` în backend ca să
              pornești CFO-ul.
            </Text>
          </View>
        ) : null}

        {messages.map((m, i) => (
          <MessageBubble key={m.id ?? i} message={m} index={i} />
        ))}

        {pending ? <MessageBubble message={{ role: 'user', content: pending }} pendingSend /> : null}

        {send.isPending ? <TypingBubble /> : null}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={tabBar}
      >
        {input.trim() === '' ? (
          <PromptChips onPick={sendText} disabled={send.isPending} />
        ) : null}

        <View
          className="flex-row items-center gap-2 px-5"
          style={{ paddingBottom: tabBar + 6 }}
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
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
            onSubmitEditing={() => sendText(input)}
            returnKeyType="send"
          />
          <Button label="Trimite" onPress={() => sendText(input)} className="px-5" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Title + subtitle + a discreet brass voice mark — the CFO has a face, quietly. */
function AdvisorHeader() {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-3">
      <AdvisorAvatar />
      <View className="flex-1">
        <Text variant="h2" style={{ fontSize: 26, lineHeight: 30 }}>
          Advisor
        </Text>
        <Text variant="small" tone="muted" style={{ marginTop: 1 }}>
          CFO-ul tău · calm, direct, cu numerele tale
        </Text>
      </View>
    </View>
  );
}

/** The advisor's mark: a brass-washed disc — the one warm (plan-voice) accent here. */
function AdvisorAvatar({ size = 38 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.signal.wash,
        borderWidth: 1,
        borderColor: 'rgba(229,169,78,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Sparkles size={size * 0.46} color={colors.signal.target} strokeWidth={2.3} />
    </View>
  );
}

/** One turn. User = accent fill, right-anchored. AI = surface + hairline + brass voice edge, left-anchored. */
function MessageBubble({
  message,
  index = 0,
  pendingSend = false,
}: {
  message: ChatMessage;
  index?: number;
  pendingSend?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const isUser = message.role === 'user';
  const entering = reduceMotion
    ? undefined
    : FadeInDown.duration(260).delay(Math.min(index, 8) * 20);

  if (isUser) {
    return (
      <Animated.View entering={entering} className="items-end" style={{ opacity: pendingSend ? 0.7 : 1 }}>
        <View
          style={{
            maxWidth: '86%',
            backgroundColor: colors.accent.default,
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderTopLeftRadius: radius.chip,
            borderTopRightRadius: radius.chip,
            borderBottomLeftRadius: radius.chip,
            borderBottomRightRadius: 7,
          }}
        >
          <Markdown text={message.content} tone="primary" />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} className="flex-row items-end gap-2" style={{ paddingRight: 24 }}>
      <AdvisorAvatar size={26} />
      <View
        style={{
          flexShrink: 1,
          backgroundColor: colors.bg.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: radius.chip,
          borderTopRightRadius: radius.chip,
          borderBottomRightRadius: radius.chip,
          borderBottomLeftRadius: 7,
          // The discreet brass "voice" edge — never a filled brass surface.
          borderLeftColor: colors.signal.glidepath,
          borderLeftWidth: 1.5,
        }}
      >
        <Markdown text={message.content} tone="secondary" />
      </View>
    </Animated.View>
  );
}

/** Three brass dots breathing in sequence — the CFO is composing. */
function TypingBubble() {
  return (
    <Animated.View entering={FadeIn.duration(200)} className="flex-row items-end gap-2">
      <AdvisorAvatar size={26} />
      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
          backgroundColor: colors.bg.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          borderLeftColor: colors.signal.glidepath,
          borderLeftWidth: 1.5,
          paddingHorizontal: 16,
          paddingVertical: 15,
          borderTopLeftRadius: radius.chip,
          borderTopRightRadius: radius.chip,
          borderBottomRightRadius: radius.chip,
          borderBottomLeftRadius: 7,
        }}
      >
        {[0, 1, 2].map((i) => (
          <TypingDot key={i} index={i} />
        ))}
      </View>
    </Animated.View>
  );
}

function TypingDot({ index }: { index: number }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) {
      t.value = 1;
      return;
    }
    t.value = withDelay(
      index * 160,
      withRepeat(withTiming(1, { duration: 620 }), -1, true),
    );
  }, [reduceMotion, index, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.55,
    transform: [{ translateY: (1 - t.value) * 2 }],
  }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.signal.target },
        style,
      ]}
    />
  );
}

/** The opener — a brass-edged intro card that states what the advisor is for. */
function EmptyIntro() {
  return (
    <View style={{ paddingTop: 24, alignItems: 'center', gap: 16 }}>
      <AdvisorAvatar size={54} />
      <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
        <Text variant="h3" style={{ textAlign: 'center' }}>
          Sunt CFO-ul tău.
        </Text>
        <Text
          variant="body"
          tone="secondary"
          style={{ textAlign: 'center', marginTop: 8 }}
        >
          Întreabă-mă orice despre banii tăi — sau spune-mi ce să notez („am dat
          200 pe benzină"). Răspund cu numerele tale reale și îți citez regulile
          IPS.
        </Text>
      </View>
    </View>
  );
}

/** Tap-to-send opener chips, scrolled just above the composer. */
function PromptChips({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
    >
      {SUGGESTIONS.map((s) => (
        <Pressable
          key={s}
          onPress={() => onPick(s)}
          disabled={disabled}
          style={{
            height: 36,
            justifyContent: 'center',
            paddingHorizontal: 14,
            borderRadius: radius.pill,
            backgroundColor: colors.bg.surface2,
            borderWidth: 1,
            borderColor: colors.hairline,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Text variant="small" tone="secondary">
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
