import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    orgGetAgents,
    orgAssignAgent,
    orgUnassignAgent,
    type OrgAgent,
    type AssignedAgent,
} from '../../helpers/org/Cases';

type Props = {
    orgId: string;
    caseId: string;
    currentlyAssigned: AssignedAgent[];
    onUpdate: () => void;
};

export default function OrgCaseAssignment({ orgId, caseId, currentlyAssigned, onUpdate }: Props) {
    const { user } = useAuth();
    const [allAgents, setAllAgents] = useState<OrgAgent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAgents = async () => {
            try {
                const agents = await orgGetAgents(orgId);
                setAllAgents(agents);
            } catch (err: any) {
                setError("Failed to load organization agents.");
            }
        };
        if (orgId) loadAgents();
    }, [orgId]);

    const handleToggle = async (agent: OrgAgent) => {
        const isAssigned = currentlyAssigned.some(a => a.user_id === agent.user_id);
        setLoading(true);
        setError(null);

        try {
            if (isAssigned) {
                await orgUnassignAgent(caseId, agent.user_id, orgId);
            } else {
                const adminId = (user as any)?.user_id || 0;
                await orgAssignAgent(caseId, agent.user_id, adminId, orgId);
            }
            onUpdate();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <article className="admin-card">
            <div className="orgdash-card-head">
                <h2>Case Access Control</h2>
                <span className="admin-pill info">Admin Tools</span>
            </div>

            {error && (
                <p className="agent-status error" style={{ color: 'red', marginBottom: '1rem' }}>
                    {error}
                </p>
            )}

            <div className="orgdash-table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="orgdash-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAgents.map(agent => {
                            const isAssigned = currentlyAssigned.some(a => a.user_id === agent.user_id);
                            return (
                                <tr key={agent.user_id}>
                                    <td>
                                        <div className="orgdash-case-cell">
                                            <strong>{agent.first_name} {agent.last_name}</strong>
                                            <small style={{ display: 'block' }}>{agent.email}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`admin-pill ${isAssigned ? 'good' : 'neutral'}`}>
                                            {isAssigned ? 'Authorized' : 'No Access'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className={`admin-btn ${isAssigned ? 'admin-btn-ghost' : 'admin-btn-primary'}`}
                                            onClick={() => handleToggle(agent)}
                                            disabled={loading}
                                        >
                                            {loading ? '...' : isAssigned ? 'Revoke' : 'Assign'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </article>
    );
}