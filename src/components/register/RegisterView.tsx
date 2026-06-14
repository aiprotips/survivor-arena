"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { cn } from "@/lib/cn";

type RegisterStep = 1 | 2;

type ProgressStep = {
  id: RegisterStep;
  label: string;
  title: string;
};

const progressSteps: ProgressStep[] = [
  {
    id: 1,
    label: "Step 1",
    title: "I tuoi dati",
  },
  {
    id: 2,
    label: "Step 2",
    title: "Sicurezza",
  },
];

export function RegisterView() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Registrati</h1>
        <button
          aria-label="Torna alla pagina precedente"
          className="auth-close-button"
          onClick={handleClose}
          type="button"
        >
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </header>

      <section className="auth-shell" aria-labelledby="register-title">
        <Card className="auth-card register-card">
          <div className="auth-card-heading">
            <p className="auth-kicker">Crea il tuo account</p>
            <h2
              aria-label="Unisciti all'Arena e inizia la sfida"
              className="auth-title register-title"
              id="register-title"
            >
              <span className="register-title-main">Unisciti all&apos;Arena</span>
              <span className="register-title-accent">e inizia la sfida</span>
            </h2>
            <PremiumDivider />
          </div>

          <div className="auth-progress" aria-label="Avanzamento registrazione">
            {progressSteps.map((step) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div
                  className={cn(
                    "auth-progress-step",
                    isActive && "auth-progress-step-active",
                    isComplete && "auth-progress-step-complete",
                  )}
                  key={step.id}
                >
                  <span className="auth-progress-number">{step.id}</span>
                  <span className="auth-progress-copy">
                    <span className="auth-progress-label">{step.label}</span>
                    <span className="auth-progress-title">{step.title}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <form className="auth-form register-form" onSubmit={handleSubmit}>
            {currentStep === 1 ? <RegisterDataStep /> : null}
            {currentStep === 2 ? (
              <RegisterSecurityStep
                isConfirmPasswordVisible={isConfirmPasswordVisible}
                isPasswordVisible={isPasswordVisible}
                onBack={() => setCurrentStep(1)}
                onToggleConfirmPassword={() =>
                  setIsConfirmPasswordVisible((current) => !current)
                }
                onTogglePassword={() => setIsPasswordVisible((current) => !current)}
              />
            ) : null}

            <div className="auth-login-panel">
              <p>Hai gi&agrave; un account?</p>
              <ButtonLink className="auth-inline-link" href="/login" variant="secondary">
                Accedi
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="auth-safe-note">
          <svg aria-hidden="true" className="auth-safe-icon" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-5" />
          </svg>
          <p>I tuoi dati sono al sicuro con noi.</p>
        </div>
      </section>
    </main>
  );
}

function RegisterDataStep() {
  return (
    <div className="auth-step-panel">
      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-username">
          Username
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
            </svg>
          </span>
          <input
            autoComplete="username"
            className="ui-input ui-input-with-icon"
            id="register-username"
            name="username"
            placeholder="Scegli il tuo username"
            type="text"
          />
        </span>
        <p className="ui-field-help">3-20 caratteri, senza spazi</p>
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-email">
          Email
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <rect height="16" rx="2" width="20" x="2" y="4" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>
          <input
            autoComplete="email"
            className="ui-input ui-input-with-icon"
            id="register-email"
            name="email"
            placeholder="Inserisci la tua email"
            type="email"
          />
        </span>
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-phone">
          Numero di telefono
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6.2 6.2l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />
            </svg>
          </span>
          <input
            autoComplete="tel"
            className="ui-input ui-input-with-icon"
            id="register-phone"
            name="phone"
            placeholder="Inserisci il numero"
            type="tel"
          />
        </span>
        <p className="ui-field-help">Ti invieremo un codice di verifica</p>
      </div>

      <Button className="auth-submit-button register-submit-button" type="submit">
        CONTINUA
      </Button>
    </div>
  );
}

type RegisterSecurityStepProps = {
  isConfirmPasswordVisible: boolean;
  isPasswordVisible: boolean;
  onBack: () => void;
  onToggleConfirmPassword: () => void;
  onTogglePassword: () => void;
};

function RegisterSecurityStep({
  isConfirmPasswordVisible,
  isPasswordVisible,
  onBack,
  onToggleConfirmPassword,
  onTogglePassword,
}: RegisterSecurityStepProps) {
  return (
    <div className="auth-step-panel">
      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-password">
          Password
        </label>
        <PasswordInput
          autoComplete="new-password"
          id="register-password"
          isVisible={isPasswordVisible}
          name="password"
          onToggle={onTogglePassword}
          placeholder="Crea una password"
        />
        <p className="ui-field-help">Minimo 8 caratteri con lettere e numeri</p>
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-confirm-password">
          Conferma Password
        </label>
        <PasswordInput
          autoComplete="new-password"
          id="register-confirm-password"
          isVisible={isConfirmPasswordVisible}
          name="confirm-password"
          onToggle={onToggleConfirmPassword}
          placeholder="Ripeti la password"
        />
      </div>

      <Button className="auth-submit-button register-submit-button" type="submit">
        CREA ACCOUNT
      </Button>

      <button
        aria-label="Torna indietro"
        className="auth-back-button"
        onClick={onBack}
        type="button"
      >
        <span aria-hidden="true">&larr;</span>
        Torna indietro
      </button>
    </div>
  );
}

type PasswordInputProps = {
  autoComplete: string;
  id: string;
  isVisible: boolean;
  name: string;
  onToggle: () => void;
  placeholder: string;
};

function PasswordInput({
  autoComplete,
  id,
  isVisible,
  name,
  onToggle,
  placeholder,
}: PasswordInputProps) {
  return (
    <span className="ui-input-wrap">
      <span className="ui-input-leading-icon" aria-hidden="true">
        <svg className="auth-icon" viewBox="0 0 24 24">
          <rect height="11" rx="2" width="16" x="4" y="11" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <input
        autoComplete={autoComplete}
        className="ui-input ui-input-with-icon ui-input-with-action"
        id={id}
        name={name}
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Nascondi password" : "Mostra password"}
        className="ui-input-action"
        onClick={onToggle}
        type="button"
      >
        <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
          {isVisible ? (
            <>
              <path d="m3 3 18 18" />
              <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
              <path d="M9.5 5.5A9.8 9.8 0 0 1 12 5c5 0 8.6 4.2 10 7a14.2 14.2 0 0 1-3.1 4.2" />
              <path d="M6.4 6.8A14.1 14.1 0 0 0 2 12c1.4 2.8 5 7 10 7 1.5 0 2.9-.4 4.1-1" />
            </>
          ) : (
            <>
              <path d="M2 12c1.4-2.8 5-7 10-7s8.6 4.2 10 7c-1.4 2.8-5 7-10 7S3.4 14.8 2 12Z" />
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}
