import type { ReactNode } from "react";

type KpiCor = "verde" | "azul" | "laranja" | "vermelho";

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtitulo: string;
  icone: ReactNode;
  cor: KpiCor;
}

export default function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone,
  cor
}: KpiCardProps) {
  return (
    <article className={`estoque-kpi estoque-kpi-${cor}`}>
      <div className="estoque-kpi-conteudo">
        <span className="estoque-kpi-titulo">{titulo}</span>
        <h3 className="estoque-kpi-valor">{valor}</h3>
        <span className="estoque-kpi-subtitulo">{subtitulo}</span>
      </div>

      <div className="estoque-kpi-icone" aria-hidden="true">
        {icone}
      </div>
    </article>
  );
}