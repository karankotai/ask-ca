interface Session {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  sessions: Session[];
  activeSessionId: number | null;
  isOpen: boolean;
  onNewChat: () => void;
  onSelectSession: (id: number) => void;
  onDeleteSession: (id: number) => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <div
      className={`${isOpen ? "w-64" : "w-0"} overflow-hidden border-r border-zinc-800 bg-[#171717] transition-all duration-200`}
    >
      <div className="flex h-full w-64 flex-col">
        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-[#2f2f2f]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            New chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-600">
              No chat history yet
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`group mb-0.5 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[#2f2f2f] ${
                  activeSessionId === s.id ? "bg-[#2f2f2f]" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-300">
                    {s.title || "New chat"}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {formatRelativeTime(s.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="ml-2 hidden shrink-0 rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-700 hover:text-zinc-300 group-hover:block"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
