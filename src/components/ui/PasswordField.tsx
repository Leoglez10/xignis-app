import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { TextInput } from "./TextInput";

type PasswordFieldProps = Omit<ComponentProps<typeof TextInput>, "type">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} autoComplete={props.autoComplete ?? "current-password"} className="pr-14" type={visible ? "text" : "password"} />
      <button
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1 top-[2rem] grid size-11 place-items-center rounded-full text-[var(--color-muted)]"
        type="button"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
      </button>
    </div>
  );
}
