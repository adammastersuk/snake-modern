export function Toast({ message }: { message: string }) {
  return message ? <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/80 px-4 py-2 text-sm">{message}</div> : null;
}
