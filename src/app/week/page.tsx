import { BoardProvider } from "@/components/Board/BoardProvider";
import { WeekView } from "@/components/Week/WeekView";

export default function WeekPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <BoardProvider>
                <WeekView />
            </BoardProvider>
        </main>
    );
}
