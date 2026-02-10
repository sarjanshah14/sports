import { redirect } from "next/navigation"

export default function TournamentIndex({ params }: { params: { id: string } }) {
    redirect(`/tournaments/${params.id}/fixtures`)
}
