import { initials } from "../../../lib/avatar";
type EmployeeAvatarProps = {
  avatarUrl?: string | null;
  className?: string;
  fullName: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS: Record<NonNullable<EmployeeAvatarProps["size"]>, string> = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-16 text-sm",
};

export function EmployeeAvatar({
  avatarUrl,
  className = "",
  fullName,
  size = "md",
}: EmployeeAvatarProps) {
  const sizeClass = SIZE_CLASS[size];

  if (avatarUrl) {
    return (
      <img
        alt={`Avatar de ${fullName}`}
        className={`shrink-0 rounded-full object-cover ring-2 ring-[var(--card-border)] ${sizeClass} ${className}`}
        loading="lazy"
        src={avatarUrl}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-[var(--card-muted)] font-bold text-[var(--color-muted)] ring-1 ring-[var(--card-border)] ${sizeClass} ${className}`}
    >
      {initials(fullName)}
    </span>
  );
}