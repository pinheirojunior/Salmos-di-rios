import React from "react";
import { X, Shield, Lock, Bell, Volume2, HardDrive, Smartphone, CheckCircle, Mail } from "lucide-react";
import { motion } from "motion/react";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        id="privacy-policy-card"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-white dark:bg-slate-900 border border-gold-accent/20 dark:border-gray-800 rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gold-cream/40 dark:bg-slate-950/40 border-b border-gold-accent/10 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gold-accent/10 rounded-xl">
              <Shield className="w-5 h-5 text-gold-accent" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-gray-800 dark:text-gray-100 leading-tight">
                Política de Privacidade
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Salmos Diários • LGPD & Google Play</p>
            </div>
          </div>
          <button
            id="privacy-policy-close-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="Fechar política de privacidade"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 font-sans text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-5 leading-relaxed scrollbar-thin select-text">
          <div className="text-center pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <h3 className="font-serif font-bold text-base text-gold-accent">
              Salmos Diários
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Última atualização: Agosto de 2026</p>
          </div>

          {/* 1. Introdução */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-accent flex-shrink-0" />
              1. Introdução e Objetivo
            </h4>
            <p>
              A sua privacidade é fundamental para nós. Esta Política de Privacidade descreve de forma transparente como o aplicativo <strong>Salmos Diários</strong> lida com as suas informações, garantindo conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) no Brasil e as diretrizes de privacidade de dados do Google Play Console.
            </p>
            <p>
              O <strong>Salmos Diários</strong> é um aplicativo destinado à leitura, reflexão e narração de Salmos bíblicos diários. Ele foi projetado para operar com o máximo respeito à privacidade do usuário.
            </p>
          </div>

          {/* 2. Dados Coletados e Armazenamento Local */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gold-accent flex-shrink-0" />
              2. Dados e Preferências Armazenados no Dispositivo
            </h4>
            <p>
              O aplicativo <strong>NÃO exige a criação de conta</strong> nem realiza o cadastro de e-mail, senha ou login social em servidores remotos. Todas as preferências do usuário são salvas <strong>exclusivamente de forma local no próprio dispositivo</strong>.
            </p>
            <p>As preferências salvas localmente incluem:</p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-xs text-gray-600 dark:text-gray-400">
              <li><strong>Nome do Usuário:</strong> Utilizado exclusivamente para personalizar saudações na tela principal (ex: <i>"Bom dia, Maria"</i>).</li>
              <li><strong>Tema do Aplicativo:</strong> Seleção visual de modo claro, escuro ou automático do sistema.</li>
              <li><strong>Tamanho da Fonte:</strong> Ajuste de tipografia para leitura confortável dos textos.</li>
              <li><strong>Preferências de Áudio e Narração:</strong> Velocidade de reprodução e escolha da voz (masculina ou feminina).</li>
              <li><strong>Horários das Notificações:</strong> Configurações dos lembretes diários (Matinal, Tarde, Noite).</li>
              <li><strong>Histórico e Salmos Favoritos:</strong> Marcações de leitura armazenadas localmente no aparelho.</li>
            </ul>
          </div>

          {/* Declaramos expressamente o que NÃO é coletado */}
          <div className="p-3 bg-amber-500/5 dark:bg-amber-950/20 border border-gold-accent/20 rounded-xl space-y-1.5">
            <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold-accent" />
              O que NÃO coletamos:
            </h5>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
              Declaramos expressamente que o aplicativo <strong>NÃO</strong> coleta, <strong>NÃO</strong> solicita e <strong>NÃO</strong> armazena: CPF, e-mail, número de telefone, localização via GPS, contatos, fotos, vídeos, mensagens, dados bancários, dados financeiros, dados médicos ou quaisquer informações pessoais sensíveis.
            </p>
          </div>

          {/* 3. Reprodução de Áudio e Narração */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gold-accent flex-shrink-0" />
              3. Recursos de Áudio e Narração
            </h4>
            <p>
              A narração dos Salmos é realizada utilizando o recurso nativo de conversão de texto em fala (Text-to-Speech) integrado ao próprio sistema operacional do seu dispositivo Android.
            </p>
            <p>
              O aplicativo <strong>NÃO utiliza o microfone do dispositivo</strong>, não grava voz e não escuta o ambiente. O recurso de áudio destina-se unicamente à reprodução de voz sintetizada dos textos bíblicos.
            </p>
          </div>

          {/* 4. Notificações Diárias */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold-accent flex-shrink-0" />
              4. Notificações Diárias Agendadas
            </h4>
            <p>
              O aplicativo disponibiliza um recurso opcional de lembrete diário para convidar o usuário à leitura dos Salmos.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-xs text-gray-600 dark:text-gray-400">
              <li>Os agendamentos são gerenciados localmente no dispositivo através de alarmes nativos do sistema Android.</li>
              <li>As notificações funcionam em segundo plano e mesmo com o aplicativo fechado.</li>
              <li>O usuário tem controle total para alterar os horários ou desativar completamente os lembretes a qualquer momento no menu de Configurações do aplicativo ou nas permissões do Android.</li>
            </ul>
          </div>

          {/* 5. Serviços de Terceiros e Anúncios (Google AdMob) */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gold-accent flex-shrink-0" />
              5. Anúncios e Serviços de Terceiros (Google AdMob)
            </h4>
            <p>
              Para manter o aplicativo gratuito e sustentar seu desenvolvimento continuo, utilizamos o serviço de publicidade <strong>Google AdMob</strong> (fornecido pela Google LLC).
            </p>
            <p>
              O Google AdMob e seus parceiros podem utilizar identificadores técnicos anônimos do dispositivo (como o Identificador de Publicidade do Android - GAID), endereço IP aproximado e dados de interação com anúncios para:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-xs text-gray-600 dark:text-gray-400">
              <li>Exibir anúncios relevantes ou não personalizados;</li>
              <li>Prevenir fraudes e medir a eficiência da veiculação de anúncios;</li>
              <li>Garantir a integridade do sistema.</li>
            </ul>
            <p className="text-xs">
              Para saber mais sobre como o Google gerencia os dados de anúncios, consulte a{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-accent underline font-semibold hover:opacity-80"
              >
                Política de Privacidade do Google
              </a>{" "}
              e as orientações do{" "}
              <a
                href="https://support.google.com/admob/answer/6128543"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-accent underline font-semibold hover:opacity-80"
              >
                Google AdMob
              </a>.
            </p>
          </div>

          {/* 6. Permissões do Aplicativo */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gold-accent flex-shrink-0" />
              6. Permissões Solicitadas no Android
            </h4>
            <p>O aplicativo solicita estritamente as permissões necessárias para o funcionamento dos seus recursos:</p>
            <div className="bg-gray-50 dark:bg-slate-950 p-3 rounded-xl space-y-2 border border-gray-100 dark:border-slate-800 text-xs">
              <div>
                <strong className="text-gray-800 dark:text-gray-200">INTERNET:</strong>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Necessária para o carregamento e exibição de anúncios via Google AdMob.</p>
              </div>
              <div>
                <strong className="text-gray-800 dark:text-gray-200">POST_NOTIFICATIONS (Android 13+):</strong>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Permite enviar os lembretes diários de leitura agendados pelo usuário.</p>
              </div>
              <div>
                <strong className="text-gray-800 dark:text-gray-200">RECEIVE_BOOT_COMPLETED:</strong>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Permite reagendar automaticamente os lembretes locais caso o celular seja reiniciado.</p>
              </div>
              <div>
                <strong className="text-gray-800 dark:text-gray-200">SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM:</strong>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Garante a pontualidade na exibição dos lembretes nos horários definidos.</p>
              </div>
            </div>
          </div>

          {/* 7. Armazenamento, Segurança e Exclusão de Dados */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold-accent flex-shrink-0" />
              7. Segurança e Direito de Exclusão dos Dados
            </h4>
            <p>
              Como todas as suas preferências ficam armazenadas apenas dentro do seu celular, você possui <strong>autonomia total e imediata sobre seus dados</strong>.
            </p>
            <p>Você pode apagar definitivamente todos os dados e configurações a qualquer momento:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-xs text-gray-600 dark:text-gray-400">
              <li>Acessando as <i>Configurações do Android &gt; Aplicativos &gt; Salmos Diários &gt; Armazenamento &gt; Limpar Dados</i>; ou</li>
              <li>Desinstalando o aplicativo do seu dispositivo.</li>
            </ol>
          </div>

          {/* 8. Alterações nesta Política */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              8. Alterações nesta Política de Privacidade
            </h4>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir eventuais melhorias nos recursos do aplicativo ou adequações regulatórias. A data da última versão sempre estará indicada no topo desta página.
            </p>
          </div>

          {/* 9. Contato do Desenvolvedor */}
          <div className="space-y-2 p-3.5 bg-gold-cream/30 dark:bg-slate-950/50 rounded-2xl border border-gold-accent/20">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold-accent flex-shrink-0" />
              9. Dúvidas e Contato
            </h4>
            <p className="text-xs">
              Se você tiver dúvidas, sugestões ou solicitações relacionadas a esta Política de Privacidade ou ao aplicativo <strong>Salmos Diários</strong>, entre em contato conosco através do e-mail oficial:
            </p>
            <p className="font-mono font-bold text-xs text-gold-accent text-center bg-white dark:bg-slate-900 py-1.5 px-3 rounded-lg border border-gold-accent/20 select-all">
              suporte.salmosdiarios@gmail.com
            </p>
          </div>

          <p className="pt-2 border-t border-gray-100 dark:border-gray-800/60 font-sans font-semibold text-xs text-center text-gold-accent">
            Ao utilizar o aplicativo Salmos Diários, você confirma estar ciente e de acordo com os termos desta Política de Privacidade.
          </p>
        </div>

        {/* Footer OK Button */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-sans">
            Salmos Diários • Privacidade Protegida
          </span>
          <button
            id="privacy-ok-btn"
            onClick={onClose}
            className="px-5 py-2 bg-gold-accent hover:bg-amber-600 text-white font-sans text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Ok, entendi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

