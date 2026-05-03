import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("section1");

  // Lock scroll when mobile menu is open (why: prevent background scroll bleed)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Observe sections to highlight active nav
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("section.snap-section"));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { root: null, threshold: [0.5, 0.75, 0.9] }
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

  const onNavClick = () => setMenuOpen(false);

  return (
    <div className="homePage">
      {/* HEADER / NAV */}
      <header className="navBar" role="navigation" aria-label="Primary" data-cy="nav">
        <div className="navInner">
          <a className="brand" href="#section1" aria-label="EVAIDE home" data-cy="brand-home">
            <span className="brandMark">E</span>VAIDE
          </a>

          <nav className="navLinks">
            {navLinks.map((l) => (
              <a
                key={l.id}
                href={l.href}
                onClick={onNavClick}
                aria-current={activeId === l.id ? "page" : undefined}
                className={activeId === l.id ? "isActive" : undefined}
                data-cy={`nav-${l.label.toLowerCase()}`}
              >
                {l.label}
                {activeId === l.id && <span className="activeDot" aria-hidden />}
              </a>
            ))}
          </nav>

          <div className="navActions">
            <button
              className="linkGhost"
              onClick={() => {
                document.querySelector("#section2")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-cy="nav-learn-more"
            >
              Learn More
            </button>
            <button
              className="loginButton"
              onClick={() => navigate("/Login")}
              aria-label="Log in to EVAIDE"
              data-cy="nav-login"
            >
              Login
            </button>

            <button
              className="hamburger"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
              data-cy="nav-hamburger"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div className={`mobileMenu ${menuOpen ? "open" : ""}`} data-cy="mobile-menu">
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={l.href}
              onClick={onNavClick}
              aria-current={activeId === l.id ? "page" : undefined}
              className={activeId === l.id ? "isActive" : undefined}
              data-cy={`mobile-${l.label.toLowerCase()}`}
            >
              {l.label}
            </a>
          ))}
          <button
            className="loginButton full"
            onClick={() => navigate("/Login")}
            data-cy="mobile-login"
          >
            Login
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="scroll-snap-container" id="main">
        {/* HERO */}
        <section
          id="section1"
          className="snap-section section1"
          aria-label="Hero"
          data-cy="section-home"
        >
          <div className="hero">
            <div className="badge" data-cy="home-badge">
              AI Evidence Assistant
            </div>
            <h1 className="headline">
              Investigations, <span className="accent">amplified</span>.
            </h1>
            <p className="subhead">
              EVAIDE organizes evidence, surfaces real-time connections, and keeps
              critical details top-of-mind so you can follow leads, not files.
            </p>
            <div className="ctaRow">
              <button
                className="loginButton cta"
                onClick={() => navigate("/Login")}
                data-cy="cta-get-started"
              >
                Get started
              </button>
              <a className="secondaryCta" href="#section2" data-cy="cta-see-features">
                See features
              </a>
            </div>

            <div className="stats" data-cy="home-stats">
              <div data-cy="stat-faster-link-discovery">
                <strong>10x</strong>
                <span>faster link discovery</span>
              </div>
              <div data-cy="stat-manual-dedupe">
                <strong>0</strong>
                <span>manual dedupe</span>
              </div>
              <div data-cy="stat-case-memory">
                <strong>24/7</strong>
                <span>case memory</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="section2"
          className="snap-section section2"
          aria-label="Features"
          data-cy="section-features"
        >
          <div className="features card" data-cy="features-card">
            <h1>What is Evaide?</h1>
            <h2 className="lede">
              Your AI agent for investigators: structured evidence database,
              real-time link discovery, and AI-guided insights.
            </h2>

            <div className="featureGrid">
              <article className="feature" data-cy="feature-unified-evidence-vault">
                <div className="icon" aria-hidden>DB</div>
                <h3>Unified Evidence Vault</h3>
                <p>Ingest videos, images, docs, and transcripts with automatic enrichment.</p>
              </article>
              <article className="feature" data-cy="feature-ai-connections">
                <div className="icon" aria-hidden>AI</div>
                <h3>AI Connections</h3>
                <p>Surface entities, timelines, and relationships across cases in seconds.</p>
              </article>
              <article className="feature" data-cy="feature-query-plain-english">
                <div className="icon" aria-hidden>QRY</div>
                <h3>Query in Plain English</h3>
                <p>Ask questions; get citations to the exact evidence snippets.</p>
              </article>
              <article className="feature" data-cy="feature-secure-by-default">
                <div className="icon" aria-hidden>SEC</div>
                <h3>Secure by Default</h3>
                <p>Role-based access, encryption at rest and in transit.</p>
              </article>
              <article className="feature" data-cy="feature-integrations">
                <div className="icon" aria-hidden>INT</div>
                <h3>Integrations</h3>
                <p>Bring your chain-of-custody and RMS with minimal setup.</p>
              </article>
              <article className="feature" data-cy="feature-audit-reporting">
                <div className="icon" aria-hidden>RPT</div>
                <h3>Audit & Reporting</h3>
                <p>One-click briefs, timelines, and exportable link graphs.</p>
              </article>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section
          id="section4"
          className="snap-section section4"
          aria-label="Contact"
          data-cy="section-contact"
        >
          <footer className="contact card" role="contentinfo" data-cy="contact-card">
            <h1>Contact</h1>
            <h2>Evaide</h2>
            <h3>Email: <a href="mailto:evaide@example.com">evaide@example.com</a></h3>
            <h4>Phone: <a href="tel:+10000000000">(000) 000-0000</a></h4>
            <div className="social">
              <a href="#" aria-label="Twitter">X</a>
              <a href="#" aria-label="LinkedIn">Lin</a>
              <a href="#" aria-label="GitHub">GH</a>
            </div>
            <p className="fine">(c) 2026 EVAIDE. All rights reserved.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
