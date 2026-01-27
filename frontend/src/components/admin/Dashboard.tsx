import React from 'react'
import '../../styles/Admin/Dashboard.css'

function Dashboard() {

  return (
    <div className='root'>
      <aside className='left'>
        <div className='brand'>
          <div className='brand-mark'></div>
          <div>
            <div className='brand-title'>Evaid</div>
            <div className='brand-sub'>Admin console</div>
          </div>
        </div>

        <nav className='nav'>
          <div className='nav-section'>
            <div className='nav-label'>Core</div>
            <a className='nav-item active' href='#'>
              <span className='nav-dot'></span>
              Overview
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Analytics
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Organization Summary
            </a>
          </div>

          <div className='nav-section'>
            <div className='nav-label'>Operations</div>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Add Organization
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Delete Organization
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Edit Organization
            </a>
          </div>
        </nav>

        <div className='left-footer'>
          <div className='user'>
            <div className='avatar'>IN</div>
            <div>
              <div className='user-name'>Investigator</div>
              <div className='user-role'>Super admin</div>
            </div>
          </div>
        </div>
      </aside>

      <main className='center'>
        <header className='center-header'>
          <div className='title-block'>
            <div className='eyebrow'>Admin overview</div>
            <h1>Operations dashboard</h1>
            <p className='subtext'>Live metrics, usage, and system health in one place.</p>
          </div>
          <div className='actions'>
            <button className='btn ghost' type='button'>Export</button>
          </div>
        </header>

        <section className='stats'>
          <article className='card stat'>
            <div className='stat-label'>Active users</div>
            <div className='stat-value'>-</div>
            <div className='stat-delta up'>frim Backend</div>
          </article>
          <article className='card stat'>
            <div className='stat-label'>Revenue</div>
            <div className='stat-value'>-</div>
            <div className='stat-delta up'>frim Backend</div>
          </article>
          <article className='card stat'>
            <div className='stat-label'>Tickets resolved</div>
            <div className='stat-value'>0</div>
            <div className='stat-delta up'>frim Backend</div>
          </article>
          <article className='card stat'>
            <div className='stat-label'>Churn</div>
            <div className='stat-value'>-</div>
            <div className='stat-delta down'>frim Backend</div>
          </article>
        </section>

        <section className='insights'>
          <article className='card'>
            <div className='card-header'>
              <h3>Revenue performance</h3>
              <span className='tag'>This month</span>
            </div>
            <div className='metric'>
              <div className='metric-value'>-</div>
              <div className='metric-sub'>-</div>
            </div>
            <div className='mini-stats'>
              <div className='mini'>
                <span className='mini-label'>MRR</span>
                <span className='mini-value'>-</span>
              </div>
              <div className='mini'>
                <span className='mini-label'>ARPU</span>
                <span className='mini-value'>-</span>
              </div>
              <div className='mini'>
                <span className='mini-label'>Expansion</span>
                <span className='mini-value'>-</span>
              </div>
            </div>
          </article>

          <article className='card'>
            <div className='card-header'>
              <h3>Recent activity</h3>
              <span className='tag live'>Live</span>
            </div>
            <ul className='activity'>
              <li>
                <div className='activity-title'>from backend</div>
                <div className='activity-meta'>frim Backend</div>
              </li>
              <li>
                <div className='activity-title'>frim Backend</div>
                <div className='activity-meta'>frim Backend</div>
              </li>
              <li>
                <div className='activity-title'>frim Backend</div>
                <div className='activity-meta'>frim Backend</div>
              </li>
              <li>
                <div className='activity-title'>frim Backend</div>
                <div className='activity-meta'>frim Backend</div>
              </li>
            </ul>
          </article>
        </section>

        <section className='wide-card'>
          <article className='card'>
            <div className='card-header'>
              <h3>Deployment status</h3>
              <span className='tag'>Last 24 hours</span>
            </div>
            <div className='status-grid'>
              <div className='status-item'>
                <span className='status-label'>API response</span>
                <span className='status-value'>142 ms</span>
                <span className='status-note'>p95 latency</span>
              </div>
              <div className='status-item'>
                <span className='status-label'>Uptime</span>
                <span className='status-value'>99.98%</span>
                <span className='status-note'>30-day avg</span>
              </div>
              <div className='status-item'>
                <span className='status-label'>Deploys</span>
                <span className='status-value'>6</span>
                <span className='status-note'>Zero rollbacks</span>
              </div>
              <div className='status-item'>
                <span className='status-label'>Errors</span>
                <span className='status-value'>0.12%</span>
                <span className='status-note'>Below target</span>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
