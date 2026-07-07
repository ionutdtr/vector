import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, elevation } from '../theme/colors';
import { PRESS_SCALE, springPress } from '../theme/motion';

/** The Add-Event action. Lifted clearly above the glass bar so it reads as chrome. */
export function Fab({ onPress }: { onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const press = (to: number) => {
    if (reduceMotion) return;
    scale.value = withSpring(to, springPress);
  };

  return (
    <Animated.View style={[elevation.hero, animated]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => press(PRESS_SCALE)}
        onPressOut={() => press(1)}
        accessibilityLabel="Adaugă eveniment"
        className="h-16 w-16 items-center justify-center rounded-pill bg-accent"
      >
        <Plus size={28} color={colors.content.primary} strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}
