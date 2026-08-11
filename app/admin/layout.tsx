import { requireAdmin } from "../actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/");
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.backHome}>← Voltar pro Site</Link>
          <h2>Admin Panel</h2>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin"><LucideIcons.LayoutDashboard size={18} /> Dashboard</Link>
          <Link href="/admin/home"><LucideIcons.Home size={18} /> Home Page</Link>
          <Link href="/admin/search"><LucideIcons.Search size={18} /> Pesquisa</Link>
          <Link href="/admin/franchises"><LucideIcons.Gamepad2 size={18} /> Franquias</Link>
          <Link href="/admin/audit"><LucideIcons.History size={18} /> Auditoria</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.adminName}>👨‍💻 {admin.username}</span>
        </div>
      </aside>
      <main className={styles.adminMain}>
        {children}
      </main>
    </div>
  );
}
