// Looks up a text by key. {name} placeholders are replaced with the given values.
export function translate(dict, key, vars) {
  let text = dict[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}