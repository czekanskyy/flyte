"use client";

import { Button, Input, Label } from "@flyte/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "../../../../lib/auth-client.ts";
import type { AuthFeatures } from "../../../../lib/auth-types.ts";
import { normalizeLoginEmail } from "../../../../lib/login-email.ts";
import { useRouter } from "../../../../i18n/navigation.ts";

type Props = {
  features: AuthFeatures;
  signedIn: boolean;
  email: string;
};

type Step = "email" | "password" | "register";

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
  const [step, setStep] = useState<Step>("email");
  const [passEmail, setPassEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (signedIn || step !== "email") return;
    if (
      typeof PublicKeyCredential === "undefined" ||
      typeof PublicKeyCredential.isConditionalMediationAvailable !== "function"
    ) {
      return;
    }
    void PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
      if (available) void authClient.signIn.passkey({ autoFill: true });
    });
  }, [signedIn, step]);

  function fail(code: string | undefined): void {
    setOk(null);
    setError(t(errorKey(code)));
  }

  async function afterAuth(): Promise<void> {
    router.push("/");
    router.refresh();
  }

  function resetToEmail(): void {
    setStep("email");
    setPassword("");
    setName("");
    setError(null);
    setOk(null);
  }

  async function onEmailContinue(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const normalized = normalizeLoginEmail(passEmail);
    if (!normalized) {
      setError(t("errorGeneric"));
      return;
    }
    setPassEmail(normalized);
    setBusy(true);
    setError(null);
    const response = await fetch("/api/login/email-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: normalized }),
    });
    setBusy(false);
    if (!response.ok) {
      setError(t("errorGeneric"));
      return;
    }
    const body: unknown = await response.json();
    const exists = Boolean(body && typeof body === "object" && "exists" in body && body.exists);
    setStep(exists ? "password" : "register");
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

  async function onMagicLink(): Promise<void> {
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.magicLink({
      email: passEmail,
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
        <h1>{t("accountTitle")}</h1>
        <p>{t("signedInAs", { email })}</p>
        {error ? <p className="auth-error">{error}</p> : null}
        {ok ? <p className="auth-ok">{ok}</p> : null}
        <div className="auth-form">
          <Button disabled={busy} onClick={() => void onPasskeyRegister()}>
            {t("passkeyRegister")}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void onSignOut()}>
            {t("signOut")}
          </Button>
        </div>
      </div>
    );
  }

  const title =
    step === "register"
      ? t("signUpTitle")
      : step === "password"
        ? t("welcomeBack")
        : t("signInTitle");

  return (
    <div className="auth-forms">
      <h1>{title}</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      {ok ? <p className="auth-ok">{ok}</p> : null}

      {step === "email" ? (
        <form className="auth-form" onSubmit={(event) => void onEmailContinue(event)}>
          <Label>
            {t("emailLabel")}
            <Input
              type="email"
              name="email"
              autoComplete="username webauthn"
              required
              value={passEmail}
              onChange={(event) => setPassEmail(event.target.value)}
            />
          </Label>
          <Button type="submit" disabled={busy}>
            {t("continue")}
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="auth-form" onSubmit={(event) => void onSignIn(event)}>
          <p className="auth-email-line">
            <span>{passEmail}</span>
            <button type="button" className="auth-text-btn" onClick={resetToEmail}>
              {t("changeEmail")}
            </button>
          </p>
          <Label>
            {t("passwordLabel")}
            <Input
              type="password"
              name="password"
              autoComplete="current-password webauthn"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          <Button type="submit" disabled={busy}>
            {t("signInSubmit")}
          </Button>
        </form>
      ) : null}

      {step === "register" ? (
        <form className="auth-form" onSubmit={(event) => void onSignUp(event)}>
          <p className="auth-email-line">
            <span>{passEmail}</span>
            <button type="button" className="auth-text-btn" onClick={resetToEmail}>
              {t("changeEmail")}
            </button>
          </p>
          <Label>
            {t("nameLabel")}
            <Input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Label>
          <Label>
            {t("passwordLabel")}
            <Input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          <Button type="submit" disabled={busy}>
            {t("signUpSubmit")}
          </Button>
        </form>
      ) : null}

      {step !== "email" ? (
        <div className="auth-alt">
          <p className="auth-or">{t("orDivider")}</p>
          {features.passkeys ? (
            <Button variant="ghost" disabled={busy} onClick={() => void onPasskeySignIn()}>
              {t("passkeySignIn")}
            </Button>
          ) : null}
          {features.google ? (
            <Button variant="ghost" disabled={busy} onClick={() => void onGoogle()}>
              {t("googleSignIn")}
            </Button>
          ) : null}
          {features.magicLink ? (
            <Button
              variant="ghost"
              disabled={busy || !passEmail}
              onClick={() => void onMagicLink()}
            >
              {t("magicLinkSubmit")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
