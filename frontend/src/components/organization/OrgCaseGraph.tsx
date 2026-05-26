import { useParams } from 'react-router-dom'
import Graph from './graph'

function OrgCaseGraph() {
  const { caseId = '' } = useParams<{ caseId: string }>()
  return (
    <Graph
      caseId={caseId}
      previewRoute="/org/evidence/preview"
      backPath={`/OrgCase/${caseId}`}
    />
  )
}

export default OrgCaseGraph
