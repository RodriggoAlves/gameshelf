import { getFeaturedContent } from "../../actions/admin";
import { requireAdmin } from "../../actions/auth";
import { AdminContentManager } from "../AdminContentManager";
import styles from "../admin.module.css";

export default async function AdminSearchPage() {
  await requireAdmin();
  const searchItems = await getFeaturedContent('SEARCH_FEATURED');

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Pesquisa</h1>
        <p>Gerencie os jogos sugeridos em destaque na página de Pesquisa antes de o usuário digitar algo.</p>
      </div>

      <div className={styles.card}>
        <AdminContentManager section="SEARCH_FEATURED" initialData={searchItems} />
      </div>
    </div>
  );
}
