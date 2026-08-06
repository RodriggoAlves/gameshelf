"use client";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import styles from "./roadmap.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

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

export default function RoadmapPage() {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <section className={styles.roadmapSection}>
          <div className={styles.roadmapHeader}>
            <h2>O Futuro do Zerey</h2>
            <p>Estamos apenas começando. Veja o que está no nosso horizonte.</p>
          </div>

          <div className={styles.roadmapTimeline}>
            {features.map((feat, index) => {
              const IconComp = (LucideIcons as any)[feat.icon] || LucideIcons.Rocket;
              
              return (
                <div key={index} className={`${styles.roadmapNode} ${index % 2 === 0 ? styles.leftNode : styles.rightNode}`}>
                  <div className={styles.roadmapCenter}>
                    <div className={styles.roadmapDot}></div>
                  </div>
                  <div className={styles.roadmapCard}>
                    <div className={styles.roadmapIconWrapper}>
                      <IconComp size={28} className={styles.roadmapIcon} />
                    </div>
                    <div className={styles.roadmapContent}>
                      <div className={styles.roadmapCardHeader}>
                        <h3 className={styles.roadmapCardTitle}>{feat.title}</h3>
                        <span className={styles.roadmapBadge} data-status={feat.status}>
                          {feat.status}
                        </span>
                      </div>
                      <p className={styles.roadmapDesc}>{feat.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
