import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { TypeVariant } from '../theme/typography';
import { humanizeRule, isRuleCode } from '../lib/rules';
import { Text, type Tone } from './text';

/**
 * Minimal, dependency-free markdown for the AI surfaces. The model emits
 * **bold**, `code` (rule codes), and `-` bullet lists; render those instead of
 * showing the raw syntax. Deliberately small — no tables, links, or images.
 */
const INLINE_RE = /(\*\*[^*]+?\*\*|`[^`]+?`)/g;

/** Strip inline/block markdown to plain text (for the collapsed insight lede). */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/`([^`]+?)`/g, (_, c: string) => (isRuleCode(c) ? humanizeRule(c) : c))
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .trim();
}

/** The first paragraph, flattened to a single line — the 2-line preview source. */
export function previewText(text: string): string {
  const firstPara = text.split(/\n\s*\n/)[0] ?? text;
  return stripMarkdown(firstPara).replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * Structural test for "is there more to show" — decided at render time (never
 * via onTextLayout) so the memo never flashes a truncated frame. True when the
 * body has multiple paragraphs, any list/heading, or a long opening paragraph.
 */
export function hasRichBody(text: string): boolean {
  if (/\n\s*\n/.test(text)) return true;
  if (/^\s*(?:[-*•]|#{1,6})\s+/m.test(text)) return true;
  return previewText(text).length > 120;
}

function inlineNodes(text: string, tone: Tone): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(
        <Text key={key++} tone={tone} style={{ fontFamily: 'Inter_700Bold' }}>
          {tok.slice(2, -2)}
        </Text>,
      );
    } else {
      const code = tok.slice(1, -1);
      out.push(
        <Text key={key++} tone="accent" style={{ fontFamily: 'Inter_500Medium' }}>
          {isRuleCode(code) ? humanizeRule(code) : code}
        </Text>,
      );
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({
  text,
  variant = 'body',
  tone = 'secondary',
}: {
  text: string;
  variant?: TypeVariant;
  tone?: Tone;
}) {
  const lines = text.split('\n');
  return (
    <View className="gap-2">
      {lines.map((raw, i) => {
        if (!raw.trim()) return null;
        const isBullet = /^\s*[-*•]\s+/.test(raw);
        const isHeader = /^\s*#{1,6}\s+/.test(raw);
        const content = raw
          .replace(/^\s*[-*•]\s+/, '')
          .replace(/^\s*#{1,6}\s+/, '')
          .trimEnd();

        if (isBullet) {
          return (
            <View key={i} className="flex-row gap-2">
              <Text variant={variant} tone={tone}>
                •
              </Text>
              <Text variant={variant} tone={tone} style={{ flex: 1 }}>
                {inlineNodes(content, tone)}
              </Text>
            </View>
          );
        }

        const lineTone: Tone = isHeader ? 'primary' : tone;
        return (
          <Text
            key={i}
            variant={variant}
            tone={lineTone}
            style={isHeader ? { fontFamily: 'Inter_700Bold' } : undefined}
          >
            {inlineNodes(content, lineTone)}
          </Text>
        );
      })}
    </View>
  );
}
