import React from "react";
import { X, Shield } from "lucide-react";
import { motion } from "motion/react";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        id="privacy-policy-card"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-white dark:bg-slate-900 border border-gold-accent/20 dark:border-gray-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gold-cream/40 dark:bg-slate-950/40 border-b border-gold-accent/10 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold-accent" />
            <h2 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">
              Política de Privacidade
            </h2>
          </div>
          <button
            id="privacy-policy-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="Fechar política de privacidade"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 font-serif text-sm text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed scrollbar-thin select-text">
          <div className="text-center pb-2 border-b border-gray-100 dark:border-gray-800/60">
            <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100">
              Salmos do Dia
            </h3>
            <p className="text-xs text-gray-400 mt-1">Última atualização: Julho de 2026</p>
          </div>

          <p>
            O aplicativo <strong>Salmos do Dia</strong> respeita a privacidade dos seus usuários e tem como objetivo proporcionar uma experiência de leitura e reflexão diária dos Salmos.
          </p>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              1. Informações coletadas
            </h4>
            <p>
              Para personalizar a experiência dentro do aplicativo, podemos solicitar o nome do usuário no primeiro acesso.
            </p>
            <p>
              O nome informado é utilizado exclusivamente para exibir mensagens personalizadas dentro do aplicativo, como:
            </p>
            <blockquote className="border-l-2 border-gold-accent/40 pl-3 italic text-gray-500 dark:text-gray-400 text-xs">
              "Bom dia, Maria"<br />
              "Boa tarde, Maria"
            </blockquote>
            <p>
              O aplicativo não utiliza o nome do usuário para divulgação, venda ou compartilhamento com terceiros.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              2. Armazenamento de dados
            </h4>
            <p>
              As informações fornecidas pelo usuário podem ser armazenadas localmente no dispositivo para manter as preferências do aplicativo.
            </p>
            <p>
              O usuário pode remover seus dados desinstalando o aplicativo ou utilizando as opções disponíveis dentro do aplicativo, quando existentes.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              3. Dados de uso
            </h4>
            <p>
              O aplicativo poderá utilizar serviços de terceiros, como ferramentas de análise e publicidade, que podem coletar informações técnicas não identificáveis, como:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
              <li>modelo do dispositivo;</li>
              <li>versão do sistema operacional;</li>
              <li>informações de desempenho do aplicativo;</li>
              <li>dados de interação com anúncios.</li>
            </ul>
            <p>
              Essas informações ajudam a melhorar o funcionamento do aplicativo e oferecer uma melhor experiência.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              4. Publicidade
            </h4>
            <p>
              O aplicativo poderá utilizar o serviço Google AdMob para exibição de anúncios.
            </p>
            <p>
              O Google poderá utilizar identificadores do dispositivo e informações relacionadas ao uso do aplicativo para fornecer anúncios personalizados ou não personalizados, conforme as configurações do usuário e as políticas do Google.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              5. Compartilhamento de informações
            </h4>
            <p>
              O aplicativo não vende, comercializa ou compartilha informações pessoais dos usuários com terceiros, exceto quando necessário para funcionamento de serviços integrados ou quando exigido por lei.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              6. Segurança
            </h4>
            <p>
              Buscamos utilizar boas práticas para proteger as informações dos usuários e proporcionar uma experiência segura.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              7. Alterações nesta política
            </h4>
            <p>
              Esta Política de Privacidade poderá ser atualizada periodicamente para refletir melhorias no aplicativo ou mudanças legais.
            </p>
            <p>
              Recomendamos que o usuário consulte esta página regularmente.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm">
              8. Contato
            </h4>
            <p>
              Caso tenha dúvidas sobre esta Política de Privacidade, entre em contato pelo canal disponibilizado na página oficial do aplicativo.
            </p>
          </div>

          <p className="pt-2 border-t border-gray-100 dark:border-gray-800/60 font-sans font-semibold text-xs text-center text-gold-accent">
            Ao utilizar o aplicativo Salmos do Dia, o usuário declara estar de acordo com esta Política de Privacidade.
          </p>
        </div>

        {/* Footer OK Button */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-100 dark:border-gray-800 text-right">
          <button
            id="privacy-ok-btn"
            onClick={onClose}
            className="px-5 py-2 bg-gold-accent hover:bg-amber-600 text-white font-sans text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Ok, entendi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
