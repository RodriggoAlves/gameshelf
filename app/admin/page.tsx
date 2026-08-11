import { requireAdmin } from "../actions/auth";
import db from "../../lib/db";
import styles from "./admin.module.css";
import * as LucideIcons from "lucide-react";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  // Basic stats
  const usersCount = await db.get('SELECT COUNT(*) as count FROM "User"');
  const logsCount = await db.get('SELECT COUNT(*) as count FROM "AdminAuditLog"');
  const homeCount = await db.get('SELECT COUNT(*) as count FROM "FeaturedContent" WHERE section = $1', ['HOME_HERO']);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <p>Bem-vindo ao painel administrativo do Zerey, {admin?.username}.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3><LucideIcons.Users size={16} /> Total de Usuários</h3>
          <p>{usersCount?.count || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><LucideIcons.History size={16} /> Ações Administrativas</h3>
          <p>{logsCount?.count || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><LucideIcons.Gamepad2 size={16} /> Jogos Destaque Home</h3>
          <p>{homeCount?.count || 0}</p>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Acesso Rápido</h3>
        <p style={{ color: '#888', marginTop: '1rem', marginBottom: '2rem' }}>
          Utilize o menu lateral para configurar quais jogos e franquias aparecem nas páginas principais da plataforma.
        </p>
        <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
          Qualquer alteração de conteúdo ou ordem refletirá quase instantaneamente no site.
        </p>
      </div>
    </div>
  );
}
