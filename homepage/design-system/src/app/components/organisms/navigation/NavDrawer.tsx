import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { clsx } from "clsx";
import { Icon } from "../../atoms/Icon";

export function NavDrawer({
  children,
  from,
  isOpen,
  onClose,
  title,
}: {
  children: React.ReactNode;
  from: "left" | "right";
  isOpen: boolean;
  title?: string;
  onClose: () => void;
}) {
  return (
    <Dialog onClose={onClose} open={isOpen}>
      <DialogBackdrop
        transition
        className="fixed inset-0 top-0 z-40 bg-zinc-400/20 backdrop-blur-sm data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:bg-black/40"
      />

      <div className="fixed inset-0 overflow-y-auto z-50">
        <DialogPanel
          className={clsx(
            "max-w-lg min-h-screen p-4 pb-32 bg-white dark:bg-stone-950 shadow-lg",
            "duration-200 data-[enter]:ease-out data-[leave]:ease-in",
            { "data-[closed]:translate-x-full  ml-auto": from === "right" },
            { "data-[closed]:translate-x-[-100%] ": from === "left" },
          )}
          transition
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-medium text-stone-900 dark:text-white">
              {title}
            </p>
            <button type="button" onClick={onClose}>
              <span className="sr-only">Close menu</span>
              <Icon name="close" size="lg" />
            </button>
          </div>

          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
