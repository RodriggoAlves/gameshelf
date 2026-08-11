import { getFeaturedContent } from "../../actions/admin";
import { requireAdmin } from "../../actions/auth";
import { AdminContentManager } from "../AdminContentManager";
import styles from "../admin.module.css";

export default async function AdminHomePage() {
  await requireAdmin();
  
  const heroItems = await getFeaturedContent('HOME_HERO');
  const recommendedItems = await getFeaturedContent('HOME_RECOMMENDED');

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Home Page</h1>
        <p>Gerencie os jogos em destaque e recomendados da página inicial.</p>
      </div>

      <div className={styles.card} style={{ marginBottom: '2rem' }}>
        <AdminContentManager section="HOME_HERO" initialData={heroItems} />
      </div>

      <div className={styles.card}>
        <AdminContentManager section="HOME_RECOMMENDED" initialData={recommendedItems} />
      </div>
    </div>
  );
}
