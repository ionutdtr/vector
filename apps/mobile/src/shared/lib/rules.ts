/**
 * IPS rule codes → human Romanian labels. The AI emits rule codes as inline
 * `code` (e.g. `impulse_cap`); rendered raw they read as leaked variables, so
 * every surface humanises them through here.
 */
const RULE_LABELS: Record<string, string> = {
  impulse_cap: 'plafon impuls',
  capital_has_a_job: 'capital cu rost',
  avoid_lifestyle_inflation: 'fără inflație de trai',
  protect_liquidity: 'protejează lichiditatea',
  business_first: 'firma pe primul loc',
  business_growth: 'creșterea firmei',
  invest_consistently: 'investește constant',
  smoking_is_a_leak: 'fumatul e o scurgere',
  prefer_financing: 'preferă finanțarea',
  apartment_no_liquidity_hit: 'apartament fără lovitură de lichiditate',
};

/** Is this token a rule-code-shaped identifier (snake_case / known rule)? */
export function isRuleCode(token: string): boolean {
  return token in RULE_LABELS || /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(token);
}

/** Humanise a rule code; falls back to de-underscoring an unknown identifier. */
export function humanizeRule(code: string): string {
  return RULE_LABELS[code] ?? code.replace(/_/g, ' ');
}
