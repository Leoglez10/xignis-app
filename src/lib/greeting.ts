const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", weekday: "long" });

export function greetingFor(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function longDateEs(date: Date = new Date()): string {
  const s = fmt.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
