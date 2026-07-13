export interface PsalmMetadata {
  number: number;
  title: string;
  theme: string;
  category: string;
  preview: string;
}

// Famous, widely-read Psalms detailed individually
const specialPsalms: Record<number, { theme: string; category: string; preview: string }> = {
  1: {
    theme: "Os dois caminhos: a bem-aventurança do justo e o fim dos ímpios.",
    category: "Sabedoria e Instrução",
    preview: "Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho..."
  },
  3: {
    theme: "Confiança em Deus no meio das tribulações cotidianas.",
    category: "Oração e Lamento",
    preview: "Senhor, como se têm multiplicado os meus adversários! São muitos os que se levantam contra mim..."
  },
  4: {
    theme: "Oração vespertina de plena confiança e paz ao adormecer.",
    category: "Confiança e Fé",
    preview: "Responde-me quando clamo, ó Deus da minha justiça! Na angústia me deste largueza..."
  },
  8: {
    theme: "A glória de Deus na Criação e a dignidade concedida ao ser humano.",
    category: "Louvor e Adoração",
    preview: "Ó Senhor, Senhor nosso, quão admirável é o teu nome em toda a terra! Tu que puseste a tua glória..."
  },
  19: {
    theme: "A perfeição da lei divina e o testemunho silencioso da natureza.",
    category: "Sabedoria e Instrução",
    preview: "Os céus proclamam a glória de Deus e o firmamento anuncia as obras das suas mãos..."
  },
  23: {
    theme: "O Senhor é o meu pastor; nada me faltará.",
    category: "Confiança e Fé",
    preview: "O Senhor é o meu pastor; de nada terei falta. Deitar-me faz em verdes pastos..."
  },
  27: {
    theme: "O Senhor é a minha luz e a minha salvação; de quem terei medo?",
    category: "Confiança e Fé",
    preview: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida..."
  },
  34: {
    theme: "A bondade protetora do Senhor que acolhe o atribulado.",
    category: "Ação de Graças",
    preview: "Bendirei o Senhor em todo o tempo; o seu louvor estará continuamente na minha boca..."
  },
  42: {
    theme: "O anseio profundo da alma que tem sede do Deus vivo.",
    category: "Oração e Lamento",
    preview: "Como o cervo brama pelas correntes das águas, assim suspira a minha alma por ti, ó Deus..."
  },
  46: {
    theme: "Deus é o nosso refúgio e fortaleza, socorro bem presente nas adversidades.",
    category: "Proteção Divina",
    preview: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. Pelo que não temeremos..."
  },
  51: {
    theme: "Sincera oração de arrependimento e busca por um coração puro.",
    category: "Oração e Lamento",
    preview: "Tem misericórdia de mim, ó Deus, segundo a tua benignidade; apaga as minhas transgressões..."
  },
  90: {
    theme: "A eternidade de Deus e a fragilidade da nossa jornada terrena.",
    category: "Reflexão e Tempo",
    preview: "Senhor, tu tens sido o nosso refúgio, de geração em geração. Antes que os montes nascessem..."
  },
  91: {
    theme: "A segurança absoluta sob a sombra do Deus Altíssimo.",
    category: "Proteção Divina",
    preview: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará..."
  },
  100: {
    theme: "Celebração alegre de gratidão e reconhecimento do cuidado de Deus.",
    category: "Louvor e Adoração",
    preview: "Celebrai com júbilo ao Senhor, todas as terras. Servi ao Senhor com alegria..."
  },
  103: {
    theme: "Louvor pelas misericórdias divinas que renovam as nossas vidas.",
    category: "Ação de Graças",
    preview: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome..."
  },
  119: {
    theme: "A meditação constante na beleza e instrução da Palavra divina.",
    category: "Sabedoria e Instrução",
    preview: "Bem-aventurados os que trilham caminhos retos, que andam na lei do Senhor..."
  },
  121: {
    theme: "O olhar de esperança voltado para os montes: o auxílio fiel do Criador.",
    category: "Proteção Divina",
    preview: "Elevo os meus olhos para os montes; de onde me virá o socorro? O meu socorro vem do Senhor..."
  },
  130: {
    theme: "Das profundezas da alma se clama ao Senhor por redenção e perdão.",
    category: "Oração e Lamento",
    preview: "Das profundezas clamo a ti, ó Senhor. Senhor, escuta a minha voz; estejam os teus ouvidos atentos..."
  },
  133: {
    theme: "A união fraterna dos irmãos que vivem em perfeita harmonia.",
    category: "Sabedoria e Instrução",
    preview: "Oh! quão bom e quão suave é que os irmãos vivam em união! É como o óleo precioso..."
  },
  139: {
    theme: "O Deus onisciente e onipresente que nos conhece e nos teceu com amor.",
    category: "Reflexão e Tempo",
    preview: "Senhor, tu me sondaste, e me conheces. Tu conheces o meu sentar e o meu levantar..."
  },
  150: {
    theme: "O grandioso louvor universal: tudo o que tem fôlego adore ao Senhor.",
    category: "Louvor e Adoração",
    preview: "Louvai ao Senhor! Louvai a Deus no seu santuário; louvai-o no firmamento do seu poder..."
  }
};

