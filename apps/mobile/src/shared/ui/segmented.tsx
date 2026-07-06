import { Pressable, View } from 'react-native';
import { Text } from './text';

interface Option<T extends string> {
  key: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-md bg-bg-surface2 p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            className={`h-11 flex-1 items-center justify-center rounded-sm ${active ? 'bg-accent' : ''}`}
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
