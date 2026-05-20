import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import ReportingEmployeeNode from './ReportingEmployeeNode'

function ReportingTreeFlow({
  initialNodes,
  initialEdges,
  onNodeSelect,
  onToggleCollapse,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const nodeTypes = useMemo(
    () => ({
      reportingEmployee: (props) => (
        <ReportingEmployeeNode
          {...props}
          data={{
            ...props.data,
            onSelect: onNodeSelect,
            onToggleCollapse,
          }}
        />
      ),
    }),
    [onNodeSelect, onToggleCollapse],
  )

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_, node) => {
      onNodeSelect?.(node.id)
    },
    [onNodeSelect],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="bg-neutral-50/80"
    >
      <Background gap={20} size={1} color="#e5e7eb" />
      <Controls showInteractive={false} className="!rounded-xl !border-neutral-200 !shadow-md" />
      <MiniMap
        nodeColor={(n) => (n.data?.highlighted ? '#f97316' : '#94a3b8')}
        maskColor="rgba(255,255,255,0.75)"
        className="!rounded-xl !border-neutral-200 !shadow-md"
      />
    </ReactFlow>
  )
}

export default function ReportingTreeCanvas(props) {
  return (
    <ReactFlowProvider>
      <ReportingTreeFlow {...props} />
    </ReactFlowProvider>
  )
}
