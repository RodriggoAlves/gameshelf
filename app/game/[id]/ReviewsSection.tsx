"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, X, MessageSquare, MoreVertical, Flag, Trash2 } from "lucide-react";
import Image from "next/image";
import styles from "./reviews.module.css";
import { saveReview, voteReview, ReviewData, deleteReview, addComment, getComments, reportReview } from "../../actions/reviews";

const CATEGORIES = ["História", "Gameplay", "Gráficos", "Trilha Sonora", "Performance"];
const POSITIVE_TAGS = ["Excelente Atmosfera", "Combate Fluido", "História Envolvente", "Trilha Sonora Épica", "Ótimo Custo-Benefício", "Visual Deslumbrante"];
const NEGATIVE_TAGS = ["Bugs Frequentes", "Muito Repetitivo", "História Fraca", "Mal Otimizado", "Microtransações Abusivas", "Combate Travado"];
const PLATFORMS = ["PC", "PlayStation 5", "PlayStation 4", "Xbox Series X|S", "Xbox One", "Nintendo Switch"];
const PROGRESS_STATUS = ["Estou Jogando", "Joguei Parcialmente", "Zerei", "Abandonei"];

function CommentThread({ reviewId, initialCount, currentUser }: { reviewId: number, initialCount: number, currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchThread = async () => {
    if (!isOpen && comments.length === 0) {
      setLoading(true);
      const data = await getComments(reviewId);
      setComments(data);
      setLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await addComment(reviewId, newComment);
    if (res.success) {
      setNewComment("");
      const data = await getComments(reviewId);
      setComments(data);
    } else {
      alert(res.error);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <button className={styles.commentsToggle} onClick={fetchThread}>
        <MessageSquare size={16} /> {isOpen ? "Ocultar Comentários" : `Comentários (${initialCount})`}
      </button>

      {isOpen && (
        <div className={styles.commentsArea}>
          {loading ? <p style={{ color: '#888', fontSize: '0.9rem' }}>Carregando...</p> : (
            comments.length === 0 ? <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhum comentário ainda.</p> : (
              comments.map(c => (
                <div key={c.id} className={styles.commentCard}>
                  <Image src={c.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed="+c.userId} alt={c.username} width={32} height={32} className={styles.commentAvatar} />
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentUser}>{c.username} {c.role === 'ADMIN' && <span className={styles.roleBadge}>STAFF</span>}</span>
                      <span className={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className={styles.commentText}>{c.content}</div>
                  </div>
                </div>
              ))
            )
          )}
          {currentUser && (
            <form className={styles.commentForm} onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Escreva um comentário..." 
                className={styles.commentInput} 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
              />
              <button type="submit" className={styles.commentSubmit}>Enviar</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewsSection({ 
  gameId, 
  stats, 
  reviews, 
  currentUser 
}: { 
  gameId: number; 
  stats: any; 
  reviews: any[]; 
  currentUser: any 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  const userReview = reviews.find(r => r.userId === currentUser?.id);

  // Form State
  const [score, setScore] = useState<number>(userReview?.score ?? 10);
  const [reviewText, setReviewText] = useState(userReview?.reviewText || "");
  const [containsSpoiler, setContainsSpoiler] = useState(userReview?.containsSpoiler === 1);
  const [recommended, setRecommended] = useState(userReview?.recommended !== 0);
  
  const [platform, setPlatform] = useState(userReview?.platform || "");
  const [playedHours, setPlayedHours] = useState<number | "">(userReview?.playedHours || "");
  const [progressStatus, setProgressStatus] = useState(userReview?.progressStatus || "");

  // Categories Map
  const initialCat = CATEGORIES.reduce((acc, cat) => {
    const existing = userReview?.categories?.find((c: any) => c.category === cat);
    acc[cat] = existing ? existing.score : 10;
    return acc;
  }, {} as Record<string, number>);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(initialCat);

  // Tags Arrays
  const initialPos = userReview?.tags?.filter((t: any) => t.type === 'POSITIVE').map((t: any) => t.name) || [];
  const initialNeg = userReview?.tags?.filter((t: any) => t.type === 'NEGATIVE').map((t: any) => t.name) || [];
  const [selectedPosTags, setSelectedPosTags] = useState<string[]>(initialPos);
  const [selectedNegTags, setSelectedNegTags] = useState<string[]>(initialNeg);

  const dist = stats?.scoreDistribution ? JSON.parse(stats.scoreDistribution) : {};
  const maxDist = Math.max(...Object.values(dist as Record<string, number>), 1);
  
  const categoryAverages = stats?.categoryAverages ? JSON.parse(stats.categoryAverages) : {};
  const topTags = stats?.topTags ? JSON.parse(stats.topTags) : { POSITIVE: [], NEGATIVE: [] };

  const handleTagToggle = (tag: string, type: 'POSITIVE' | 'NEGATIVE') => {
    if (type === 'POSITIVE') {
      setSelectedPosTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    } else {
      setSelectedNegTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Você precisa estar logado para avaliar.");
    
    setIsSubmitting(true);
    
    const cats = Object.entries(categoryScores).map(([cat, val]) => ({ category: cat, score: val }));
    const tags = [
      ...selectedPosTags.map(name => ({ name, type: "POSITIVE" as const })),
      ...selectedNegTags.map(name => ({ name, type: "NEGATIVE" as const }))
    ];

    const data: ReviewData = {
      gameId,
      score,
      reviewText,
      platform: platform || undefined,
      playedHours: playedHours ? Number(playedHours) : undefined,
      progressStatus: progressStatus || undefined,
      containsSpoiler: containsSpoiler ? 1 : 0,
      recommended: recommended ? 1 : 0,
      categories: cats,
      tags
    };
    
    const res = await saveReview(data);
    setIsSubmitting(false);
    
    if (res.success) {
      setIsFormOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja apagar sua avaliação?")) {
      await deleteReview(gameId);
      setIsFormOpen(false);
    }
  };

  const handleVote = async (reviewId: number, isHelpful: number) => {
    if (!currentUser) return alert("Faça login para votar.");
    await voteReview(reviewId, isHelpful);
  };

  const handleReport = async (reviewId: number) => {
    if (!currentUser) return alert("Faça login para denunciar.");
    const reason = prompt("Qual o motivo da denúncia? (Ex: Spam, Ofensa, Spoiler não marcado)");
    if (reason && reason.trim() !== "") {
      const res = await reportReview(reviewId, reason);
      if (res.success) alert("Denúncia enviada com sucesso! Nossa equipe irá analisar.");
      else alert(res.error);
    }
  };

  // Menu Dropdown Component
  const DropdownMenu = ({ reviewId, isOwner }: { reviewId: number, isOwner: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className={styles.menuWrapper}>
        <button className={styles.menuBtn} onClick={() => setOpen(!open)}><MoreVertical size={20} /></button>
        {open && (
          <div className={styles.dropdown}>
            {isOwner ? (
              <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleDelete}><Trash2 size={14} style={{marginRight:8}}/> Excluir</button>
            ) : (
              <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => { setOpen(false); handleReport(reviewId); }}><Flag size={14} style={{marginRight:8}}/> Denunciar</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.reviewsContainer} id="reviews">
      <div className={styles.actionsHeader}>
        <h2>Avaliações da Comunidade</h2>
        {currentUser && (
          <button className={styles.writeReviewBtn} onClick={() => setIsFormOpen(true)}>
            {userReview ? "Editar Avaliação" : "Avaliar Jogo"}
          </button>
        )}
      </div>

      {/* Stats Header V2 */}
      <div className={styles.statsHeader}>
        <div className={styles.scoreBox}>
          <div className={styles.bigScore}>{stats?.averageScore || "0.0"}<span className={styles.maxScore}>/10</span></div>
          <div className={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} fill={i < Math.round((stats?.averageScore || 0)/2) ? "#fbbf24" : "none"} stroke="#fbbf24" />
            ))}
          </div>
          <div className={styles.reviewCount}>{stats?.reviewCount || 0} avaliações</div>
          <div style={{ marginTop: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
            {stats?.recommendationPercentage || 0}% recomendam
          </div>
        </div>

        <div className={styles.distributionBox}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(s => {
            const count = dist[s.toString()] || 0;
            const percent = (count / maxDist) * 100;
            return (
              <div key={s} className={styles.distRow}>
                <div className={styles.distLabel}>{s}</div>
                <div className={styles.distBarWrapper}>
                  <div className={styles.distBar} style={{ width: `${percent}%` }} />
                </div>
                <div className={styles.distCount}>{count}</div>
              </div>
            );
          })}
        </div>

        {/* Categorias e Tags da V2 */}
        {Object.keys(categoryAverages).length > 0 && (
          <div className={styles.statsAverages}>
            <h3>Média por Categorias</h3>
            {CATEGORIES.map(cat => (
              <div key={cat} className={styles.avgRow}>
                <span>{cat}</span>
                <strong style={{ color: '#fbbf24' }}>{categoryAverages[cat] ? categoryAverages[cat].toFixed(1) : '-'}</strong>
              </div>
            ))}
          </div>
        )}

        {(topTags.POSITIVE?.length > 0 || topTags.NEGATIVE?.length > 0) && (
          <div className={styles.statsTags}>
            {topTags.POSITIVE?.length > 0 && (
              <div>
                <h3 style={{fontSize:'0.9rem', color:'#ccc', marginBottom:'0.5rem'}}>👍 Comunidade Destaca</h3>
                <div>
                  {topTags.POSITIVE.map((t: any) => (
                    <span key={t.name} className={`${styles.topTag} ${styles.pos}`}>{t.name} <small>({t.count})</small></span>
                  ))}
                </div>
              </div>
            )}
            {topTags.NEGATIVE?.length > 0 && (
              <div style={{marginTop: '1rem'}}>
                <h3 style={{fontSize:'0.9rem', color:'#ccc', marginBottom:'0.5rem'}}>👎 Principais Críticas</h3>
                <div>
                  {topTags.NEGATIVE.map((t: any) => (
                    <span key={t.name} className={`${styles.topTag} ${styles.neg}`}>{t.name} <small>({t.count})</small></span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className={styles.reviewList}>
        {reviews.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userMeta}>
                  <Image 
                    src={review.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed="+review.userId} 
                    alt={review.username} 
                    width={40} 
                    height={40} 
                    className={styles.avatar} 
                  />
                  <div>
                    <div className={styles.userName}>
                      {review.username}
                      {review.role === 'ADMIN' && <span className={styles.roleBadge}>STAFF</span>}
                    </div>
                    <div className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {review.score !== null ? (
                    <div className={styles.reviewScore}>
                      <Star fill="#fbbf24" size={16} /> {review.score}/10
                    </div>
                  ) : (
                    <div className={styles.reviewScore} style={{ color: '#888', background: '#222' }}>
                      Sem nota
                    </div>
                  )}
                  <DropdownMenu reviewId={review.id} isOwner={currentUser?.id === review.userId} />
                </div>
              </div>

              <div className={styles.reviewBadges}>
                {review.recommended === 1 ? (
                  <span className={styles.badge} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <ThumbsUp size={12} style={{marginRight: 4}}/> Recomendado
                  </span>
                ) : (
                  <span className={styles.badge} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <ThumbsDown size={12} style={{marginRight: 4}}/> Não recomendado
                  </span>
                )}
                {review.progressStatus && <span className={styles.badge}>Status: {review.progressStatus}</span>}
                {review.playedHours > 0 && <span className={styles.badge}>⌚ {review.playedHours}h jogadas</span>}
                {review.platform && <span className={styles.badge}>🎮 {review.platform}</span>}
              </div>

              {/* Categorias Individuais V2 */}
              {review.categories && review.categories.length > 0 && (
                <div className={styles.reviewCategories}>
                  {review.categories.map((c: any) => (
                    <div key={c.category} className={styles.rCat}>
                      <span>{c.category}</span>
                      <span>{c.score}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags V2 */}
              {review.tags && review.tags.length > 0 && (
                <div className={styles.reviewSelectedTags}>
                  {review.tags.filter((t: any) => t.type === 'POSITIVE').map((t: any) => (
                    <span key={t.name} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{t.name}</span>
                  ))}
                  {review.tags.filter((t: any) => t.type === 'NEGATIVE').map((t: any) => (
                    <span key={t.name} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{t.name}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                {review.containsSpoiler === 1 && !revealedSpoilers[review.id] ? (
                  <div className={styles.spoilerWarning} onClick={() => setRevealedSpoilers(prev => ({...prev, [review.id]: true}))}>
                    <AlertTriangle size={24} />
                    <strong>Esta avaliação contém spoilers</strong>
                    <span>Clique para revelar</span>
                  </div>
                ) : (
                  <div className={styles.reviewBody}>{review.reviewText || "O usuário não deixou um comentário escrito."}</div>
                )}
              </div>

              <div className={styles.reviewFooter}>
                <div className={styles.helpfulSection}>
                  <span className={styles.helpfulText}>Esta análise foi útil?</span>
                  <div className={styles.voteBtns}>
                    <button className={styles.voteBtn} onClick={() => handleVote(review.id, 1)}>
                      <ThumbsUp size={14} /> {review.helpful_count || 0}
                    </button>
                    <button className={styles.voteBtn} onClick={() => handleVote(review.id, 0)}>
                      <ThumbsDown size={14} /> {review.unhelpful_count || 0}
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <CommentThread reviewId={review.id} initialCount={review.comment_count || 0} currentUser={currentUser} />

            </div>
          ))
        )}
      </div>

      {/* Modal de Avaliação V2 */}
      {isFormOpen && (
        <div className={styles.formModalOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>Sua Avaliação</h2>
              <button className={styles.closeBtn} onClick={() => setIsFormOpen(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.flexRow} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.flexCol}>
                  <label style={{ display:'block', marginBottom:'0.5rem', color:'#ccc', fontWeight:500 }}>Plataforma Jogado</label>
                  <select className={styles.selectInput} value={platform} onChange={e => setPlatform(e.target.value)}>
                    <option value="">Selecione...</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.flexCol}>
                  <label style={{ display:'block', marginBottom:'0.5rem', color:'#ccc', fontWeight:500 }}>Horas Jogadas</label>
                  <input type="number" className={styles.textInput} min="0" placeholder="Ex: 40" value={playedHours} onChange={e => setPlayedHours(e.target.value ? Number(e.target.value) : "")} />
                </div>
                <div className={styles.flexCol}>
                  <label style={{ display:'block', marginBottom:'0.5rem', color:'#ccc', fontWeight:500 }}>Status</label>
                  <select className={styles.selectInput} value={progressStatus} onChange={e => setProgressStatus(e.target.value)}>
                    <option value="">Selecione...</option>
                    {PROGRESS_STATUS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                <label>Nota Geral (0 a 10)</label>
                <div className={styles.scoreInputContainer}>
                  <input type="range" min="0" max="10" step="1" className={styles.scoreRange} value={score} onChange={(e) => setScore(parseInt(e.target.value))} />
                  <div className={styles.scoreDisplay}>{score}</div>
                </div>
                
                <div className={styles.categoryList}>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.5rem 0' }}>Avalie os detalhes (opcional):</p>
                  {CATEGORIES.map(cat => (
                    <div key={cat} className={styles.categoryRow}>
                      <span className={styles.categoryName}>{cat}</span>
                      <input type="range" min="0" max="10" step="1" className={styles.scoreRange} style={{ flex: 1, margin: '0 1rem' }} value={categoryScores[cat]} onChange={(e) => setCategoryScores(prev => ({...prev, [cat]: parseInt(e.target.value)}))} />
                      <span style={{ color: '#fbbf24', fontWeight: 'bold', width: '30px', textAlign: 'right' }}>{categoryScores[cat]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Pontos Fortes & Fracos</label>
                <div className={styles.tagsGrid} style={{ marginBottom: '0.5rem' }}>
                  {POSITIVE_TAGS.map(tag => (
                    <button key={tag} type="button" className={`${styles.tagChip} ${styles.positive} ${selectedPosTags.includes(tag) ? styles.selected : ''}`} onClick={() => handleTagToggle(tag, 'POSITIVE')}>
                      + {tag}
                    </button>
                  ))}
                </div>
                <div className={styles.tagsGrid}>
                  {NEGATIVE_TAGS.map(tag => (
                    <button key={tag} type="button" className={`${styles.tagChip} ${styles.negative} ${selectedNegTags.includes(tag) ? styles.selected : ''}`} onClick={() => handleTagToggle(tag, 'NEGATIVE')}>
                      - {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Recomendação</label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={recommended} onChange={e => setRecommended(e.target.checked)} />
                  Eu recomendo este jogo para outras pessoas
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Análise Escrita (Opcional)</label>
                <textarea 
                  className={styles.textArea} 
                  placeholder="Conte-nos o que achou..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel} style={{ color: '#ef4444' }}>
                  <input type="checkbox" checked={containsSpoiler} onChange={e => setContainsSpoiler(e.target.checked)} />
                  Minha análise contém SPOILERS da história
                </label>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Publicar Avaliação"}
              </button>
              
              {userReview && (
                <button type="button" onClick={handleDelete} style={{ width: '100%', padding: '1rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 600 }}>
                  Apagar Avaliação
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
