import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getBoard } from "@/lib/domain";
import { BoardClient } from "@/components/board-client";
export default async function LiveBoardPage() { const user = await getCurrentUser(); if (!user) return null; const { board, columns, tasks } = await getBoard(user.id); return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted">Personal workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{board.name}</h1><p className="mt-2 text-muted">Tasks assigned to you appear here.</p></div><div className="flex gap-2"><Link href="/board/settings"><Button className="bg-white !text-ink ring-1 ring-line hover:bg-canvas"><Settings2 size={17} className="mr-2" /> Settings</Button></Link><Link href="/board/new"><Button><Plus size={17} className="mr-2" /> New task</Button></Link></div></div><BoardClient columns={columns.map(({ id, title }) => ({ id, title }))} initialTasks={tasks.map(({ task, assignee }) => ({ id: task.id, title: task.title, priority: task.priority, assignee: assignee.name, columnId: task.columnId }))} /></div>; }
