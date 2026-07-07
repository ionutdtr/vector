import { ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, softShadow } from '../theme/colors';
import { humanizeRule, kindVisualOf } from '@features/timeline/colors';
import { hasRichBody, Markdown, previewText } from './markdown';
import { Text } from './text';

interface InsightLike {
  kind: string;
  title: string;
  body: string;
  ruleCode?: string | null;
  severity?: string | null;
}

/**
 * The CFO memo. Elevated (softShadow) so it floats above the flat money rows,
 * with a kind-coloured docket rule down its left edge. Collapsed by default to
 * a tag + title + 2-line lede — the fix for the multi-paragraph wall of text —
 * and expands to the full markdown on tap. Critical alerts open on mount so the
 * CFO never buries a warning behind a preview.
 *
 * Structure note: the shadow lives on the OUTER view and the clip (overflow) on
 * the INNER — iOS clips a layer's own shadow when clipsToBounds is set, so the
 * two must be separated or the card renders flat.
 */
export function InsightCard({ insight }: { insight: InsightLike }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const kv = kindVisualOf(insight.kind);
  const Icon = kv.Icon;
  const isCritical = insight.severity === 'critical';
  const accent = isCritical ? colors.danger : kv.color;
  const canExpand = hasRichBody(insight.body);

  const [expanded, setExpanded] = useState(isCritical);
  const showFull = expanded || !canExpand;

  const rot = useSharedValue(isCritical ? 1 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 180}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    rot.value = reduceMotion ? (next ? 1 : 0) : withTiming(next ? 1 : 0, {
      duration: 220,
      easing: Easing.inOut(Easing.quad),
    });
  };

  return (
    <Pressable onPress={canExpand ? toggle : undefined} disabled={!canExpand}>
      <Animated.View
        layout={reduceMotion ? undefined : LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
        style={[
          { borderRadius: 16, backgroundColor: isCritical ? colors.memo.warnBg : colors.bg.surface },
          isCritical ? { borderWidth: 1, borderColor: colors.memo.warnBorder } : null,
          softShadow,
        ]}
      >
        <View style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* kind-coloured docket rule down the left edge */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 14,
              bottom: 14,
              width: 3,
              borderRadius: 2,
              backgroundColor: accent,
            }}
          />

          <View style={{ padding: 16, paddingLeft: 18 }}>
            {/* tag row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon size={14} color={accent} strokeWidth={2.2} />
              <Text variant="tag" style={{ color: accent, marginLeft: 6 }}>
                {kv.label}
              </Text>
              <View style={{ flex: 1 }} />
              {insight.ruleCode ? (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text variant="small" tone="secondary">
                    {humanizeRule(insight.ruleCode)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* title */}
            <Text variant="title" style={{ fontSize: 15, lineHeight: 20, marginTop: 10 }} numberOfLines={2}>
              {insight.title}
            </Text>

            {/* body — 2-line lede when collapsed, full markdown when open */}
            {showFull ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(180).delay(60)}>
                {canExpand ? (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginTop: 12 }} />
                ) : null}
                <View style={{ marginTop: 12 }}>
                  <Markdown text={insight.body} variant="caption" />
                </View>
                {insight.ruleCode ? (
                  <Pressable
                    onPress={() => router.push('/ips')}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.accent.wash,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text variant="small" tone="accent">
                      {`Regula IPS: ${humanizeRule(insight.ruleCode)}  →`}
                    </Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            ) : (
              <Text variant="lede" tone="secondary" numberOfLines={2} style={{ marginTop: 6 }}>
                {previewText(insight.body)}
              </Text>
            )}

            {/* expand affordance */}
            {canExpand ? (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: showFull ? 12 : 8 }}>
                <Animated.View style={chevronStyle}>
                  <ChevronDown size={16} color={colors.content.muted} strokeWidth={2.2} />
                </Animated.View>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
