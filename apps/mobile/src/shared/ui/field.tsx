import { type KeyboardTypeOptions, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { Text } from './text';

interface FieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View className="gap-2">
      {label ? (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.content.muted}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={!secure}
        className="h-14 rounded-md bg-bg-surface2 px-4"
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 16,
          color: colors.content.primary,
        }}
      />
    </View>
  );
}
