import { useState } from 'react'

interface Props {
  isOpen: boolean
  onAccept: (disableAutoShow: boolean) => void
  showDisableOption?: boolean
  readOnly?: boolean
}

export function AIWarningModal({ isOpen, onAccept, showDisableOption = false, readOnly = false }: Props) {
  const [disableChecked, setDisableChecked] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    onAccept(disableChecked)
    setDisableChecked(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 18, 36, 0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
    }}>
      <div style={{
        background: '#010b3d',
        borderRadius: '16px',
        padding: '36px 32px 28px',
        minWidth: '360px',
        maxWidth: '720px',
        width: '95vw',
        maxHeight: '90vh',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
        borderTop: '4px solid #f59e0b',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: '30px', marginBottom: '10px', lineHeight: 1 }}>⚠️</div>
        <h2 style={{
          margin: '0 0 4px',
          fontSize: '19px',
          fontWeight: 700,
          color: '#f1f1f1',
          letterSpacing: '-0.01em',
        }}>
          AI Disclaimer, Terms of Use &amp; Limitation of Liability
        </h2>
        <p style={{
          margin: '0 0 14px',
          fontSize: '11px',
          color: '#8a95a8',
          fontWeight: 500,
        }}>
          Evaid — AI-Assisted Investigation Case Management Platform
        </p>
        {!readOnly && (
          <p style={{
            margin: '0 0 14px',
            fontSize: '12px',
            color: '#f59e0b',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            You must accept to continue
          </p>
        )}

        {/* Scrollable content */}
        <div style={{
          fontSize: '13px',
          color: '#cad0df',
          lineHeight: '1.7',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '10px',
          borderTop: '1px solid #1e2d4d',
          paddingTop: '16px',
          marginBottom: '20px',
          minHeight: 0,
        }}>
          {/* Section 1 */}
          <h3 style={sectionHeading}>1. Acceptance of Terms</h3>
          <p style={para}>By accessing, installing, using, or interacting with the Evaid platform ("Platform"), you acknowledge that you have read, understood, and agree to be legally bound by these Terms, Disclaimer, and Limitation of Liability in their entirety. If you do not agree to these terms, you must immediately discontinue all use of the Platform.</p>
          <p style={para}>Use of the Platform constitutes acceptance of the most current version of these Terms.</p>

          {/* Section 2 */}
          <h3 style={sectionHeading}>2. Nature of AI-Generated Content</h3>
          <p style={para}>Evaid incorporates artificial intelligence, machine learning, statistical modeling, and automated analytical technologies to assist with evidence organization, investigative support, document analysis, entity correlation, pattern recognition, and case management functions.</p>
          <p style={para}>All AI-generated outputs — including but not limited to investigative suggestions, evidence analyses, summaries, classifications, correlations, alerts, risk indicators, or predictive assessments — are probabilistic, automated, and exploratory in nature.</p>
          <p style={{ ...para, marginBottom: '6px' }}>AI-generated outputs:</p>
          <ul style={list}>
            <li>Do not constitute legal evidence</li>
            <li>Do not constitute legal advice, forensic advice, investigative advice, or professional consultation</li>
            <li>Do not represent definitive factual findings or legal conclusions</li>
            <li>May contain inaccuracies, omissions, hallucinations, false associations, or incomplete analyses</li>
            <li>May reflect statistical limitations, incomplete datasets, or algorithmic bias</li>
            <li>Must not be interpreted as determinations of guilt, criminal intent, credibility, or liability</li>
          </ul>
          <p style={para}>Users acknowledge that artificial intelligence systems are inherently imperfect and may produce incorrect, misleading, biased, or unreliable outputs.</p>

          {/* Section 3 */}
          <h3 style={sectionHeading}>3. No Warranty of Accuracy</h3>
          <p style={para}>To the fullest extent permitted by law, Evaid makes no representations or warranties, express, implied, statutory, or otherwise, regarding:</p>
          <ul style={list}>
            <li>The accuracy, completeness, reliability, legality, or timeliness of any Platform output</li>
            <li>The admissibility of any output in judicial, administrative, evidentiary, or regulatory proceedings</li>
            <li>The fitness of the Platform for any particular investigative, legal, governmental, or evidentiary purpose</li>
            <li>The validity of any AI-generated inference, recommendation, or analysis</li>
            <li>The availability, functionality, security, or uninterrupted operation of the Platform</li>
          </ul>
          <p style={para}>All Platform services and outputs are provided strictly on an "AS IS" and "AS AVAILABLE" basis, without warranties of merchantability, fitness for a particular purpose, non-infringement, or performance.</p>
          <p style={para}>Users assume all risk associated with reliance on any Platform output.</p>

          {/* Section 4 */}
          <h3 style={sectionHeading}>4. Human Oversight and Professional Judgment Required</h3>
          <p style={para}>Evaid is a decision-support tool only and is not a replacement for qualified human judgment, lawful investigative procedures, or professional review.</p>
          <p style={{ ...para, marginBottom: '6px' }}>All investigative conclusions, legal determinations, arrests, prosecutions, disciplinary actions, or enforcement decisions must:</p>
          <ul style={list}>
            <li>Be independently reviewed and verified by qualified personnel</li>
            <li>Be supported by corroborating evidence obtained through lawful means</li>
            <li>Comply with all applicable constitutional, federal, state, local, and international laws</li>
            <li>Be evaluated using independent human judgment and due process protections</li>
          </ul>
          <p style={{ ...para, marginBottom: '6px' }}>Under no circumstances shall AI-generated outputs serve as the sole or primary basis for:</p>
          <ul style={list}>
            <li>Arrests</li>
            <li>Detentions</li>
            <li>Searches</li>
            <li>Surveillance actions</li>
            <li>Charging decisions</li>
            <li>Prosecutorial actions</li>
            <li>Employment decisions</li>
            <li>Civil penalties</li>
            <li>Judicial determinations</li>
          </ul>
          <p style={para}>Users expressly acknowledge that reliance solely on AI-generated output may produce harmful, unlawful, discriminatory, or unconstitutional outcomes.</p>

          {/* Section 5 */}
          <h3 style={sectionHeading}>5. Bias, Fairness, and Civil Rights Notice</h3>
          <p style={para}>Users acknowledge that AI systems may produce outputs affected by data limitations, statistical correlations, incomplete information, or algorithmic bias.</p>
          <p style={{ ...para, marginBottom: '6px' }}>The Platform must not be used in any manner that:</p>
          <ul style={list}>
            <li>Violates civil rights protections</li>
            <li>Enables unlawful discrimination</li>
            <li>Facilitates racial, ethnic, religious, political, or demographic profiling</li>
            <li>Violates constitutional protections, due process rights, or privacy rights</li>
            <li>Produces unlawful surveillance or investigatory practices</li>
          </ul>
          <p style={para}>Users bear sole responsibility for ensuring that all use of the Platform complies with applicable anti-discrimination laws, constitutional requirements, civil liberties protections, and human rights obligations.</p>

          {/* Section 6 */}
          <h3 style={sectionHeading}>6. No Government Certification or Approval</h3>
          <p style={para}>Unless expressly stated otherwise in writing, Evaid is not certified, endorsed, accredited, validated, or approved by:</p>
          <ul style={list}>
            <li>Any law enforcement agency</li>
            <li>Any judicial authority</li>
            <li>Any governmental entity</li>
            <li>Any forensic certification organization</li>
            <li>Any evidentiary standards authority</li>
          </ul>
          <p style={para}>The Platform is an educational and experimental software project and must not be represented as officially approved investigative software.</p>

          {/* Section 7 */}
          <h3 style={sectionHeading}>7. User Responsibilities</h3>
          <p style={{ ...para, marginBottom: '6px' }}>Users expressly acknowledge and agree that they bear sole responsibility for:</p>
          <ul style={list}>
            <li>All investigative, legal, administrative, or operational decisions made using the Platform</li>
            <li>Independently verifying all Platform outputs</li>
            <li>Ensuring lawful evidence collection, handling, storage, and disclosure</li>
            <li>Maintaining proper chain-of-custody procedures</li>
            <li>Compliance with all applicable privacy, surveillance, constitutional, criminal procedure, evidence handling, and data protection laws</li>
            <li>Obtaining all legally required authorizations, warrants, permissions, or consents</li>
          </ul>
          <p style={{ ...para, marginBottom: '6px' }}>Users further represent and warrant that:</p>
          <ul style={list}>
            <li>They possess all legal rights and authority necessary to upload and process submitted data</li>
            <li>They are authorized to use any uploaded evidence, records, or materials</li>
            <li>Their use of the Platform complies with all applicable laws and professional obligations</li>
          </ul>

          {/* Section 8 */}
          <h3 style={sectionHeading}>8. Data Privacy and Sensitive Information</h3>
          <p style={para}>Users are solely responsible for ensuring that all uploaded data, evidence, records, communications, or personally identifiable information are collected, processed, stored, and shared lawfully.</p>
          <p style={{ ...para, marginBottom: '6px' }}>Evaid makes no representation or warranty that the Platform complies with any specific regulatory framework or certification standard, including but not limited to:</p>
          <ul style={list}>
            <li>CJIS</li>
            <li>HIPAA</li>
            <li>FERPA</li>
            <li>GDPR</li>
            <li>CCPA</li>
            <li>International data localization requirements</li>
          </ul>
          <p style={{ ...para, color: '#f59e0b', fontWeight: 600 }}>This Platform has not been evaluated for compliance with any of the above frameworks. Users must not assume that the Platform satisfies any governmental, evidentiary, or regulatory compliance obligations.</p>
          <p style={para}>Users acknowledge that transmission and storage of digital information inherently carries security risks, including unauthorized access, corruption, interception, alteration, or loss of data.</p>

          {/* Section 9 */}
          <h3 style={sectionHeading}>9. Platform Availability and Security</h3>
          <p style={para}>Evaid does not guarantee uninterrupted availability, security, reliability, or error-free operation of the Platform.</p>
          <p style={{ ...para, marginBottom: '6px' }}>The Platform may experience:</p>
          <ul style={list}>
            <li>Downtime</li>
            <li>Service interruptions</li>
            <li>Software defects</li>
            <li>Cybersecurity incidents</li>
            <li>Unauthorized access</li>
            <li>Data corruption</li>
            <li>Loss of uploaded content</li>
          </ul>
          <p style={para}>Users assume all risks associated with electronic storage, transmission, and processing of information.</p>

          {/* Section 10 */}
          <h3 style={sectionHeading}>10. Acceptable Use Restrictions</h3>
          <p style={{ ...para, marginBottom: '6px' }}>Users agree not to use the Platform to:</p>
          <ul style={list}>
            <li>Violate any law or regulation</li>
            <li>Conduct unlawful surveillance</li>
            <li>Engage in discriminatory profiling or targeting</li>
            <li>Harass, intimidate, or unlawfully monitor individuals</li>
            <li>Upload malicious code, malware, or harmful content</li>
            <li>Reverse engineer, exploit, disrupt, or interfere with Platform operations</li>
            <li>Misrepresent AI-generated outputs as verified facts</li>
            <li>Use the Platform as the sole basis for legal or enforcement action</li>
            <li>Violate constitutional protections, civil rights, or privacy rights</li>
            <li>Conduct unauthorized evidence collection or unlawful investigations</li>
          </ul>
          <p style={para}>Evaid reserves the right to suspend or terminate access for any prohibited or unlawful use.</p>

          {/* Section 11 */}
          <h3 style={sectionHeading}>11. No Professional Relationship</h3>
          <p style={{ ...para, marginBottom: '6px' }}>Use of the Platform does not create any:</p>
          <ul style={list}>
            <li>Attorney-client relationship</li>
            <li>Investigator-client relationship</li>
            <li>Fiduciary relationship</li>
            <li>Agency relationship</li>
            <li>Professional advisory relationship</li>
          </ul>
          <p style={para}>between Evaid, its developers, contributors, affiliates, institutions, or stakeholders and any user.</p>

          {/* Section 12 */}
          <h3 style={sectionHeading}>12. Intellectual Property and Data Ownership</h3>
          <p style={para}>Users retain ownership of materials, evidence, records, and data they upload to the Platform.</p>
          <p style={para}>By submitting content to the Platform, users grant Evaid a limited, non-exclusive license to process, store, transmit, analyze, and display such content solely for operation, maintenance, security, and improvement of the Platform.</p>
          <p style={para}>Users represent and warrant that they possess all necessary rights and permissions for uploaded materials.</p>
          <p style={para}>Evaid makes no claim of ownership over user-submitted content unless otherwise explicitly agreed in writing.</p>

          {/* Section 13 */}
          <h3 style={sectionHeading}>13. Limitation of Liability</h3>
          <p style={{ ...para, marginBottom: '6px' }}>To the fullest extent permitted by applicable law, Evaid and its developers, contributors, affiliates, educational institutions, licensors, stakeholders, and associated parties shall not be liable for:</p>
          <ul style={list}>
            <li>Any wrongful arrest, detention, prosecution, conviction, or investigative action</li>
            <li>Any constitutional, civil rights, privacy, or due process violations</li>
            <li>Any reliance on AI-generated outputs</li>
            <li>Any evidentiary inaccuracies or inadmissibility</li>
            <li>Any discriminatory or biased outcomes</li>
            <li>Any direct, indirect, incidental, consequential, special, exemplary, punitive, or statutory damages</li>
            <li>Any lost profits, lost data, reputational harm, business interruption, or governmental penalties</li>
            <li>Any cybersecurity incident, unauthorized access, or data breach</li>
            <li>Any misuse of the Platform by authorized or unauthorized parties</li>
          </ul>
          <p style={para}>This limitation applies regardless of the legal theory asserted, including negligence, tort, contract, strict liability, or statutory claims.</p>

          {/* Section 14 */}
          <h3 style={sectionHeading}>14. Limitation of Damages</h3>
          <p style={para}>To the fullest extent permitted by law, Evaid's total aggregate liability arising from or relating to use of the Platform shall not exceed one hundred U.S. dollars (USD $100).</p>
          <p style={para}>Certain jurisdictions may not permit some liability limitations; in such cases, liability shall be limited to the maximum extent permitted by law.</p>

          {/* Section 15 */}
          <h3 style={sectionHeading}>15. Indemnification</h3>
          <p style={{ ...para, marginBottom: '6px' }}>Users agree to indemnify, defend, and hold harmless Evaid and its developers, contributors, affiliates, educational institutions, and stakeholders from and against any and all claims, liabilities, damages, losses, judgments, fines, penalties, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:</p>
          <ul style={list}>
            <li>Use or misuse of the Platform</li>
            <li>Reliance on AI-generated outputs</li>
            <li>Violation of these Terms</li>
            <li>Violation of applicable law or regulation</li>
            <li>Violation of constitutional, privacy, or civil rights</li>
            <li>Uploaded content or submitted materials</li>
            <li>Investigative or enforcement actions taken using the Platform</li>
          </ul>

          {/* Section 16 */}
          <h3 style={sectionHeading}>16. Governing Law and Jurisdiction</h3>
          <p style={para}>These Terms and this Disclaimer shall be governed by and construed in accordance with the laws of the State of Washington, without regard to conflict of law principles.</p>
          <p style={para}>Any dispute arising out of or relating to the Platform or these Terms shall be brought exclusively in the state or federal courts located in Washington State, and users consent to the exclusive jurisdiction and venue of such courts.</p>

          {/* Section 17 */}
          <h3 style={sectionHeading}>17. Export Control and Sanctions Compliance</h3>
          <p style={para}>Users agree not to access, use, export, or distribute the Platform in violation of any applicable export control laws, sanctions laws, or trade restrictions.</p>
          <p style={para}>Users represent that they are not prohibited from using the Platform under applicable laws or governmental restrictions.</p>

          {/* Section 18 */}
          <h3 style={sectionHeading}>18. Modifications to Terms</h3>
          <p style={para}>Evaid reserves the right to modify, update, or revise these Terms and this Disclaimer at any time without prior notice.</p>
          <p style={para}>Continued use of the Platform following any modification constitutes acceptance of the revised Terms.</p>

          {/* Section 19 */}
          <h3 style={sectionHeading}>19. Educational and Experimental Nature of Platform</h3>
          <p style={para}>Evaid is an academic capstone project developed for educational, experimental, and research purposes.</p>
          <p style={para}>The Platform is not a commercially certified investigative system and is not intended to replace professional investigative, legal, forensic, or governmental processes.</p>
          <p style={para}>Users acknowledge that the Platform may contain experimental features, incomplete functionality, or unvalidated analytical systems.</p>

          <p style={{ ...para, color: '#8a95a8', fontSize: '11px', marginTop: '24px', borderTop: '1px solid #1e2d4d', paddingTop: '14px' }}>
            Last Updated: May 2026 · Evaid is an academic capstone project developed for educational purposes. It is not a commercially deployed product.
          </p>
        </div>

        {!readOnly && showDisableOption && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontSize: '13px',
            color: '#8a95a8',
            marginBottom: '14px',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
          }}>
            <input
              type="checkbox"
              checked={disableChecked}
              onChange={(e) => setDisableChecked(e.target.checked)}
              style={{ accentColor: '#5b8dee', width: '14px', height: '14px' }}
            />
            Don't show this automatically after every login
          </label>
        )}

        <button
          onClick={handleClose}
          style={{
            background: readOnly ? '#1e2d4d' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            letterSpacing: '0.01em',
            flexShrink: 0,
          }}
        >
          {readOnly ? 'Close' : 'I Understand & Accept'}
        </button>
      </div>
    </div>
  )
}

const sectionHeading: React.CSSProperties = {
  margin: '20px 0 8px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#e2e8f0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const para: React.CSSProperties = {
  margin: '0 0 10px',
}

const list: React.CSSProperties = {
  margin: '0 0 10px',
  paddingLeft: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}
