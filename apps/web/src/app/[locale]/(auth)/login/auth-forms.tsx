"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "../../../../lib/auth-client.ts";
import type { AuthFeatures } from "../../../../lib/auth-types.ts";
import { useRouter } from "../../../../i18n/navigation.ts";
import "./auth-forms.css";

type Props = {
  features: AuthFeatures;
  signedIn: boolean;
  email: string;
};

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

function errorKey(code: string | undefined): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "errorInvalidCredentials";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "errorUserExists";
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_LONG":
      return "errorPasswordLength";
    default:
      return "errorGeneric";
  }
}

export function AuthForms({ features, signedIn, email }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [passEmail, setPassEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [magicEmail, setMagicEmail] = useState(email);

  useEffect(() => {
    if (signedIn) return;
    if (
      typeof PublicKeyCredential === "undefined" ||
      typeof PublicKeyCredential.isConditionalMediationAvailable !== "function"
    ) {
      return;
    }
    void PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
      if (available) void authClient.signIn.passkey({ autoFill: true });
    });
  }, [signedIn]);

  function fail(code: string | undefined): void {
    setOk(null);
    setError(t(errorKey(code)));
  }

  async function afterAuth(): Promise<void> {
    router.push("/");
    router.refresh();
  }

  async function onSignIn(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.email({
      email: passEmail,
      password,
    });
    setBusy(false);
    if (authError) {
      fail(errorCode(authError));
      return;
    }
    await afterAuth();
  }

  async function onSignUp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signUp.email({
      name: name.trim() || passEmail,
      email: passEmail,
      password,
    });
    setBusy(false);
    if (authError) {
      fail(errorCode(authError));
      return;
    }
    await afterAuth();
  }

  async function onPasskeySignIn(): Promise<void> {
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.passkey();
    setBusy(false);
    if (authError) {
      fail(errorCode(authError));
      return;
    }
    await afterAuth();
  }

  async function onPasskeyRegister(): Promise<void> {
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.passkey.addPasskey({ name: "Flyte" });
    setBusy(false);
    if (authError) {
      fail(errorCode(authError));
      return;
    }
    setOk(t("passkeyRegistered"));
  }

  async function onGoogle(): Promise<void> {
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    setBusy(false);
    if (authError) fail(errorCode(authError));
  }

  async function onMagicLink(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.magicLink({
      email: magicEmail,
      callbackURL: "/",
    });
    setBusy(false);
    if (authError) {
      fail(errorCode(authError));
      return;
    }
    setOk(t("magicLinkSent"));
  }

  async function onSignOut(): Promise<void> {
    setBusy(true);
    await authClient.signOut();
    setBusy(false);
    router.refresh();
  }

  if (signedIn) {
    return (
      <div className="auth-forms">
        <p>{t("signedInAs", { email })}</p>
        {error ? <p className="auth-error">{error}</p> : null}
        {ok ? <p className="auth-ok">{ok}</p> : null}
        <div className="auth-form">
          <button type="button" disabled={busy} onClick={() => void onPasskeyRegister()}>
            {t("passkeyRegister")}
          </button>
          <button type="button" disabled={busy} onClick={() => void onSignOut()}>
            {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-forms">
      {error ? <p className="auth-error">{error}</p> : null}
      {ok ? <p className="auth-ok">{ok}</p> : null}

      <form className="auth-form" onSubmit={(event) => void onSignIn(event)}>
        <label>
          {t("emailLabel")}
          <input
            type="email"
            name="email"
            autoComplete="username webauthn"
            required
            value={passEmail}
            onChange={(event) => setPassEmail(event.target.value)}
          />
        </label>
        <label>
          {t("passwordLabel")}
          <input
            type="password"
            name="password"
            autoComplete="current-password webauthn"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {t("signInSubmit")}
        </button>
      </form>

      <form className="auth-form" onSubmit={(event) => void onSignUp(event)}>
        <h2>{t("signUpTitle")}</h2>
        <label>
          {t("nameLabel")}
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {t("signUpSubmit")}
        </button>
      </form>

      <p className="auth-or">{t("orDivider")}</p>

      {features.passkeys ? (
        <div className="auth-form">
          <button type="button" disabled={busy} onClick={() => void onPasskeySignIn()}>
            {t("passkeySignIn")}
          </button>
        </div>
      ) : null}

      {features.google ? (
        <div className="auth-form">
          <button type="button" disabled={busy} onClick={() => void onGoogle()}>
            {t("googleSignIn")}
          </button>
        </div>
      ) : null}

      {features.magicLink ? (
        <form className="auth-form" onSubmit={(event) => void onMagicLink(event)}>
          <h2>{t("magicLinkTitle")}</h2>
          <label>
            {t("emailLabel")}
            <input
              type="email"
              name="magic-email"
              autoComplete="email"
              required
              value={magicEmail}
              onChange={(event) => setMagicEmail(event.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {t("magicLinkSubmit")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
