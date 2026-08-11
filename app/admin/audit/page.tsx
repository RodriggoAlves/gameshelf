import { getAuditLogs } from "../../actions/admin";
import { requireAdmin } from "../../actions/auth";
import styles from "../admin.module.css";

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await getAuditLogs();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Auditoria de Ações</h1>
        <p>Histórico de alterações realizadas no painel administrativo.</p>
      </div>

      <div className={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '1rem', color: '#888' }}>Data/Hora</th>
                <th style={{ padding: '1rem', color: '#888' }}>Admin</th>
                <th style={{ padding: '1rem', color: '#888' }}>Ação</th>
                <th style={{ padding: '1rem', color: '#888' }}>Seção</th>
                <th style={{ padding: '1rem', color: '#888' }}>Item IGDB</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{log.adminName}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: log.action.includes('DELETE') ? '#3a1c1c' : log.action.includes('UPDATE') ? '#1c3a3a' : '#1c3a1c',
                        color: log.action.includes('DELETE') ? '#e74c3c' : log.action.includes('UPDATE') ? '#3498db' : '#2ecc71',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{log.entityType}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#aaa' }}>{log.entityId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
