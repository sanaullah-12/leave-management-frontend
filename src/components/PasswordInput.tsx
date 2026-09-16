import { useState, forwardRef } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Input from "./ui/Input";
import type { InputProps } from "./ui/Input";

/** The shared pill field plus a visibility toggle in its trailing slot. */
export type PasswordInputProps = Omit<InputProps, "type" | "trailing">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            /* `.tap-target` grows the hit box to 44px on a touch screen
               without moving the glyph, which has to stay optically centred
               on the field's trailing edge. A miss on a 20px icon lands in
               the field and re-opens the keyboard. */
            className="tap-target text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
