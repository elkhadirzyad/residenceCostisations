import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const [stats, setStats] = useState({ solde: 0, recouvrement: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('cotisations').select('total')
      if (!error && data) {
        const total = data.reduce((acc, c) => acc + (c.total || 0), 0)
        setStats({ solde: total, recouvrement: 75 })
      }
    }
    fetchData()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard title="Solde" value={`${stats.solde} MAD`} hint="Recettes - Dépenses" />
      <StatCard title="Recouvrement" value={`${stats.recouvrement}%`} hint="Période courante" />
    </div>
  )
}
