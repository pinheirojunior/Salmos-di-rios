const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

console.log('Baixando a Bíblia ACF em Português...');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Remover UTF-8 Byte Order Mark (BOM) se existir
      const cleanedData = data.replace(/^\uFEFF/, "");
      
      const bible = JSON.parse(cleanedData);
      console.log('Bíblia baixada com sucesso. Procurando o livro de Salmos...');
      
      // Encontrar o livro de Salmos (pode ser "Salmos" ou abbrev "sl")
      const salmosLib = bible.find(b => 
        b.name.toLowerCase() === 'salmos' || 
        b.abbrev.toLowerCase() === 'sl'
      );

      if (!salmosLib) {
        console.error('Livro de Salmos não encontrado!');
        process.exit(1);
      }

      console.log(`Livro de Salmos encontrado! Nome: ${salmosLib.name}. Capítulos: ${salmosLib.chapters.length}`);

      // Vamos estruturar no formato Psalm: { number, title, theme, verses: { number, text }[] }
      const formattedPsalms = {};

      const categories = {
        "lamento": [5, 6, 7, 10, 13, 17, 22, 25, 26, 31, 35, 38, 39, 43, 54, 55, 56, 57, 58, 59, 60, 64, 69, 70, 71, 74, 77, 79, 80, 83, 86, 88, 102, 109, 140, 141, 142, 143],
        "sabedoria": [14, 15, 36, 37, 49, 53, 73, 78, 82, 101, 112, 127, 128, 131],
        "protecao": [11, 12, 16, 18, 20, 21, 28, 44, 48, 52, 61, 62, 63, 68, 76, 85, 87, 108, 115, 118, 120, 124, 125, 129, 144],
        "louvor": [9, 24, 29, 33, 47, 50, 65, 66, 67, 75, 81, 84, 89, 92, 93, 94, 95, 96, 97, 98, 99, 104, 105, 106, 107, 111, 113, 114, 116, 117, 134, 135, 136, 138, 145, 146, 147, 148, 149],
        "realeza": [2, 45, 72, 110],
        "confianca": [30, 32, 40, 41, 122, 123, 126, 137]
      };

      const getCategory = (num) => {
        if (categories.lamento.includes(num)) return "Oração e Lamento";
        if (categories.sabedoria.includes(num)) return "Sabedoria e Instrução";
        if (categories.protecao.includes(num)) return "Proteção Divina";
        if (categories.louvor.includes(num)) return "Louvor e Adoração";
        if (categories.realeza.includes(num)) return "Realeza e Messias";
        if (categories.confianca.includes(num)) return "Confiança e Fé";
        return "Ação de Graças";
      };

      const getTheme = (num, category) => {
        const specialThemes = {
          1: "Os dois caminhos: a bem-aventurança do justo e o fim dos ímpios.",
          3: "Confiança em Deus no meio das tribulações cotidianas.",
          4: "Oração vespertina de plena confiança e paz ao adormecer.",
          8: "A glória de Deus na Criação e a dignidade concedida ao ser humano.",
          19: "A perfeição da lei divina e o testemunho silencioso da natureza.",
          23: "O Senhor é o meu pastor; nada me faltará.",
          27: "O Senhor é a minha luz e a minha salvação; de quem terei medo?",
          34: "A bondade protetora do Senhor que ao atribulado acolhe.",
          42: "O anseio profundo da alma que tem sede do Deus vivo.",
          46: "Deus é o nosso refúgio e fortaleza, socorro bem presente nas adversidades.",
          51: "Sincera oração de arrependimento e busca por um coração puro.",
          57: "Refúgio à sombra das asas divinas e oração de confiança absoluta.",
          90: "A eternidade de Deus e a fragilidade da nossa jornada terrena.",
          91: "A segurança absoluta sob a sombra do Deus Altíssimo.",
          100: "Celebração alegre de gratidão e reconhecimento do cuidado de Deus.",
          103: "Louvor pelas misericórdias divinas que renovam as nossas vidas.",
          119: "A meditação constante na beleza e instrução da Palavra divina.",
          121: "O olhar de esperança voltado para os montes: o auxílio fiel do Criador.",
          130: "Das profundezas da alma se clama ao Senhor por redenção e perdão.",
          133: "A união fraterna dos irmãos que vivem em perfeita harmonia.",
          139: "O Deus onisciente e onipresente que nos conhece e nos teceu com amor.",
          150: "O grandioso louvor universal: tudo o que tem fôlego adore ao Senhor."
        };

        if (specialThemes[num]) return specialThemes[num];

        switch (category) {
          case "Louvor e Adoração":
            return `Exaltação à soberania de Deus e à magnificência do seu santo nome no Salmo ${num}.`;
          case "Proteção Divina":
            return `Refúgio seguro e a certeza da guarda divina perante todos os temores no Salmo ${num}.`;
          case "Oração e Lamento":
            return `Clamor sincero ao Pai em tempos de dificuldades e oração por auxílio no Salmo ${num}.`;
          case "Confiança e Fé":
            return `Entrega total dos nossos caminhos e quietude espiritual diante do Salmo ${num}.`;
          case "Sabedoria e Instrução":
            return `Orientação prática para vivermos uma vida reta, piedosa e justa no Salmo ${num}.`;
          case "Realeza e Messias":
            return `Profecia inspirada acerca do Messias prometido e do seu reinado de justiça no Salmo ${num}.`;
          default:
            return `Cântico de gratidão pelo amparo de Deus que nos sustenta no Salmo ${num}.`;
        }
      };

      salmosLib.chapters.forEach((chapterVerses, chapterIdx) => {
        const num = chapterIdx + 1;
        const category = getCategory(num);
        const theme = getTheme(num, category);

        // chapterVerses é um array de strings (versículos)
        const verses = chapterVerses.map((vText, verseIdx) => ({
          number: verseIdx + 1,
          text: vText.trim()
        }));

        formattedPsalms[num] = {
          number: num,
          title: `Salmo ${num}`,
          theme: theme,
          verses: verses
        };
      });

      // Gravar como cache persistente na raiz para o servidor
      fs.writeFileSync(
        path.join(__dirname, 'psalms_db_cache.json'),
        JSON.stringify(formattedPsalms, null, 2),
        'utf-8'
      );
      console.log('psalms_db_cache.json atualizado com sucesso com todos os salmos autênticos!');

      // Criar o diretório se não existir
      const dataDir = path.join(__dirname, 'src', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Gravar como arquivo JSON offline para o frontend
      fs.writeFileSync(
        path.join(dataDir, 'allPsalms.json'),
        JSON.stringify(formattedPsalms, null, 2),
        'utf-8'
      );
      console.log('src/data/allPsalms.json atualizado com sucesso com todos os salmos autênticos!');

    } catch (err) {
      console.error('Erro ao processar JSON da Bíblia:', err);
    }
  });
}).on('error', (err) => {
  console.error('Erro de requisição para baixar a Bíblia:', err);
});
