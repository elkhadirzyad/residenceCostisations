import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Cotisations() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('cotisations').select('*')
      if (!error) setRows(data || [])
    }
    fetchData()
  }, [])

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Cotisations</h2>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.id} className="p-2 border rounded bg-white">
            <strong>{r.libelle}</strong> — {r.total} MAD
          </li>
        ))}
        {rows.length === 0 && <li className="text-gray-600">Aucune cotisation trouvée.</li>}
      </ul>
    </div>
  )
}
