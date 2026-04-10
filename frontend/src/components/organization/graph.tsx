import React, { useEffect, useState } from 'react'
import { api } from '../../context/AuthContext'

type edge = {
    id: string,
    from: string,
    to:string,
    source: "AI" | "USER"
    confidence : Number
}

type Node= {
    id: string,
    type:string,
    label:string,
    source:"AI" | "USER"
}

type GraphResponse = {
    id: string
    node: Node[]
    edge:edge[]
}


function graph() {

    const [data, setData] = useState<GraphResponse | null>(null)
    const [selectedEdge, setSelectedEdge] = useState<edge| null>(null)
    const [caseId, setCaseId] = useState<string | null>(null)

    useEffect(()=>{
        api.get(`/graph/cases/${caseId}`).then((res) => setData(res.data))
    })

  return (
    <div>
      
    </div>
  )
}

export default graph
