export type OutboundMessage = {
  to: string;
  body: string;
  kind: "text" | "buttons" | "list" | "cta_url";
  buttons?: { id: string; title: string }[];
  listButton?: string;
  rows?: { id: string; title: string; description?: string }[];
  cta?: { title: string; url: string };
  at: number;
};

const store = new Map<string, OutboundMessage[]>();

export function pushOutbound(message: OutboundMessage) {
  const list = store.get(message.to) || [];
  list.push(message);
  store.set(message.to, list.slice(-40));
}

export function consumeOutbound(phone: string): OutboundMessage[] {
  const list = store.get(phone) || [];
  store.set(phone, []);
  return list;
}

export function peekOutbound(phone: string): OutboundMessage[] {
  return store.get(phone) || [];
}
