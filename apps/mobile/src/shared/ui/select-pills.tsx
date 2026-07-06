import { Pressable, View } from 'react-native';
import { Text } from './text';

interface Option<T extends string> {
  key: T;
  label: string;
}

interface SelectPillsProps<T extends string> {
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}

export function SelectPills<T extends string>({
  options,
  value,
  onChange,
}: SelectPillsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            className={`h-10 items-center justify-center rounded-pill px-4 ${active ? 'bg-accent' : 'bg-bg-surface2'}`}
          >
            <Text variant="caption" tone={active ? 'primary' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
