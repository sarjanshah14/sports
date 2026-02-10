'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createTournament(formData: FormData) {
    const supabase = createClient()

    const name = formData.get('tournament-name') as string
    const sport = formData.get('sport') as string
    // const startDate = formData.get('start-date') as string
    // const endDate = formData.get('end-date') as string
    // const location = formData.get('location') as string

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('tournaments')
        .insert({
            name,
            created_by: user.id,
            status: 'draft',
            config: { sport }, // Storing sport in config for now as schema didn't have specific column
            // join_code: generateJoinCode() // TODO: Implement join code generation
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    redirect(`/tournaments/${data.id}`)
}
