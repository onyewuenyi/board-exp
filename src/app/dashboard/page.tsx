
import { BoardProvider } from "@/components/Board/BoardProvider";
import { Board } from "@/components/Board/Board";

export default function Dashboard() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <BoardProvider>
                <Board />
            </BoardProvider>
        </main>
    );
}
