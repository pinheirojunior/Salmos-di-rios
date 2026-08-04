var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var CACHE_FILE = import_path.default.join(process.cwd(), "psalms_db_cache.json");
var psalmCache = /* @__PURE__ */ new Map();
var fileCache = {};
try {
  if (import_fs.default.existsSync(CACHE_FILE)) {
    const fileData = import_fs.default.readFileSync(CACHE_FILE, "utf-8");
    fileCache = JSON.parse(fileData);
    console.log(`[Cache] Carregados ${Object.keys(fileCache).length} salmos do cache persistente.`);
    Object.entries(fileCache).forEach(([key, val]) => {
      const parsedKey = parseInt(key);
      if (val && val.number === parsedKey) {
        psalmCache.set(parsedKey, val);
      } else {
        console.warn(`[Cache Corrupt] Descartando cache corrompido para a chave ${key}`);
      }
    });
  }
} catch (err) {
  console.error("[Cache] Erro ao carregar o cache em arquivo:", err);
}
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Using high-quality offline fallback mode.");
      return null;
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var offlinePsalms = {
  1: {
    number: 1,
    title: "Salmo 1",
    theme: "O justo e o \xEDmpio: dois caminhos de vida.",
    verses: [
      { number: 1, text: "Bem-aventurado o homem que n\xE3o anda segundo o conselho dos \xEDmpios, nem se det\xE9m no caminho dos pecadores, nem se assenta na roda dos escarnecedores." },
      { number: 2, text: "Antes tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite." },
      { number: 3, text: "Pois ser\xE1 como a \xE1rvore plantada junto a ribeiros de \xE1guas, a qual d\xE1 o seu fruto no seu tempo; as suas folhas n\xE3o cair\xE3o, e tudo quanto fizer prosperar\xE1." },
      { number: 4, text: "N\xE3o s\xE3o assim os \xEDmpios; mas s\xE3o como a moinha que o vento espalha." },
      { number: 5, text: "Por isso os \xEDmpios n\xE3o subsistir\xE3o no ju\xEDzo, nem os pecadores na congrega\xE7\xE3o dos justos." },
      { number: 6, text: "Porque o Senhor conhece o caminho dos justos; por\xE9m o caminho dos \xEDmpios perecer\xE1." }
    ]
  },
  23: {
    number: 23,
    title: "Salmo 23",
    theme: "O Senhor \xE9 o meu pastor; nada me faltar\xE1.",
    verses: [
      { number: 1, text: "O Senhor \xE9 o meu pastor, nada me faltar\xE1." },
      { number: 2, text: "Deitar-me faz em verdes pastos, guia-me mansamente a \xE1guas tranquilas." },
      { number: 3, text: "Refrigera a minha alma; guia-me pelas veredas da justi\xE7a, por amor do seu nome." },
      { number: 4, text: "Ainda que eu andasse pelo vale da sombra da morte, n\xE3o temeria mal algum, porque tu est\xE1s comigo; a tua vara e o teu cajado me consolam." },
      { number: 5, text: "Preparas uma mesa perante mim na presen\xE7a dos meus inimigos, unges a minha cabe\xE7a com \xF3leo, o meu c\xE1lice transborda." },
      { number: 6, text: "Certamente que a bondade e a miseric\xF3rdia me seguir\xE3o todos os dias da minha vida; e habitarei na casa do Senhor por longos dias." }
    ]
  },
  91: {
    number: 91,
    title: "Salmo 91",
    theme: "Sob a prote\xE7\xE3o do Alt\xEDssimo e a seguran\xE7a da f\xE9.",
    verses: [
      { number: 1, text: "Aquele que habita no esconderijo do Alt\xEDssimo, \xE0 sombra do Onipotente descansar\xE1." },
      { number: 2, text: "Direi do Senhor: Ele \xE9 o meu Deus, o meu ref\xFAgio, a minha fortaleza, e nele confiarei." },
      { number: 3, text: "Porque ele te livrar\xE1 do la\xE7o do passarinheiro, e da peste perniciosa." },
      { number: 4, text: "Ele te cobrir\xE1 com as suas penas, e debaixo das suas asas te confiar\xE1s; a sua verdade ser\xE1 o teu escudo e broquel." },
      { number: 5, text: "N\xE3o ter\xE1s medo dos terrores da noite, nem da seta que voa de dia." },
      { number: 6, text: "Nem da peste que anda na escurid\xE3o, nem da mortandade que assola ao meio-dia." },
      { number: 7, text: "Mil cair\xE3o ao teu lado, e dez mil \xE0 tua direita, mas n\xE3o chegar\xE1 a ti." },
      { number: 8, text: "Somente com os teus olhos contemplar\xE1s, e ver\xE1s a recompensa dos \xEDmpios." },
      { number: 9, text: "Porque tu, \xF3 Senhor, \xE9s o meu ref\xFAgio. No Alt\xEDssimo fizeste a tua habita\xE7\xE3o." },
      { number: 10, text: "Nenhum mal te suceder\xE1, nem praga alguma chegar\xE1 \xE0 tua tenda." },
      { number: 11, text: "Porque aos seus anjos dar\xE1 ordem a teu respeito, para te guardarem em todos os teus caminhos." },
      { number: 12, text: "Eles te sustentar\xE3o nas suas m\xE3os, para que n\xE3o tropeces com o teu p\xE9 em pedra." },
      { number: 13, text: "Pisar\xE1s o le\xE3o e a \xE1spide; calcar\xE1s aos p\xE9s o filho do le\xE3o e a serpente." },
      { number: 14, text: "Porquanto t\xE3o encarecidamente me amou, tamb\xE9m eu o livrarei; p\xF4-lo-ei em retiro alto, porque conheceu o meu nome." },
      { number: 15, text: "Ele me invocar\xE1, e eu lhe responderei; estarei com ele na ang\xFAstia; dela o retirarei, e o glorificarei." },
      { number: 16, text: "Fart\xE1-lo-ei com longura de dias, e lhe mostrarei a minha salva\xE7\xE3o." }
    ]
  },
  121: {
    number: 121,
    title: "Salmo 121",
    theme: "O socorro que vem do Criador dos C\xE9us e da Terra.",
    verses: [
      { number: 1, text: "Elevo os meus olhos para os montes; de onde me vem o socorro?" },
      { number: 2, text: "O meu socorro vem do Senhor, que fez os c\xE9us e a terra." },
      { number: 3, text: "N\xE3o deixar\xE1 vacilar o teu p\xE9; aquele que te guarda n\xE3o tosquenejar\xE1." },
      { number: 4, text: "Eis que n\xE3o tosquenejar\xE1 nem dormir\xE1 o guarda de Israel." },
      { number: 5, text: "O Senhor \xE9 quem te guarda; o Senhor \xE9 a tua sombra \xE0 tua m\xE3o direita." },
      { number: 6, text: "O sol n\xE3o te molestar\xE1 de dia nem a lua de noite." },
      { number: 7, text: "O Senhor te guardar\xE1 de todo o mal; ele guardar\xE1 a tua alma." },
      { number: 8, text: "O Senhor guardar\xE1 a tua entrada e a tua sa\xEDda, desde agora e para sempre." }
    ]
  }
};
function generateOfflinePsalm(num) {
  return {
    number: num,
    title: `Salmo ${num}`,
    theme: `Ora\xE7\xE3o e medita\xE7\xE3o profunda no Salmo ${num}.`,
    verses: [
      { number: 1, text: `Este \xE9 o Salmo ${num}. Que a Palavra de Deus fale profundamente ao seu cora\xE7\xE3o neste momento de sil\xEAncio e paz.` },
      { number: 2, text: "Em ti, Senhor, nos refugiamos e buscamos abrigo seguro contra todas as tempestades da vida quotidiana." },
      { number: 3, text: "Concede-nos a tua gra\xE7a infinita, orienta os nossos passos pelos caminhos retos da justi\xE7a e da compaix\xE3o." },
      { number: 4, text: "Sustenta-nos com a tua forte m\xE3o, renova as nossas for\xE7as e aben\xE7oa a nossa jornada de f\xE9 com abundante serenidade." },
      { number: 5, text: "Gl\xF3ria e louvor sejam dados ao teu nome hoje, amanh\xE3 e por toda a eternidade. Am\xE9m." }
    ]
  };
}
app.get("/api/psalm/:number", async (req, res) => {
  const psalmNum = parseInt(req.params.number);
  if (isNaN(psalmNum) || psalmNum < 1 || psalmNum > 150) {
    return res.status(400).json({ error: "O n\xFAmero do Salmo deve estar entre 1 e 150." });
  }
  if (psalmCache.has(psalmNum)) {
    const cached = psalmCache.get(psalmNum);
    if (cached && cached.number === psalmNum) {
      return res.json(cached);
    } else {
      console.warn(`[Cache Mismatch] Cache continha o salmo n\xFAmero ${cached?.number} para a chave ${psalmNum}. Removendo.`);
      psalmCache.delete(psalmNum);
    }
  }
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Use Google Search to retrieve the authentic, complete, exact biblical text of Psalm ${psalmNum} (Salmo ${psalmNum}) in Portuguese (Jo\xE3o Ferreira de Almeida translation, e.g. Corrigida, Atualizada, or Fiel). 

It is ABSOLUTAMENTE CR\xCDTICO que:
1. Cada vers\xEDculo seja real, aut\xEAntico e corresponda exatamente ao Salmo ${psalmNum} da B\xEDblia Sagrada tradicional (JFA). N\xE3o confunda com outros cap\xEDtulos ou salmos.
2. O texto seja completo e integral, sem resumos, sem abrevia\xE7\xF5es, sem omiss\xF5es de vers\xEDculos e sem alterar palavras.
3. A lista contenha todos os vers\xEDculos reais do Salmo ${psalmNum} em ordem crescente.

Retorne um objeto JSON contendo:
- "number": o n\xFAmero inteiro exato do salmo (${psalmNum})
- "title": o t\xEDtulo exato (ex: "Salmo ${psalmNum}")
- "theme": o tema teol\xF3gico ou devocional curto e inspirador do salmo
- "verses": array de objetos contendo os campos "number" (inteiro) e "text" (string com a tradu\xE7\xE3o aut\xEAntica JFA do vers\xEDculo).`;
      const executeWithRetry = async () => {
        let retries = 2;
        let delay = 1e3;
        while (true) {
          try {
            return await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                tools: [{ googleSearch: {} }],
                responseSchema: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    number: { type: import_genai.Type.INTEGER },
                    title: { type: import_genai.Type.STRING },
                    theme: { type: import_genai.Type.STRING },
                    verses: {
                      type: import_genai.Type.ARRAY,
                      items: {
                        type: import_genai.Type.OBJECT,
                        properties: {
                          number: { type: import_genai.Type.INTEGER },
                          text: { type: import_genai.Type.STRING }
                        },
                        required: ["number", "text"]
                      }
                    }
                  },
                  required: ["number", "title", "theme", "verses"]
                }
              }
            });
          } catch (error) {
            if (retries <= 0) throw error;
            console.warn(`Chamada ao Gemini falhou. Tentando novamente em ${delay}ms... Erro: ${error instanceof Error ? error.message : String(error)}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries--;
            delay *= 2;
          }
        }
      };
      const response = await executeWithRetry();
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        parsed.number = psalmNum;
        parsed.title = `Salmo ${psalmNum}`;
        psalmCache.set(psalmNum, parsed);
        try {
          fileCache[psalmNum] = parsed;
          import_fs.default.writeFileSync(CACHE_FILE, JSON.stringify(fileCache, null, 2), "utf-8");
        } catch (cacheErr) {
          console.error("[Cache] Erro ao gravar cache em arquivo:", cacheErr);
        }
        return res.json(parsed);
      }
    } catch (err) {
      console.warn(`Aviso: Falha tempor\xE1ria do Gemini para o Salmo ${psalmNum}, utilizando fallback de alta qualidade. Detalhes:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`Usando fallback offline para o Salmo ${psalmNum}`);
  const fallback = offlinePsalms[psalmNum] || generateOfflinePsalm(psalmNum);
  psalmCache.set(psalmNum, fallback);
  try {
    fileCache[psalmNum] = fallback;
    import_fs.default.writeFileSync(CACHE_FILE, JSON.stringify(fileCache, null, 2), "utf-8");
  } catch (cacheErr) {
    console.error("[Cache] Erro ao gravar cache de fallback em arquivo:", cacheErr);
  }
  return res.json(fallback);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
