
CREATE TABLE public.legal_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT, INSERT, UPDATE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read legal documents"
  ON public.legal_documents FOR SELECT
  USING (true);

CREATE POLICY "Super admins can insert legal documents"
  ON public.legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update legal documents"
  ON public.legal_documents FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.legal_documents (slug, title, content) VALUES
('privacy', 'Privacy Policy', $md$# Privacy Policy

_Last updated: automatically on edit._

ActionsPoint ("we", "us", "our") provides a multi-tenant SaaS platform that helps organizations capture meeting decisions, board resolutions, audit findings and project tasks as trackable action items. This Privacy Policy explains what personal data we collect, how we use it, and the rights you have.

## 1. Who this policy applies to
This policy applies to organization admins, organization members, invited collaborators and visitors to our marketing site. If your organization is the data controller, this policy supplements — and does not replace — your organization's own privacy notice.

## 2. Information we collect
- **Account data:** name, email address, hashed password, organization membership and role.
- **Workspace content:** organizations, action items, projects, stages, meetings, todos, notes, comments, attachments and email preferences you create in the product.
- **Usage data:** pages visited, features used, device/browser metadata, IP address and timestamps, used for security and product analytics.
- **Communications:** email you send us and notifications we send you (assignment alerts, due-date reminders, weekly digest, monthly compliance report).

## 3. How we use your data
- Provide, secure and improve the ActionsPoint service.
- Send transactional emails (invitations, action assignments, due-date reminders, stage handoffs, compliance reports).
- Enforce multi-tenant isolation using row-level security keyed to `organization_id`.
- Comply with legal obligations and enforce our Terms & Conditions.

## 4. Legal bases (GDPR)
We rely on **contract** (to deliver the service you signed up for), **legitimate interests** (product security, abuse prevention, service improvement) and **consent** (optional communications). Where your organization is the controller, we act as **processor** on its documented instructions.

## 5. Sharing your data
We do not sell personal data. We share limited data only with:
- **Sub-processors** that host our infrastructure and send email (e.g. Supabase for database/auth and Resend/SendGrid for email delivery).
- **Members of your organization**, according to their role (admin or member) and the visibility rules configured in the workspace.
- **Authorities**, where required by law.

## 6. International transfers
Data may be processed in regions where our sub-processors operate. We rely on standard contractual clauses or equivalent safeguards for cross-border transfers.

## 7. Retention
We retain workspace content for as long as your organization remains active. When an organization is deleted, associated action items, projects and members are removed within 30 days, except where retention is required by law.

## 8. Security
We apply industry-standard controls: encryption in transit, role-based access, row-level security, secret management for API keys, idle-session timeouts and audit logging on privileged operations. No system is perfectly secure — please report suspected vulnerabilities to us.

## 9. Your rights
Subject to your local law you may request access, correction, deletion, portability, restriction or objection to processing. Organization members should contact their organization admin first; where we are the controller, contact us using the details below.

## 10. Cookies
We use strictly necessary cookies for authentication and session management, and minimal analytics cookies to understand product usage. No third-party advertising cookies are used.

## 11. Children
ActionsPoint is not directed at children under 16 and we do not knowingly collect their data.

## 12. Changes to this policy
We may update this policy as the product evolves. Material changes will be announced in-app or by email. Continued use of the service after the update constitutes acceptance.

## 13. Contact
For privacy questions or to exercise your rights, contact your organization admin or the ActionsPoint team via the support channel provided in your workspace.
$md$),
('terms', 'Terms & Conditions', $md$# Terms & Conditions

_Last updated: automatically on edit._

These Terms & Conditions ("Terms") govern access to and use of the ActionsPoint platform ("Service"). By creating an account, joining an organization or using the Service you agree to these Terms.

## 1. The Service
ActionsPoint is a SaaS platform for capturing, assigning, tracking and reporting on action items, projects and organizational commitments. Features include multi-organization workspaces, role-based access (Super Admin, Org Admin, Org Member), progress tracking, Gantt-style project stages, email notifications and compliance reports.

## 2. Accounts and organizations
- You must provide accurate registration information and keep it up to date.
- The person who creates an organization becomes its **Org Admin** and is responsible for inviting members, assigning roles and configuring settings.
- Each organization is a separate tenant; data is isolated using row-level security.
- You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.

## 3. Acceptable use
You agree not to:
- Upload unlawful, infringing, harmful or misleading content.
- Attempt to bypass authentication, tenant isolation, rate limits or role-based access controls.
- Reverse engineer, scrape, or interfere with the Service or its underlying infrastructure.
- Use the Service to send unsolicited communications outside the intended notification workflows.

## 4. Roles and responsibilities
- **Super Admin** manages platform-wide configuration, subscriptions and legal content.
- **Org Admin** manages members, actions, projects, integrations and email settings for their organization.
- **Org Member** is responsible for updating progress on assigned actions and keeping information accurate.

## 5. Content ownership
Your organization retains ownership of all workspace content it uploads or creates (actions, projects, meetings, notes, attachments). You grant ActionsPoint a limited licence to host, process and display that content solely to operate the Service.

## 6. Subscriptions and billing
Where a paid plan applies, fees, billing cycle and included limits are shown at checkout or in the subscription settings. Unless stated otherwise, fees are non-refundable. We may change pricing with reasonable prior notice for renewals.

## 7. Free and beta features
Some capabilities may be offered as free, preview or beta features. They are provided "as is", may be modified or discontinued and are not covered by any SLA.

## 8. Third-party services
The Service integrates with third-party providers (e.g. Supabase for database/auth, Resend/SendGrid for email). Your use of those services may be subject to their own terms. We are not responsible for third-party outages beyond our reasonable control.

## 9. Confidentiality
Each party will protect the other's confidential information with at least the same care it uses for its own confidential information and will use it only to perform under these Terms. A separate NDA may apply for testers, contributors and reviewers.

## 10. Termination
You may stop using the Service at any time. We may suspend or terminate accounts that breach these Terms, that pose a security risk, or where required by law. On termination we will delete or return workspace content in accordance with our Privacy Policy.

## 11. Disclaimer
The Service is provided **"as is"** and **"as available"**. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement. ActionsPoint is a tool to help track commitments; it does not replace professional legal, compliance or governance advice.

## 12. Limitation of liability
To the maximum extent permitted by law, ActionsPoint's aggregate liability arising out of or relating to the Service will not exceed the fees paid by your organization for the Service in the 12 months preceding the claim. We are not liable for indirect, incidental, consequential, special or punitive damages, or for loss of data, profits or business opportunities.

## 13. Indemnity
You will indemnify ActionsPoint against claims arising from (a) your workspace content, (b) your misuse of the Service, or (c) your breach of these Terms.

## 14. Changes to the Terms
We may update these Terms as the product evolves. Material changes will be announced in-app or by email. Your continued use of the Service after an update constitutes acceptance.

## 15. Governing law and disputes
These Terms are governed by the laws of the jurisdiction in which ActionsPoint is established, without regard to conflict-of-law rules. Disputes will be resolved in the competent courts of that jurisdiction, unless mandatory local law provides otherwise.

## 16. Contact
Questions about these Terms should be directed to your organization admin, or to the ActionsPoint team via the support channel provided in your workspace.
$md$);