// Map traditional categories for remaining Psalms based on historical themes
const getCategoryForPsalm = (num: number): string => {
  if (specialPsalms[num]) return specialPsalms[num].category;
  
  const lamento = [5, 6, 7, 10, 13, 17, 22, 25, 26, 31, 35, 38, 39, 43, 54, 55, 56, 57, 58, 59, 60, 64, 69, 70, 71, 74, 77, 79, 80, 83, 86, 88, 102, 109, 140, 141, 142, 143];
  const sabedoria = [14, 15, 36, 37, 49, 53, 73, 78, 82, 101, 112, 127, 128, 131];
  const protecao = [11, 12, 16, 18, 20, 21, 28, 44, 48, 52, 61, 62, 63, 68, 76, 85, 87, 108, 115, 118, 120, 124, 125, 129, 144];
  const louvor = [9, 24, 29, 33, 47, 50, 65, 66, 67, 75, 81, 84, 89, 92, 93, 94, 95, 96, 97, 98, 99, 104, 105, 106, 107, 111, 113, 114, 116, 117, 134, 135, 136, 138, 145, 146, 147, 148, 149];
  const realeza = [2, 45, 72, 110];
  const confianca = [30, 32, 40, 41, 122, 123, 126, 137];

  if (lamento.includes(num)) return "Oração e Lamento";
  if (sabedoria.includes(num)) return "Sabedoria e Instrução";
  if (protecao.includes(num)) return "Proteção Divina";
  if (louvor.includes(num)) return "Louvor e Adoração";
  if (realeza.includes(num)) return "Realeza e Messias";
  if (confianca.includes(num)) return "Confiança e Fé";
  return "Ação de Graças";
};

const getThemeForPsalm = (num: number, category: string): string => {
  if (specialPsalms[num]) return specialPsalms[num].theme;
  
  switch (category) {
    case "Louvor e Adoração":
      return `Exaltação à soberania de Deus e à magnificência do seu santo nome.`;
    case "Proteção Divina":
      return `Refúgio seguro e a certeza da guarda divina perante todos os temores.`;
    case "Oração e Lamento":
      return `Clamor sincero ao Pai em tempos de dificuldades e oração por auxílio imediato.`;
    case "Confiança e Fé":
      return `Entrega total dos nossos caminhos e quietude espiritual diante das promessas divinas.`;
    case "Sabedoria e Instrução":
      return `Orientação prática para vivermos uma vida reta, piedosa, justa e sábia.`;
    case "Realeza e Messias":
      return `Profecia inspirada acerca do Messias prometido e do seu reinado eterno de justiça.`;
    default:
      return `Cântico de gratidão pelo amparo de Deus que nos sustenta a cada novo amanhecer.`;
  }
};

const getPreviewForPsalm = (num: number): string => {
  if (specialPsalms[num]) return specialPsalms[num].preview;
  
  // High quality traditional paraphrases of first verse for generic items
  const prompts: Record<string, string> = {
    "Louvor e Adoração": "Louvai ao Senhor, porque o Senhor é bom; cantai louvores ao seu nome...",
    "Proteção Divina": "Em ti, Senhor, confio; nunca me deixes confundido; livra-me por tua justiça...",
    "Oração e Lamento": "Ouve, Senhor, a minha voz quando clamo; tem também piedade de mim...",
    "Confiança e Fé": "Espera no Senhor, anima-te, e ele fortalecerá o teu coração; espera, pois...",
    "Sabedoria e Instrução": "Ensina-me, Senhor, o teu caminho, e guiarei meus passos na tua verdade...",
    "Realeza e Messias": "O Senhor reina; está vestido de majestade; o Senhor se revestiu de força...",
    "Ação de Graças": "Rendei graças ao Senhor, porque ele é bom; porque a sua misericórdia dura para sempre..."
  };
  const cat = getCategoryForPsalm(num);
  return prompts[cat] || "A graça e a paz de Deus acompanham todos aqueles que meditam na sua lei...";
};

export const psalmsMetadataList: PsalmMetadata[] = Array.from({ length: 150 }, (_, i) => {
  const num = i + 1;
  const category = getCategoryForPsalm(num);
  const theme = getThemeForPsalm(num, category);
  const preview = getPreviewForPsalm(num);
  return {
    number: num,
    title: `Salmo ${num}`,
    theme,
    category,
    preview
  };
});
