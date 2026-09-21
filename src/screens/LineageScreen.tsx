import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodesState,
  useEdgesState,
  SelectionMode,
  type Edge,
  type Node,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSelectedAssets, useStudio } from "../store";
import { assetImageSrc, lineageTrack, numericDrift, summarizePromptDiff } from "../lib/studio";
import { TaxonomyTag } from "../components/TaxonomyTag";
import type { AssetRecord } from "../shared/types";

type AssetNodeData = {
  asset: AssetRecord;
};

type DiffEdgeData = {
  added: string[];
  removed: string[];
  params: string[];
};

function AssetNode({ data, selected }: NodeProps<Node<AssetNodeData>>) {
  const focused = useStudio((s) => s.inspectorId === data.asset.id);
  return (
    <div className="relative cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-cyan !bg-cyan nodrag" />
      <div className={`w-[168px] overflow-hidden rounded-[10px] bg-[#2c2c2e] ${
        selected ? "ring-2 ring-blue" : focused ? "ring-2 ring-white/40" : "ring-1 ring-white/10"
      }`}>
        <img src={assetImageSrc(data.asset)} alt="" className="aspect-square w-full object-cover object-top" draggable={false} />
        <div className="space-y-1 p-2">
          <TaxonomyTag role={data.asset.role} compact />
          <p className="truncate text-[11px] font-medium">{data.asset.filename.replace(/\.[^.]+$/, "").replaceAll("_", " ")}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-cyan !bg-cyan nodrag" />
    </div>
  );
}

function DiffEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<Edge<DiffEdgeData>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const added = data?.added ?? [];
  const removed = data?.removed ?? [];
  const params = data?.params ?? [];

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} interactionWidth={36} style={{ ...style, strokeWidth: 1.8 }} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="nodrag nopan pointer-events-none absolute"
        >
          <span className="rounded-full bg-[#1c1c1e]/80 px-2 py-0.5 text-[10px] text-secondary ring-1 ring-white/8">
            {added.length || removed.length ? "Prompt" : params[0] ?? "Link"}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function ChangeTooltip({ data }: { data: DiffEdgeData }) {
  const added = data.added ?? [];
  const removed = data.removed ?? [];
  const params = data.params ?? [];
  const empty = added.length === 0 && removed.length === 0 && params.length === 0;

  return (
    <div className="w-[280px] rounded-[10px] bg-[#2c2c2e] p-2.5 text-left shadow-[0_12px_40px_rgb(0_0_0_/_0.45)] ring-1 ring-white/12">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-tertiary">What changed</p>
      {empty ? (
        <p className="text-[12px] text-secondary">Linked with no prompt or parameter drift.</p>
      ) : (
        <div className="space-y-2">
          {removed.length > 0 ? (
            <p className="text-[12px] leading-4">
              <span className="text-secondary">Removed </span>
              {removed.map((token) => (
                <span key={`r-${token}`} className="mr-1 inline-flex rounded-full bg-red/20 px-1.5 py-0.5 text-[10px] font-medium text-red">
                  {token}
                </span>
              ))}
            </p>
          ) : null}
          {added.length > 0 ? (
            <p className="text-[12px] leading-4">
              <span className="text-secondary">Added </span>
              {added.map((token) => (
                <span key={`a-${token}`} className="mr-1 inline-flex rounded-full bg-green/20 px-1.5 py-0.5 text-[10px] font-medium text-green">
                  {token}
                </span>
              ))}
            </p>
          ) : null}
          {params.length > 0 ? (
            <p className="text-[11px] text-cyan">{params.join(" · ")}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { asset: AssetNode };
const edgeTypes = { diff: DiffEdge };

export function LineageScreen() {
  const selected = useSelectedAssets();
  const setInspector = useStudio((s) => s.setInspector);
  const graph = useMemo(() => buildGraph(selected), [selected]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: DiffEdgeData } | null>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    setNodes((current) =>
      graph.nodes.map((node) => {
        const previous = current.find((item) => item.id === node.id);
        return previous
          ? { ...node, position: previous.position, selected: previous.selected }
          : node;
      }),
    );
    setEdges(graph.edges);
  }, [graph, setEdges, setNodes]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (useStudio.getState().tutorialOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable=true]")) return;
      const selectedIds = nodesRef.current.filter((node) => node.selected).map((node) => node.id);
      const focused = useStudio.getState().inspectorId;
      const ids =
        selectedIds.length > 0
          ? selectedIds
          : focused && nodesRef.current.some((node) => node.id === focused)
            ? [focused]
            : [];
      if (ids.length === 0) return;
      event.preventDefault();
      useStudio.getState().unstageAssets(ids);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-semibold tracking-tight">Lineage Matrix</h1>
        <p className="mt-1 text-[12px] text-secondary">
          Ancestry sits at the root. Branches and variants connect from there. Hover an arrow to see what changed.
        </p>
      </div>
      <div
        className="relative mx-5 mb-5 min-h-0 flex-1 overflow-hidden rounded-[12px] ring-1 ring-white/8"
        data-tutorial="lineage"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          minZoom={0.35}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_event, node) => setInspector(String(node.id))}
          onNodeDragStart={(_event, node) => setInspector(String(node.id))}
          onSelectionChange={({ nodes: picked }) => {
            const last = picked.at(-1);
            if (last) setInspector(String(last.id));
          }}
          onEdgeMouseEnter={(event, edge) => {
            setTooltip({ x: event.clientX, y: event.clientY, data: (edge.data as DiffEdgeData) ?? { added: [], removed: [], params: [] } });
          }}
          onEdgeMouseMove={(event, edge) => {
            setTooltip({ x: event.clientX, y: event.clientY, data: (edge.data as DiffEdgeData) ?? { added: [], removed: [], params: [] } });
          }}
          onEdgeMouseLeave={() => setTooltip(null)}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          panOnDrag={[1, 2]}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          selectionKeyCode={null}
          multiSelectionKeyCode="Shift"
          selectNodesOnDrag
          deleteKeyCode={null}
          nodeDragThreshold={1}
          onlyRenderVisibleElements={false}
          defaultEdgeOptions={{ interactionWidth: 36 }}
        >
          <Background
            id="dots"
            variant={BackgroundVariant.Dots}
            gap={18}
            size={2}
            color="rgba(255,255,255,0.16)"
            bgColor="#0c0c0e"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        {tooltip
          ? createPortal(
              <div
                className="pointer-events-none fixed z-[90]"
                style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
              >
                <ChangeTooltip data={tooltip.data} />
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}

function buildGraph(assets: AssetRecord[]) {
  const nodes: Node<AssetNodeData>[] = layoutFamilyNodes(assets);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const edges: Edge<DiffEdgeData>[] = assets.flatMap((asset) => {
    if (!asset.parentId || !byId.has(asset.parentId)) return [];
    const parent = byId.get(asset.parentId);
    if (!parent) return [];
    const prompt = summarizePromptDiff(parent.prompt, asset.prompt);
    const params = numericDrift(parent, asset)
      .filter((item) => item.changed)
      .map((item) => `${item.label} ${item.a ?? "—"} → ${item.b ?? "—"}`);
    return [{
      id: `${asset.parentId}-${asset.id}`,
      source: asset.parentId,
      target: asset.id,
      type: "diff",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64d2ff" },
      style: { stroke: "#64d2ff" },
      data: {
        added: prompt.added,
        removed: prompt.removed,
        params,
      },
    }];
  });
  return { nodes, edges };
}

function layoutFamilyNodes(assets: AssetRecord[]) {
  const families = new Map<string, AssetRecord[]>();
  for (const asset of assets) {
    const list = families.get(asset.familyId) ?? [];
    list.push(asset);
    families.set(asset.familyId, list);
  }

  const nodes: Node<AssetNodeData>[] = [];
  let yCursor = 36;
  for (const members of families.values()) {
    const foundation = members.filter((asset) => lineageTrack(asset) === "foundation");
    const refinement = members.filter((asset) => lineageTrack(asset) === "refinement");
    const ancestry = foundation.filter((asset) => asset.role === "ancestry");
    const branches = foundation.filter((asset) => asset.role !== "ancestry");
    const familyTop = yCursor;

    ancestry.forEach((asset, index) => {
      nodes.push(toNode(asset, { x: 32, y: familyTop + index * 210 }));
    });
    branches.forEach((asset, index) => {
      const col = Math.floor(index / 3);
      const row = index % 3;
      nodes.push(toNode(asset, { x: 280 + col * 220, y: familyTop + row * 210 }));
    });

    const foundationHeight = Math.max(ancestry.length * 210, Math.ceil(Math.max(branches.length, 1) / 3) * 210, 210);
    const refineY = familyTop + foundationHeight + 28;
    refinement.forEach((asset, index) => {
      nodes.push(toNode(asset, { x: 32 + index * 220, y: refineY }));
    });
    yCursor = refineY + (refinement.length > 0 ? 230 : 0) + 72;
  }
  return nodes;
}

function toNode(asset: AssetRecord, position: { x: number; y: number }): Node<AssetNodeData> {
  return {
    id: asset.id,
    type: "asset",
    position,
    data: { asset },
    draggable: true,
    connectable: false,
  };
}
