import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { colors, softShadow } from '../theme/colors';

/** The Add-Event action. Positioned by the parent (centered over the tab bar). */
export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Adaugă eveniment"
      className="h-16 w-16 items-center justify-center rounded-pill bg-accent"
      style={({ pressed }) => [softShadow, pressed ? { opacity: 0.9 } : null]}
    >
      <Plus size={28} color={colors.content.primary} strokeWidth={2.5} />
    </Pressable>
  );
}
