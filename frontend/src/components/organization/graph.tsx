import { useEffect, useState } from 'react'
import { api } from '../../context/AuthContext'

type edge = {
    id: string,
    from: string,
    to: string,
    source: "AI" | "USER"
    confidence: Number
}

type Node = {
    id: string,
    type: string,
    label: string,
    source: "AI" | "USER"
}

type GraphResponse = {
    id: string
    node: Node[]
    edge: edge[]
}

type GraphProps = {
    caseId: string
}

function Graph({ caseId }: GraphProps) {
    const [_data, setData] = useState<GraphResponse | null>(null)

    useEffect(() => {
        api.get(`/graph/cases/${caseId}`).then((res) => setData(res.data))
    }, [caseId])

    return (
        <div>
        </div>
    )
}

export default Graph
