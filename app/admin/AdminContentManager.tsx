"use client";

import { useState } from "react";
import styles from "./admin.module.css";
import * as LucideIcons from "lucide-react";
import { searchIGDBForAdmin, upsertFeaturedContent, deleteFeaturedContent, seedDefaultContent } from "../actions/admin";

type ContentItem = {
  id: number;
  section: string;
  entityId: string;
  entityName: string;
  entityImage: string;
  orderIndex: number;
  isActive: number;
};

export function AdminContentManager({ section, initialData, isFranchise = false }: { section: string, initialData: ContentItem[], isFranchise?: boolean }) {
  const [items, setItems] = useState<ContentItem[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState<number | string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchIGDBForAdmin(searchQuery, isFranchise ? 'franchise' : 'game');
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar IGDB");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (result: any) => {
    setLoadingAction(result.id);
    try {
      const orderIndex = items.length > 0 ? Math.max(...items.map(i => i.orderIndex)) + 1 : 1;
      const res = await upsertFeaturedContent({
        section,
        entityId: result.id,
        entityName: result.name,
        entityImage: result.image,
        orderIndex,
        isActive: 1
      });
      if (res.success) {
        setItems([...items, {
          id: res.id!,
          section,
          entityId: result.id,
          entityName: result.name,
          entityImage: result.image,
          orderIndex,
          isActive: 1
        }]);
        setIsModalOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este destaque?")) return;
    setLoadingAction(id);
    try {
      await deleteFeaturedContent(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao remover");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleVisibility = async (item: ContentItem) => {
    setLoadingAction(item.id);
    try {
      const newStatus = item.isActive ? 0 : 1;
      await upsertFeaturedContent({
        id: item.id,
        section: item.section,
        entityId: item.entityId,
        entityName: item.entityName,
        entityImage: item.entityImage,
        orderIndex: item.orderIndex,
        isActive: newStatus
      });
      setItems(items.map(i => i.id === item.id ? { ...i, isActive: newStatus } : i));
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar visibilidade");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSeedDefaults = async (section: string) => {
    if (!confirm("Isso apagará o conteúdo desta seção e preencherá com o conteúdo padrão do IGDB. Tem certeza?")) return;
    try {
      await seedDefaultContent(section);
      alert("Conteúdo preenchido com sucesso! Recarregue a página para ver as mudanças.");
      window.location.reload();
    } catch (err: any) {
      alert("Erro ao preencher com padrão: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Gerenciar {section}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {section === 'HOME_RECOMMENDED' && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handleSeedDefaults(section)}>
              <LucideIcons.Download size={16} /> Preencher Padrão
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className={`${styles.btn} ${styles.btnPrimary}`}>
            <LucideIcons.Plus size={16} /> Adicionar Novo
          </button>
        </div>
      </div>

      <div className={styles.contentList}>
        {items.length === 0 ? (
          <p style={{ color: '#888', padding: '2rem', textAlign: 'center', backgroundColor: '#111', borderRadius: '8px' }}>
            Nenhum conteúdo configurado nesta seção.
          </p>
        ) : (
          items.map(item => (
            <div key={item.id} className={styles.contentItem} style={{ opacity: item.isActive ? 1 : 0.5 }}>
              <div className={styles.itemInfo}>
                {item.entityImage && (
                  <img src={item.entityImage} alt={item.entityName} className={styles.itemImage} />
                )}
                <div className={styles.itemDetails}>
                  <h4>{item.entityName}</h4>
                  <p>Ordem: {item.orderIndex} | {item.isActive ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
              <div className={styles.itemActions}>
                <button 
                  onClick={() => handleToggleVisibility(item)} 
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  disabled={loadingAction === item.id}
                >
                  {item.isActive ? <LucideIcons.EyeOff size={16} /> : <LucideIcons.Eye size={16} />}
                </button>
                <button 
                  onClick={() => handleRemove(item.id)} 
                  className={`${styles.btn} ${styles.btnDanger}`}
                  disabled={loadingAction === item.id}
                >
                  <LucideIcons.Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Buscar {isFranchise ? 'Franquia' : 'Jogo'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <LucideIcons.X size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  className={styles.searchInput}
                  placeholder={`Digite o nome do ${isFranchise ? 'franquia' : 'jogo'}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>
              
              <div className={styles.searchResults}>
                {isSearching ? (
                  <p style={{ textAlign: 'center', color: '#888' }}>Buscando no IGDB...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <div key={result.id} className={styles.searchItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {result.image && <img src={result.image} alt={result.name} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <div>
                          <div style={{ fontWeight: 600 }}>{result.name}</div>
                          {result.info && <div style={{ fontSize: '0.8rem', color: '#888' }}>{result.info}</div>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAdd(result)}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loadingAction === result.id}
                      >
                        {loadingAction === result.id ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    </div>
                  ))
                ) : searchQuery && !isSearching ? (
                  <p style={{ textAlign: 'center', color: '#888' }}>Nenhum resultado encontrado.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
