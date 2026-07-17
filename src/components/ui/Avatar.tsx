import { initials } from "../../lib/avatar";

type AvatarProps = { alt?: string; className?: string; name: string; shape?: string; size?: string; src?: string | null };

export function Avatar({ alt, className = "", name, shape = "rounded-full", size = "size-11", src }: AvatarProps) {
  const base = `grid ${size} shrink-0 place-items-center overflow-hidden ${shape} bg-emerald-100 text-xs font-black text-emerald-800 ${className}`;
  return src ? <img alt={alt ?? name} className={`${base} object-cover`} src={src} /> : <span aria-label={alt ?? name} className={base} role="img">{initials(name)}</span>;
}
