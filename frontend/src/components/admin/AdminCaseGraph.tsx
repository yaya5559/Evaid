import { useParams } from 'react-router-dom'
import Graph from '../organization/graph'

function AdminCaseGraph() {
  const { caseId = '', orgId = '' } = useParams<{ caseId: string; orgId: string }>()
  return (
    <Graph
      caseId={caseId}
      previewRoute="/admin/evidence/preview"
      backPath={orgId ? `/Cases/${orgId}/${caseId}` : `/Cases/${caseId}`}
    />
  )
}

export default AdminCaseGraph
