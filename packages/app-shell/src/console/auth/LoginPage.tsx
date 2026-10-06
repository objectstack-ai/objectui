/**
 * Login Page for ObjectStack Console — exported as `DefaultLoginPage`.
 *
 * Offers the "Sign up" link only when the server would accept a sign-up from
 * this visitor: never under `emailPassword.disableSignUp === true`, and under
 * an audience posture closed to strangers (`invite_only`, the default) only
 * for an invitation redirect or a deployment with no owner yet. The decision
 * is `decideSignUpOffer` (`./signUpOffer`), the same one the console's own
 * login page calls (objectui#11691, objectui#11705).
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LoginForm, useAuth, type AuthLinkComponentProps, type AuthPublicConfig } from '@object-ui/auth';
import { useObjectTranslation } from '@object-ui/i18n';
import { AuthPageLayout } from './AuthPageLayout.js';
import { signInRefusalMessages } from './signInRefusalMessages.js';
import { decideSignUpOffer, isInvitationRedirect, needsBootstrapProbe } from './signUpOffer.js';
import { useBootstrapStatus } from './bootstrapStatus.js';

const RouterLink = ({ href, className, children }: AuthLinkComponentProps) => (
  <Link to={href} className={className}>{children}</Link>
);

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const { t } = useObjectTranslation();
  const { user, getAuthConfig } = useAuth();

  // The public auth config, once read — `null` until then (and after a failed
  // read), which `decideSignUpOffer` answers as "offer the link", the
  // behaviour before the config is known.
  const [authConfig, setAuthConfig] = useState<AuthPublicConfig | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAuthConfig()
      .then(cfg => { if (!cancelled) setAuthConfig(cfg ?? null); })
      .catch(() => { /* leave `null` — the server-side gate is the source of truth */ });
    return () => { cancelled = true; };
  }, [getAuthConfig]);

  // objectui#11705 — whether this visitor is offered "Sign up". The bootstrap
  // probe runs only when the posture is closed to strangers and the visitor
  // did not come from an invitation; see `./signUpOffer`.
  const invitationRedirect = isInvitationRedirect(redirect);
  const bootstrap = useBootstrapStatus(!user && needsBootstrapProbe(authConfig, invitationRedirect));
  const signUpOffer = decideSignUpOffer(authConfig, { invitationRedirect, bootstrap });

  // Carry `?redirect=` into the sign-up link: it is how `/register` knows the
  // visitor came from an invitation.
  const registerUrl = redirect
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : '/register';

  return (
    <AuthPageLayout>
      <LoginForm
        onSuccess={() => navigate('/')}
        registerUrl={signUpOffer === 'form' ? registerUrl : undefined}
        forgotPasswordUrl="/forgot-password"
        title={t('auth.login.title')}
        description={t('auth.login.description')}
        linkComponent={RouterLink}
        errorMessages={signInRefusalMessages(t)}
        labels={{
          emailLabel: t('auth.login.emailLabel'),
          emailPlaceholder: t('auth.login.emailPlaceholder'),
          passwordLabel: t('auth.login.passwordLabel'),
          passwordPlaceholder: t('auth.login.passwordPlaceholder'),
          forgotPasswordText: t('auth.login.forgotPasswordText'),
          submitButton: t('auth.login.submitButton'),
          submittingButton: t('auth.login.submittingButton'),
          noAccountText: t('auth.login.noAccountText'),
          signUpText: t('auth.login.signUpText'),
          socialButton: t('auth.login.socialButton'),
          orText: t('auth.login.orText'),
        }}
      />
    </AuthPageLayout>
  );
}
