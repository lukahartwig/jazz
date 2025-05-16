import { useAccount } from "jazz-react";
import { useAuth } from "jazz-react-auth-betterauth";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback } from "react";
import { Avatar, AvatarFallback } from "./avatar.js";
import { Button } from "./button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  logoutRedirectUrl?: string;
  settingsUrl?: string;
}

export const UserButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ logoutRedirectUrl, settingsUrl }) => {
    const { logOut } = useAccount();
    const auth = useAuth();
    const router = useRouter();
    const signOut = useCallback(() => {
      auth.authClient
        .signOut()
        .catch(console.error)
        .finally(() => {
          logOut();
          if (logoutRedirectUrl) router.push(logoutRedirectUrl);
        });
    }, [logOut, router, auth.authClient]);
    const avatarFallback = auth.account?.name
      .split(" ")
      .map((x) => x.charAt(0).toUpperCase())
      .join("");

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {auth.account?.name}
              </span>
              <span className="truncate text-xs">{auth.account?.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          // side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {auth.account?.name}
                </span>
                <span className="truncate text-xs">{auth.account?.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          {settingsUrl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href={settingsUrl}>
                  <DropdownMenuItem>
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
UserButton.displayName = "UserButton";
