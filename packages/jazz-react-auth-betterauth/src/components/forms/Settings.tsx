import { Alert } from "@garden-co/design-system/design-system/src/components/atoms/Alert";
import { Heading } from "@garden-co/design-system/design-system/src/components/atoms/Heading";
import { Input } from "@garden-co/design-system/design-system/src/components/molecules/Input";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { useCallback, useEffect, useState } from "react";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { useAuth } from "../../contexts/Auth";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { DeleteAccountButton } from "../DeleteAccountButton";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { Button } from "../common/Button";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { Loading } from "../common/Loading";

const title = "Settings";

export default function SettingsForm() {
  const { auth, Image, Link, user, account, navigate } = useAuth();
  const [status, setStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [otpSentStatus, setOtpSentStatus] = useState<boolean>(false);
  const [otpStatus, setOtpStatus] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const initialAccounts = auth.authClient.listAccounts();
  const [accounts, setAccounts] = useState<
    Awaited<typeof initialAccounts> | undefined
  >(undefined);
  useEffect(() => {
    auth.authClient.useSession.subscribe(({ data }) => {
      auth.authClient.listAccounts().then((x) => setAccounts(x));
    });
  }, [user, account]);
  const { me, logOut } = useAccount({ resolve: { profile: true } });
  const isAuthenticated = useIsAuthenticated();
  const signOut = useCallback(() => {
    auth.authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          logOut();
          navigate("/");
        },
      },
    });
  }, [logOut, auth]);

  return (
    <>
      <header className="absolute p-4 top-0 left-0 w-full z-10 flex items-center justify-between gap-4">
        <div className="float-start">
          {me && user && account && isAuthenticated && (
            <Button className="float-start" onClick={signOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>
      <div className="min-h-screen flex flex-col justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-md flex flex-col gap-8 w-full px-6 py-12 mx-auto">
          <Heading level={1} className="mb-2">
            {title}
          </Heading>

          {status && account && !account?.emailVerified && (
            <Alert variant="info" title="Settings">
              Instructions to verify your account have been sent to{" "}
              {account.email}, if an account with that email address exists.
            </Alert>
          )}

          {(status || otpStatus) && account && account.emailVerified && (
            <Alert variant="info" title="Settings">
              Your account has been successfully verified.
            </Alert>
          )}

          {error && (
            <Alert variant="warning" title="Settings">
              {error.message}
            </Alert>
          )}

          {loading && <Loading />}

          <table className="w-full text-sm border-full border-collapse">
            <thead className="text-xs">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Provider
                </th>
                <th scope="col" className="px-6 py-3">
                  Created
                </th>
                <th scope="col" className="px-6 py-3">
                  Updated
                </th>
                <th scope="col" className="px-6 py-3">
                  Scopes
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts?.data &&
                accounts.data.map((account) => (
                  <tr key={account.id} className="border-b">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      {account.provider}
                    </th>
                    <td className="px-6 py-4">
                      {account.createdAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {account.updatedAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{account.scopes.join(", ")}</td>
                    <td className="px-6 py-4">
                      <Button
                        variant="secondary"
                        className="relative"
                        onClick={async (e) => {
                          e.preventDefault();
                          setLoading(true);
                          const { error } = await auth.authClient.unlinkAccount(
                            {
                              providerId: account.provider,
                              accountId: account.id,
                            },
                          );
                          const errorMessage =
                            error?.message ?? error?.statusText;
                          setError(
                            error
                              ? {
                                  ...error,
                                  name: error.statusText,
                                  message:
                                    errorMessage && errorMessage.length > 0
                                      ? errorMessage
                                      : "An error occurred",
                                }
                              : undefined,
                          );
                          setLoading(false);
                        }}
                      >
                        Unlink
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {accounts?.data &&
            accounts.data.find((x) => x.provider === "github") ===
              undefined && (
              <Button
                variant="secondary"
                className="relative"
                onClick={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  const { error } = await auth.authClient.linkSocial({
                    provider: "github",
                  });
                  const errorMessage = error?.message ?? error?.statusText;
                  setError(
                    error
                      ? {
                          ...error,
                          name: error.statusText,
                          message:
                            errorMessage && errorMessage.length > 0
                              ? errorMessage
                              : "An error occurred",
                        }
                      : undefined,
                  );
                  setLoading(false);
                }}
              >
                <Image
                  src="/social/github.svg"
                  alt="GitHub logo"
                  className="absolute left-3 dark:invert"
                  width={16}
                  height={16}
                />
                Link GitHub account
              </Button>
            )}
          {account && account.emailVerified && <p>Account verified.</p>}
          {account && !account.emailVerified && (
            <>
              <Button
                variant="secondary"
                className="relative"
                onClick={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  const { data, error } =
                    await auth.authClient.sendVerificationEmail({
                      email: account.email,
                      callbackURL: `${window.location.origin}`,
                    });
                  setStatus(data?.status ?? false);
                  const errorMessage = error?.message ?? error?.statusText;
                  setError(
                    error
                      ? {
                          ...error,
                          name: error.statusText,
                          message:
                            errorMessage && errorMessage.length > 0
                              ? errorMessage
                              : "An error occurred",
                        }
                      : undefined,
                  );
                  setLoading(false);
                }}
              >
                Send verification link
              </Button>
              <Button
                variant="secondary"
                className="relative"
                onClick={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  const { data, error } =
                    await auth.authClient.emailOtp.sendVerificationOtp({
                      email: account.email,
                      type: "email-verification",
                    });
                  setStatus(data?.success ?? false);
                  setOtpSentStatus(data?.success ?? false);
                  const errorMessage = error?.message ?? error?.statusText;
                  setError(
                    error
                      ? {
                          ...error,
                          name: error.statusText,
                          message:
                            errorMessage && errorMessage.length > 0
                              ? errorMessage
                              : "An error occurred",
                        }
                      : undefined,
                  );
                  setLoading(false);
                }}
              >
                Send verification one-time password
              </Button>
            </>
          )}
          {otpSentStatus && account && !account.emailVerified && (
            <form
              className="flex flex-col gap-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const { data, error } =
                  await auth.authClient.emailOtp.verifyEmail({
                    email: account.email,
                    otp: otp,
                  });
                setOtpStatus(data?.status ?? false);
                const errorMessage = error?.message ?? error?.statusText;
                setError(
                  error
                    ? {
                        ...error,
                        name: error.statusText,
                        message:
                          errorMessage && errorMessage.length > 0
                            ? errorMessage
                            : "An error occurred",
                      }
                    : undefined,
                );
                setLoading(false);
              }}
            >
              <Input
                label="One-time password"
                value={otp}
                disabled={loading}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button type={"submit"} disabled={loading}>
                Submit
              </Button>
            </form>
          )}
          <DeleteAccountButton
            setLoading={setLoading}
            setError={setError}
            callbackURL={`${window.location.origin}/delete-account`}
          />
        </div>
      </div>
    </>
  );
}
