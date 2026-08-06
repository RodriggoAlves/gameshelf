"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect } from "react";
import styles from "../page.module.css";
import { Game } from "../../lib/api";
import { useI18n } from "../contexts/I18nContext";
import QuickAddButton from "./QuickAddButton";
import * as LucideIcons from "lucide-react";

const features = [
  {
    title: "Sistema Social & Feed de Amigos",
    description: "Acompanhe seus amigos em tempo real. Veja quando platinarem um jogo ou adicionarem uma review, curta e comente nas atividades deles para deixar a plataforma viva.",
    icon: "Users",
    status: "Em Breve"
  },
  {
    title: "Reviews & Rankings Comunitários",
    description: "Torne-se um crítico reconhecido! O Zerey terá um agregador de notas da comunidade, permitindo ler análises de outros jogadores e ver o cobiçado Top 100 da plataforma.",
    icon: "Star",
    status: "Planejado"
  },
  {
    title: "Coleções Customizadas",
    description: "Crie suas próprias listas como 'Minha Maratona de Resident Evil' ou 'Melhores RPGs do PS2', e exiba-as em destaque no seu Hub de Perfil.",
    icon: "ListVideo",
    status: "Planejado"
  },
  {
    title: "Desafios Zerey",
    description: "Eventos sazonais e desafios da comunidade. Ex: 'Termine 3 jogos de terror no mês do Halloween' para ganhar Badges exclusivas e limite de tempo.",
    icon: "Trophy",
    status: "Ideação"
  },
  {
    title: "Integração HLTB (HowLongToBeat)",
    description: "Veja imediatamente o tempo médio que as pessoas levam para zerar o jogo antes mesmo de adicioná-lo à sua biblioteca.",
    icon: "Clock",
    status: "Pesquisa"
  }
];

export default function HomeView({ popularGames, libraryIds }: { popularGames: Game[], libraryIds: number[] }) {
  const { t } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let animationId: number;
    let isPaused = false;
    
    const scroll = () => {
      if (!isPaused) {
        carousel.scrollLeft += 1; // Velocidade do scroll
        
        // Quando chegar perto do fim, reseta para o começo para efeito infinito
        if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1) {
          carousel.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const pause = () => { isPaused = true; };
    const play = () => { isPaused = false; };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", play);
    carousel.addEventListener("touchstart", pause);
    carousel.addEventListener("touchend", play);

    return () => {
      cancelAnimationFrame(animationId);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", play);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", play);
    };
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>{t.home.title_line1}<br />{t.home.title_line2}</h1>
          <p className={styles.subtitle}>
            {t.home.subtitle}
          </p>
          <Link href="/library" className={styles.ctaButton}>{t.home.cta}</Link>
        </section>

        <section className={styles.featured}>
          <h2 className={styles.sectionTitle}>{t.home.featured_title}</h2>
          <div className={styles.carousel} ref={carouselRef}>
            {popularGames.map((game) => (
              <Link href={`/game/${game.id}`} key={game.id} className={styles.gameCard}>
                <QuickAddButton gameId={game.id} isSavedInitial={libraryIds.includes(game.id)} />
                <div className={styles.gameImagePlaceholder} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
                  {game.background_image ? (
                    <Image 
                      src={game.background_image} 
                      alt={game.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                      style={{ objectFit: 'cover' }} 
                    />
                  ) : null}
                </div>
                <div className={styles.gameInfo}>
                  <h3 className={styles.gameTitle}>{game.name}</h3>
                  <div className={styles.gameMeta}>
                    <span className={styles.gameYear}>{new Date(game.released).getFullYear()}</span>
                    <span className={styles.gameRating}>{Math.round(game.rating)} / 100</span>
                  </div>
                  <div className={styles.gameGenres}>
                    {game.genres?.slice(0, 2).map(g => g.name).join(', ') || 'Sem gênero'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.bentoSection}>
          <div className={styles.bentoHeader}>
            <h2>Elevando a sua experiência gamer</h2>
            <p>Tudo o que você precisa para gerenciar sua vida nos videogames, com um design premium.</p>
          </div>
          <div className={styles.bentoGrid}>
            <div className={`${styles.bentoCard} ${styles.bentoLarge}`}>
              <svg className={styles.bentoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              <h3>O maior banco de dados do mundo</h3>
              <p>Conectado diretamente à IGDB da Twitch. Descubra lançamentos, clássicos e jogos obscuros. Se um jogo existe, ele está aqui, com capas em alta resolução e detalhes super precisos.</p>
            </div>
            <div className={styles.bentoCard}>
              <svg className={styles.bentoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <h3>Seu Backlog Organizado</h3>
              <p>Chega de esquecer o que você estava jogando. Crie listas, marque favoritos e acompanhe seu progresso de verdade.</p>
            </div>
            <div className={styles.bentoCard}>
              <svg className={styles.bentoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <h3>Comunidade e Avaliações</h3>
              <p>Dê a sua nota definitiva, escreva reviews e veja o que os outros jogadores estão achando dos últimos lançamentos.</p>
            </div>
            <div className={`${styles.bentoCard} ${styles.bentoLarge}`}>
              <svg className={styles.bentoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3>Estatísticas em Tempo Real</h3>
              <p>Acompanhe quantas horas você já jogou, seus gêneros favoritos e veja o seu perfil gamer evoluir a cada jogo zerado. Tudo de forma minimalista.</p>
            </div>
          </div>
        </section>

        <section className={styles.roadmapSection} style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className={styles.bentoHeader} style={{ marginBottom: '3rem' }}>
            <h2>O Futuro do Zerey</h2>
            <p>Estamos apenas começando. Veja o que está no nosso horizonte.</p>
          </div>

          <div className="roadmap-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', width: '100%' }}>
            {features.map((feat, index) => {
              const IconComp = (LucideIcons as any)[feat.icon] || LucideIcons.Rocket;
              
              return (
                <div key={index} className="roadmap-card" style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '2rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
                    <IconComp size={28} style={{ color: '#2ecc71' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>{feat.title}</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                        {feat.status}
                      </span>
                    </div>
                    <p style={{ color: '#aaa', lineHeight: 1.5, margin: 0 }}>{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
