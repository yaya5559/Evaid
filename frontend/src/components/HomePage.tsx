import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("section1");

  // Handle locking scroll when the mobile menu is active
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Intersection Observer for highlighting active nav links
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("section.snap-section"));
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible?.target?.id) setActiveId(visible.target.id);
        },
        { root: null, threshold: [0.3, 0.5] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const navLinks = useMemo(
      () => [
        { id: "section1", label: "Home", href: "#section1" },
        { id: "section2", label: "Features", href: "#section2" },
        { id: "section4", label: "Contact", href: "#section4" },
      ],
      []
  );

  return (
      <div className="homePage">


        {/* ── GLOBAL NAVIGATION HEADER ── */}
        <header className="navBar" role="navigation" aria-label="Primary">
          <div className="navInner">
            <a className="brand" href="#section1">
              <span className="brandMark">E</span>VAIDE
            </a>

            <nav className="navLinks">
              {navLinks.map((l) => (
                  <a
                      key={l.id}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className={activeId === l.id ? "isActive" : undefined}
                  >
                    {l.label}
                    {activeId === l.id && <span className="activeDot" />}
                  </a>
              ))}
            </nav>

            <div className="navActions">
              <button
                  className="linkGhost"
                  onClick={() => document.getElementById("section2")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn more
              </button>
              <button className="loginButton" onClick={() => navigate("/Login")}>
                Login
              </button>
              <button
                  className="hamburger"
                  aria-label="Toggle menu"
                  onClick={() => setMenuOpen(!menuOpen)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>

          <div className={`mobileMenu ${menuOpen ? "open" : ""}`}>
            {navLinks.map((l) => (
                <a key={l.id} href={l.href} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
            ))}
            <button className="loginButton full" onClick={() => navigate("/Login")}>
              Login
            </button>
          </div>
        </header>

        {/* ── MAIN SCROLL CONTAINER LAYOUT ── */}
        <main className="scroll-container" id="main">

          {/* WELCOME HERO SECTION */}
          <section id="section1" className="snap-section welcome-hero">
            <div className="hero">

              <div className="badge">AI EVIDENCE ASSISTANT</div>
              <h1 className="welcome-title">
                Investigations, <span className="accent">amplified</span>.
              </h1>
              <p className="welcome-subtitle">
                EVAIDE organizes evidence, surfaces real-time connections, and keeps
                critical details top-of-mind—so you can follow leads, not files.
              </p>
              <div className="welcome-actions">
                <button className="welcome-btn welcome-btn-primary" onClick={() => navigate("/Login")}>
                  Get started
                </button>
                <button
                    className="welcome-btn welcome-btn-secondary"
                    onClick={() => document.getElementById("section2")?.scrollIntoView({ behavior: "smooth" })}
                >
                  See features
                </button>
              </div>

              <div className="stats">
                <div><strong>10×</strong><span>faster link discovery</span></div>
                <div><strong>0</strong><span>manual dedupe</span></div>
                <div><strong>24/7</strong><span>case memory</span></div>
              </div>
            </div>
          </section>

          {/* SYSTEM FEATURES SECTION */}
          <section id="section2" className="snap-section section2">
            <div className="features-card">
              <h1 className="section-title">What is EVAIDE?</h1>
              <h2 className="lede">
                Your AI Agent for investigators: structured evidence database,
                real-time link discovery, and AI-guided insights.
              </h2>

              <div className="featureGrid">
                <article className="feature">
                  <div className="icon">🗂️</div>
                  <h3>Unified Evidence Vault</h3>
                  <p>Ingest videos, images, docs, and transcripts with automatic enrichment.</p>
                </article>
                <article className="feature">
                  <div className="icon">🧠</div>
                  <h3>AI Connections</h3>
                  <p>Surface entities, timelines, and relationships across cases in seconds.</p>
                </article>
                <article className="feature">
                  <div className="icon">🔎</div>
                  <h3>Query in Plain English</h3>
                  <p>Ask questions; get citations to the exact evidence snippets.</p>
                </article>
                <article className="feature">
                  <div className="icon">🔐</div>
                  <h3>Secure by Default</h3>
                  <p>Role-based access, encryption at rest and in transit.</p>
                </article>
                <article className="feature">
                  <div className="icon">🧩</div>
                  <h3>Integrations</h3>
                  <p>Bring your chain-of-custody and RMS with minimal setup.</p>
                </article>
                <article className="feature">
                  <div className="icon">📈</div>
                  <h3>Audit & Reporting</h3>
                  <p>One-click briefs, timelines, and exportable link graphs.</p>
                </article>
              </div>
            </div>
          </section>

          {/* TWO-COLUMN CONTACT GRID SECTION */}
          <section id="section4" className="snap-section section4">
            <div className="contact-container">

              {/* Left Column: Footer Context Information */}
              <footer className="contact-card" role="contentinfo">
                <h1>Contact</h1>
                <h2>EVAIDE</h2>
                <h3>Email: <a href="mailto:evaide@example.com">evaide@example.com</a></h3>
                <h4>Phone: <a href="tel:+10000000000">(000) 000-0000</a></h4>
                <div className="social">
                  <a href="#">X</a>
                  <a href="#">Lin</a>
                  <a href="#">GH</a>
                </div>
                <p className="fine">
                  © {new Date().getFullYear()} EVAIDE. All rights reserved.
                  {" · "}
                  <Link to="/terms" className="footer-terms-link">Terms of Service</Link>
                </p>
              </footer>

              {/* Right Column: Two-Column Verification & Transmission Input Form */}
              <div className="contact-form-wrapper">
                <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Operational request transmitted successfully.'); }}>
                  <h3>Transmit Operational Request</h3>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Identity / Name</label>
                      <input type="text" placeholder="Your name or Unit ID" required />
                    </div>
                    <div className="form-field">
                      <label>Email Address</label>
                      <input type="email" placeholder="name@domain.com" required />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Your Workspace Role</label>
                    <select required defaultValue="">
                      <option value="" disabled>Select your account clearance...</option>
                      <option value="organization">Organization / Business Client</option>
                      <option value="admin">System Administrator</option>
                      <option value="agent">Field Agent / Investigator</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Operation Brief / Message</label>
                    <textarea placeholder="Provide detailed operational request notes or inquiries here..." required rows={5}></textarea>
                  </div>

                  <button type="submit" className="form-submit-btn">
                    Send Message
                  </button>
                </form>
              </div>

            </div>
          </section>
        </main>
      </div>
  );
}

export default HomePage;