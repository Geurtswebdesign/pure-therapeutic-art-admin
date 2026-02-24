export function renderTemplate(
  html: string,
  variables: Record<string, string>
) {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value);
  }, html);
}
