import { useNavigate } from "react-router-dom";
import "../styles/TermsOfService.css";

const EFFECTIVE_DATE = "May 28, 2026";
const LAST_UPDATED = "May 28, 2026";

function TermsOfService() {
  const navigate = useNavigate();

  return (
    <main className="tos-page">
      <div className="tos-container">
        <button className="tos-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <header className="tos-header">
          <div className="tos-badge">Legal</div>
          <h1 className="tos-title">Terms of Service</h1>
          <p className="tos-meta">
            Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="tos-intro">
          Please read these Terms of Service carefully before using the Evaid
          platform. By accessing or using Evaid, you confirm that you have read,
          understood, and agree to be bound by these terms. If you do not agree,
          do not use the platform.
        </div>

        {/* 1 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 01</p>
          <h2 className="tos-section-title">Acceptance of Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a legally binding
            agreement between you and Evaid ("we," "us," or "our") governing
            your access to and use of the Evaid evidence analysis and case
            management platform, including all related software, services, and
            content (collectively, the "Service").
          </p>
          <p>
            By creating an account, logging in, or otherwise using the Service,
            you represent that (a) you have the authority to bind yourself and,
            where applicable, your organization to these Terms, and (b) you will
            use the Service solely in compliance with all applicable laws and
            regulations.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 2 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 02</p>
          <h2 className="tos-section-title">Description of Service</h2>
          <p>
            Evaid is an AI-assisted evidence analysis and case management
            platform designed for authorized investigative organizations. The
            Service provides:
          </p>
          <ul>
            <li>Secure evidence file upload, storage, and management</li>
            <li>
              Automated signal extraction using AI and optical character
              recognition (OCR), including identification of emails, phone
              numbers, IP addresses, URLs, and custom patterns
            </li>
            <li>
              AI-generated insights, pattern correlation, and relationship graph
              visualization across evidence items
            </li>
            <li>
              Case creation, assignment, and progress tracking across
              multi-user investigative teams
            </li>
            <li>
              Role-based access control for platform administrators,
              organization administrators, and agents
            </li>
            <li>Audit logging of all user activity within the platform</li>
          </ul>
        </section>
        <hr className="tos-divider" />

        {/* 3 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 03</p>
          <h2 className="tos-section-title">Eligibility and Authorized Use</h2>
          <p>
            Access to the Service is restricted to authorized users within
            registered investigative organizations. You may only access Evaid
            if:
          </p>
          <ul>
            <li>
              You have been granted an account by an Evaid platform
              administrator or your organization's administrator
            </li>
            <li>
              Your use is in furtherance of lawful investigative activities
              within your organization's jurisdiction
            </li>
            <li>
              You are at least 18 years of age and legally capable of entering
              into binding agreements
            </li>
          </ul>
          <p>
            Unauthorized access to or use of the Service is strictly prohibited
            and may constitute a violation of applicable computer fraud, privacy,
            and law enforcement laws.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 4 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 04</p>
          <h2 className="tos-section-title">User Accounts and Responsibilities</h2>
          <p>
            Your account credentials are personal and non-transferable. You are
            solely responsible for:
          </p>
          <ul>
            <li>
              Maintaining the confidentiality of your password and access tokens
            </li>
            <li>
              All activities that occur under your account, whether or not
              authorized by you
            </li>
            <li>
              Notifying your organization administrator or the Evaid platform
              administrator immediately upon any suspected unauthorized access
            </li>
          </ul>
          <p>
            Organization administrators are additionally responsible for
            managing user access within their organization, including promptly
            revoking access for individuals who are no longer authorized.
            Platform administrators are responsible for ensuring organizations
            operating on the platform are properly authorized.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 5 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 05</p>
          <h2 className="tos-section-title">Acceptable Use Policy</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>
              Upload, process, or analyze evidence outside of lawful
              investigative purposes or without proper authorization
            </li>
            <li>
              Circumvent, disable, or interfere with any security features or
              access controls
            </li>
            <li>
              Share credentials, export evidence data, or disclose case
              information to unauthorized parties
            </li>
            <li>
              Introduce malicious code, viruses, or any material that disrupts
              or damages the Service
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code
              of the platform
            </li>
            <li>
              Use the Service to harass, intimidate, or unlawfully surveil any
              individual
            </li>
            <li>
              Violate any applicable local, state, national, or international
              law or regulation
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate access for any user or
            organization that violates this policy without prior notice.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 6 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 06</p>
          <h2 className="tos-section-title">Evidence and Case Data</h2>
          <p>
            You retain ownership of all evidence files, case data, and
            investigative content you upload to the Service ("Your Content").
            By uploading Your Content, you grant Evaid a limited, non-exclusive
            license solely to store, process, and transmit Your Content for the
            purpose of providing the Service to you.
          </p>
          <p>
            You are solely responsible for ensuring that:
          </p>
          <ul>
            <li>
              You have the legal authority to upload and process each piece of
              evidence within the platform
            </li>
            <li>
              Evidence handling complies with applicable chain-of-custody
              requirements, evidentiary rules, and data protection laws
            </li>
            <li>
              Sensitive personal data contained within evidence files is handled
              in accordance with applicable privacy regulations
            </li>
          </ul>
          <p>
            Evaid does not access, review, or use Your Content for any purpose
            other than providing the Service, except as required by law or as
            necessary to maintain the security and integrity of the platform.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 7 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 07</p>
          <h2 className="tos-section-title">AI-Generated Content Disclaimer</h2>
          <p>
            Evaid uses artificial intelligence, machine learning models, and
            automated signal extraction to assist investigators. You acknowledge
            and agree that:
          </p>
          <ul>
            <li>
              AI-generated insights, pattern detections, and relationship graphs
              are analytical aids only and do not constitute legal conclusions,
              expert opinions, or admissible evidence
            </li>
            <li>
              AI outputs may contain errors, omissions, false positives, or
              false negatives
            </li>
            <li>
              All AI-generated content must be independently verified by a
              qualified human investigator before being relied upon for any
              investigative, legal, or enforcement decision
            </li>
            <li>
              Evaid is not liable for any action taken or not taken in reliance
              on AI-generated outputs
            </li>
          </ul>
          <div className="tos-warning">
            <p>
              AI analysis is a decision-support tool. Human review and
              professional judgment are required before any operational,
              prosecutorial, or enforcement action.
            </p>
          </div>
        </section>
        <hr className="tos-divider" />

        {/* 8 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 08</p>
          <h2 className="tos-section-title">Data Privacy and Security</h2>
          <p>
            Evaid implements reasonable technical and organizational security
            measures including password hashing, SHA-256 file integrity
            checksums, JWT-based authentication, role-based access controls, and
            comprehensive audit logging.
          </p>
          <p>
            Despite these measures, no system is completely secure. You
            acknowledge that you transmit data to the Service at your own risk.
            In the event of a security incident affecting your data, we will
            notify affected organizations in accordance with applicable legal
            requirements.
          </p>
          <p>
            For information on how we collect, use, and protect personal
            information, please refer to our Privacy Policy, which is
            incorporated into these Terms by reference.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 9 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 09</p>
          <h2 className="tos-section-title">Confidentiality</h2>
          <p>
            Given the sensitive nature of investigative work, all users agree
            to treat case information, evidence data, AI-generated insights, and
            any other non-public information accessed through the Service as
            strictly confidential. You will not disclose such information to any
            person outside your authorized organization without proper legal
            authority or court order.
          </p>
          <p>
            This confidentiality obligation survives the termination or
            expiration of your access to the Service.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 10 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 10</p>
          <h2 className="tos-section-title">Intellectual Property</h2>
          <p>
            The Evaid platform, including its software, design, trademarks,
            logos, and all underlying technology, is the exclusive intellectual
            property of Evaid. These Terms do not transfer any intellectual
            property rights to you.
          </p>
          <p>
            You may not copy, modify, distribute, sell, sublicense, or create
            derivative works from any part of the Service without our prior
            written consent.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 11 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 11</p>
          <h2 className="tos-section-title">Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranty
            of any kind. To the fullest extent permitted by applicable law, Evaid
            expressly disclaims all warranties, express or implied, including
            without limitation implied warranties of merchantability, fitness for
            a particular purpose, accuracy, and non-infringement.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free,
            or free from viruses or other harmful components. We do not warrant
            the accuracy, completeness, or reliability of any AI-generated
            analysis or extracted signals.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 12 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 12</p>
          <h2 className="tos-section-title">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Evaid and its
            officers, employees, agents, and affiliates shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages, including but not limited to loss of data, loss of
            investigative opportunity, reputational harm, or wrongful prosecution
            arising out of or in connection with your use of the Service.
          </p>
          <p>
            In no event shall our total aggregate liability to you exceed the
            amount paid by your organization for access to the Service in the
            twelve (12) months immediately preceding the event giving rise to
            the claim.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 13 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 13</p>
          <h2 className="tos-section-title">Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time,
            with or without cause, including for violation of these Terms,
            non-payment, or cessation of the Service. You may request
            termination of your account by contacting your organization
            administrator or Evaid directly.
          </p>
          <p>
            Upon termination, your right to access the Service ceases
            immediately. Provisions of these Terms that by their nature should
            survive termination shall survive, including confidentiality,
            intellectual property, limitation of liability, and dispute
            resolution.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 14 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 14</p>
          <h2 className="tos-section-title">Governing Law and Disputes</h2>
          <p>
            These Terms are governed by and construed in accordance with
            applicable law. Any dispute arising from or relating to these Terms
            or the Service shall first be subject to good-faith negotiation
            between the parties. If a dispute cannot be resolved through
            negotiation, it shall be submitted to binding arbitration in
            accordance with applicable arbitration rules.
          </p>
          <p>
            Nothing in this section limits either party's right to seek
            injunctive or other equitable relief in a court of competent
            jurisdiction to prevent irreparable harm.
          </p>
        </section>
        <hr className="tos-divider" />

        {/* 15 */}
        <section className="tos-section">
          <p className="tos-section-number">Section 15</p>
          <h2 className="tos-section-title">Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we make material
            changes, we will update the "Last updated" date at the top of this
            page and notify active users through the platform. Your continued
            use of the Service after changes take effect constitutes acceptance
            of the revised Terms.
          </p>
          <p>
            We encourage you to review these Terms periodically to stay informed
            of your rights and obligations.
          </p>
        </section>

        <div className="tos-contact">
          <h3>Questions about these Terms?</h3>
          <p>
            If you have questions, concerns, or requests regarding these Terms
            of Service, please contact the Evaid platform administrator or reach
            out to your organization's designated administrator.
          </p>
        </div>
      </div>
    </main>
  );
}

export default TermsOfService;
