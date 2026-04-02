import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../admin/Nav';
import OrgNav from '../organization/OrgNav';
import '../../styles/Admin/AdminLayout.css';
import '../../styles/Evidence/EvidenceUpload.css';
import { useAuth } from '../../context/AuthContext';
import { uploadEvidence, getCases, type CaseListItem } from '../../helpers/api-communicators';

// maps case status to the existing admin-pill colour classes
const statusTone = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'solved': return 'good';
<<<<<<< HEAD
        case 'open': return 'warn';
=======
        case 'pending': return 'warn';
>>>>>>> origin/main
        case 'discarded': return 'critical';
        default: return 'neutral';
    }
};

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '—';


// case selection table component
interface CaseSelectionTableProps {
    onSelect: (c: CaseListItem) => void;
    orgId?: string;
}

function CaseSelectionTable({ onSelect, orgId }: CaseSelectionTableProps) {
    const [cases, setCases] = useState<CaseListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchCases = async () => {
            if (!cancelled) setLoading(true);
            if (!cancelled) setError(null);

            try {
                const data = await getCases();
                if (!cancelled) setCases(data);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cases');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchCases();
        return () => { cancelled = true; };
    }, [orgId]);

    const filtered = cases.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.description.toLowerCase().includes(q) ||
            String(c.id).toLowerCase().includes(q)
        );
    });

    return (
        <div className="eu-case-selector">
            <div className="eu-selector-header">
                <div>
                    <h2 className="eu-section-title">Select a Case</h2>
                    <p className="eu-section-sub">
                        Choose the case you want to attach evidence to, then upload your file.
                    </p>
                </div>
                <input
                    className="eu-search"
                    placeholder="Search by description or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading && (
                <div className="eu-state-msg">
                    <span className="eu-spinner" />
                    Loading cases…
                </div>
            )}

            {!loading && error && (
                <div className="eu-state-msg eu-state-error">⚠ {error}</div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="eu-state-msg">
                    {search ? 'No cases match your search.' : 'No cases found.'}
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="eu-table-wrap">
                    <table className="eu-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="eu-table-row">
                                    <td className="eu-mono">{c.id}</td>
                                    <td><strong>{c.description}</strong></td>
                                    <td>
                                        <span className={`admin-pill ${statusTone(c.status)}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(c.created_at)}</td>
                                    <td>
                                        <button
                                            className="admin-btn admin-btn-primary eu-select-btn"
                                            onClick={() => onSelect(c)}
                                        >
                                            Select →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


// file upload panel
interface FileUploadPanelProps {
    selectedCase: CaseListItem;
    onBack: () => void;
    onDone: () => void;
}

function FileUploadPanel({ selectedCase, onBack, onDone }: FileUploadPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelection = (selectedFile: File) => {
        setFile(selectedFile);
        setIsComplete(false);
        setUploadProgress(0);
        setErrorMsg(null);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const onUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(20);
        setErrorMsg(null);

        try {
            // can build a proper FormData with the correct multipart boundary.
            await uploadEvidence(selectedCase.id, file);
            setUploadProgress(100);
            setIsComplete(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
            setErrorMsg(message);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetForAnotherUpload = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl(null);
        setIsUploading(false);
        setIsComplete(false);
        setUploadProgress(0);
        setErrorMsg(null);
    };

    return (
        <div className="eu-upload-panel">

            {/* shows which case we're uploading to, with a back button */}
            <div className="eu-case-banner">
                <div className="eu-case-banner-left">
                    <span className="eu-case-banner-label">Uploading evidence to</span>
                    <div className="eu-case-banner-title">
                        <strong>{selectedCase.description}</strong>
                        <span className="eu-mono eu-case-banner-id">#{selectedCase.id}</span>
                        <span className={`admin-pill ${statusTone(selectedCase.status)}`}>
                            {selectedCase.status}
                        </span>
                    </div>
                </div>
                {!isComplete && (
                    <button className="admin-btn admin-btn-ghost eu-back-btn" onClick={onBack}>
                        ← Change Case
                    </button>
                )}
            </div>

            {!isComplete && (
                <div
                    className={`upload-zone ${file ? 'has-file' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) handleFileSelection(e.dataTransfer.files[0]);
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
                        accept="image/*,.pdf,.txt,.csv,.json"
                    />
                    <div className="upload-icon">📁</div>
                    <p>Drag and drop file here</p>
                    <p style={{ color: 'var(--muted)', fontSize: '14px' }}>OR</p>
                    <button className="admin-btn admin-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        Browse Files
                    </button>
                </div>
            )}

            {previewUrl && file?.type.startsWith('image/') && (
                <div className="evidence-preview-container">
                    <h3>File Preview</h3>
                    <div className="image-frame">
                        <img src={previewUrl} alt="Preview" />
                    </div>
                </div>
            )}

            {file && !file.type.startsWith('image/') && (
                <div className="eu-state-msg" style={{ justifyContent: 'flex-start' }}>
                    📄 {file.name} ({(file.size / 1024).toFixed(1)} KB) ready to upload
                </div>
            )}

            {file && !isUploading && !isComplete && (
                <button className="admin-btn admin-btn-primary full-width mt-20" onClick={onUpload}>
                    Upload to Database
                </button>
            )}

            {errorMsg && (
                <div className="eu-state-msg eu-state-error">⚠ {errorMsg}</div>
            )}

            {(isUploading || isComplete) && (
                <div className='upload-progress-section'>
                    <div className='progress-meta'>
                        <span>{isComplete ? 'Upload Complete' : 'Syncing with Server...'}</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className='dashboard-progress-track'>
                        <span
                            className='dashboard-progress-fill'
                            style={{
                                width: `${uploadProgress}%`,
                                backgroundColor: isComplete ? '#4caf50' : 'var(--brand)'
                            }}
                        />
                    </div>
                </div>
            )}

            {isComplete && (
                <div className="eu-done-actions">
                    <button className="admin-btn admin-btn-secondary" onClick={resetForAnotherUpload}>
                        Upload Another File
                    </button>
                    <button className="admin-btn admin-btn-ghost" onClick={onDone}>
                        Back to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}


// root component that manages the overall flow and state of the evidence upload process
const EvidenceUpload: React.FC = () => {
    const { caseId } = useParams<{ caseId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = user?.role === 'evaide_admin';
    const NavComponent = isAdmin ? Nav : OrgNav;

    // org users only see their own cases, admins see everything
    const orgId = !isAdmin && user?.org_id ? String(user.org_id) : undefined;

    // default test case uses (id: number, description, status, created_at) matching the backend
    // to be changed later to load the actual case if caseID param is provided
    const [selectedCase, setSelectedCase] = useState<CaseListItem | null>({
        id: 1,
        description: "Default Testing Case",
<<<<<<< HEAD
        status: "open",
=======
        status: "pending",
>>>>>>> origin/main
        created_at: new Date().toISOString(),
    });

    const handleDone = () => {
        if (user?.role === 'evaide_admin') {
            navigate('/Dashboard');
        } else {
            navigate('/Org_Dashboard');
        }
    };

    return (
        <div className='admin-shell'>
            <aside className='admin-left'>
                <NavComponent />
            </aside>

            <main className='admin-main'>
                <header className='admin-header'>
                    <div>
                        <div className='admin-eyebrow'>Evidence management</div>
                        <h1 className='admin-page-title'>
                            {selectedCase
                                ? `Evidence Upload — Case #${selectedCase.id}`
                                : 'Evidence Upload'}
                        </h1>
                    </div>
                </header>

                <section className='admin-card eu-root-card'>
                    {selectedCase === null ? (
                        <CaseSelectionTable orgId={orgId} onSelect={setSelectedCase} />
                    ) : (
                        <FileUploadPanel
                            selectedCase={selectedCase}
                            onBack={() => setSelectedCase(null)}
                            onDone={handleDone}
                        />
                    )}
                </section>
            </main>
        </div>
    );
};

export default EvidenceUpload;