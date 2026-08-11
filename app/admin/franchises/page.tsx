import { getFeaturedContent } from "../../actions/admin";
import { requireAdmin } from "../../actions/auth";
import { AdminContentManager } from "../AdminContentManager";
import styles from "../admin.module.css";

export default async function AdminFranchisesPage() {
  await requireAdmin();
  const franchiseItems = await getFeaturedContent('FRANCHISES');

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Franquias</h1>
        <p>Gerencie as franquias em destaque que os usuários podem explorar.</p>
      </div>

      <div className={styles.card}>
        <AdminContentManager section="FRANCHISES" initialData={franchiseItems} isFranchise={true} />
      </div>
    </div>
  );
}
