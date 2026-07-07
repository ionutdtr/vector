import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { EventRecord } from '@shared/api/events';
import { colors } from '@shared/theme/colors';
import { Money, Text } from '@shared/ui';
import {
  CHIP,
  CHIP_GAP,
  CHIP_ICON,
  DIVIDER_INSET,
  RAIL_GUTTER,
} from '@features/timeline/rail';
import {
  categoryColor,
  categoryWash,
  eventVisualOf,
} from '@features/timeline/colors';
import { localTime, signOf } from '@features/timeline/group';

function metaLine(event: EventRecord): string {
  const domain = event.domain === 'business' ? 'Firmă' : 'Personal';
  const time = localTime(event.occurredAt);
  const cat = event.category?.trim();
  return [domain, cat || null, time].filter(Boolean).join(' · ');
}

export function EventRow({
  event,
  topDivider = false,
  onPress,
  onLongPress,
}: {
  event: EventRecord;
  topDivider?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const v = eventVisualOf(event.type);
  const Icon = v.Icon;
  // Merchant spends get a Revolut-style initial avatar tinted by category;
  // money-movement events (income, transfer, invest, smoking) keep their glyph.
  const useAvatar = event.type === 'expense' || event.type === 'subscription';
  const catColor = categoryColor(event.category);
  const initial = event.title.trim().charAt(0).toUpperCase() || '·';
  const sign = signOf(event.type);
  const magnitude = Number(event.baseAmount);
  const isSmokingLeak = event.type === 'smoking' && magnitude === 0;

  const press = useSharedValue(0);
  const overlay = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.value,
      [0, 1],
      ['rgba(255,255,255,0)', colors.rowPress],
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 120 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 120 });
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, overlay]}
      />

      {topDivider ? (
        <View
          style={{
            position: 'absolute',
            left: RAIL_GUTTER + DIVIDER_INSET,
            right: 0,
            top: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.divider.inset,
          }}
        />
      ) : null}

      <View
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: 12 }}
      >
        {/* rail gutter — deliberately node-free for money rows */}
        <View style={{ width: RAIL_GUTTER }} />

        <View
          style={{
            width: CHIP,
            height: CHIP,
            borderRadius: CHIP / 2,
            backgroundColor: useAvatar ? categoryWash(event.category) : v.chipBg,
            borderWidth: 1,
            borderColor: colors.chipRing,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {useAvatar ? (
            <Text style={{ color: catColor, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16 }}>
              {initial}
            </Text>
          ) : (
            <Icon size={CHIP_ICON} color={v.fg} strokeWidth={2} />
          )}
        </View>

        <View style={{ flex: 1, marginLeft: CHIP_GAP }}>
          <Text variant="body" style={{ lineHeight: 20 }} numberOfLines={1}>
            {event.title}
          </Text>
          <Text variant="small" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
            {metaLine(event)}
          </Text>
        </View>

        <View style={{ marginLeft: 12, alignItems: 'flex-end' }}>
          {isSmokingLeak ? (
            <View
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text variant="small" style={{ color: v.amountColor }}>
                scurgere
              </Text>
            </View>
          ) : sign === 0 ? (
            <Money value={magnitude} variant="amountRow" color={v.amountColor} />
          ) : (
            <Money
              value={sign * magnitude}
              variant="amountRow"
              color={v.amountColor}
              forceSign={sign > 0}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}
