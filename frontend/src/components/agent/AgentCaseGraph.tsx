import { useParams } from 'react-router-dom'
import Graph from '../organization/graph'

function AgentCaseGraph() {
  const { caseId = '' } = useParams<{ caseId: string }>()
  return (
    <Graph
      caseId={caseId}
      previewRoute="/agent/evidence/preview"
      backPath={`/AgentCase/${caseId}`}
    />
  )
}

export default AgentCaseGraph
