export default function StatCard({ title, value, hint }) {
  return (
    <div style={{ borderRadius: 12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', background: 'white' }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>{hint}</div>
    </div>
  )
}
