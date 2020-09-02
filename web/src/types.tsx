export interface Node {
  id: string;
  url: string;
}

export interface Edge {
  fromId: string;
  toId: string;
}

export interface LinkData {
  nodes: Node[];
  edges: Edge[];
}
