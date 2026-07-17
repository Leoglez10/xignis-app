const NAME_PARTICLES = new Set(["da", "de", "del", "la", "las", "los", "van", "von", "y"]);

export function initials(name: string, fallback = "?") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const meaningful = parts.filter((part, index) => index === 0 || !NAME_PARTICLES.has(part.toLocaleLowerCase("es")));
  const selected = meaningful.length === 1 ? [meaningful[0]] : [meaningful[0], meaningful.at(-1)!];
  return selected.map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("es");
}
