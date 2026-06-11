const { EmbedBuilder } = require('discord.js');
const path = require('path');

// Importação ajustada para o local correto indicado: 'habilidades.js' na raiz ou nível correspondente
let listarTodasHabilidades;
try {
  const habilidadesModulo = require('../../habilidades.js');
  listarTodasHabilidades = habilidadesModulo.listarTodasHabilidades;
} catch (e) {
  try {
    const habilidadesModulo = require('./habilidades.js');
    listarTodasHabilidades = habilidadesModulo.listarTodasHabilidades;
  } catch (err) {
    console.error("⚠️ Não foi possível encontrar habilidades.js automaticamente. Usando fallback de segurança.");
  }
}

module.exports = {
  name: 'roll',
  description: '🎰 Desafie seu ego e girem características lendárias para o seu jogador!',

  async execute(message, args) {
    const tipo = args[0]?.toLowerCase();

    if (!tipo) {
      const embedAjuda = new EmbedBuilder()
        .setColor('#00AAFF')
        .setTitle('꒰ა 🎰 ฺ SISTEMA DE ROLLS ฺ ໒꒱⸝⸝')
        .setDescription('⠀⌣⠀︵  ฺ  Escolha uma das categorias de treino para despertar o seu potencial:')
        .addFields(
          { name: '╋ « 👥 » Família', value: '`c!roll familia`', inline: true },
          { name: '╋ « 🧠 » Dons', value: '`c!roll dom`', inline: true },
          { name: '╋ « 👣 » Dominância', value: '`c!roll dominancia`', inline: true },
          { name: '╋ « ⚔️ » Arma', value: '`c!roll arma`', inline: true },
          { name: '╋ « 🌀 » Estilo', value: '`c!roll estilo`', inline: true },
          { name: '╋ « 👾 » Monstro', value: '`c!roll monstro`', inline: true },
          { name: '╋ « 🎖️ » Maestria', value: '`c!roll maestria`', inline: true }
        )
        .setFooter({ text: '✦ Blue lock: Apex Flow • Desperte o seu instinto!' })
        .setTimestamp();

      return message.reply({ embeds: [embedAjuda] });
    }

    // 👨‍👩‍👧 FAMÍLIAS
    const familias = [
      { nome: "Agi", raridade: "Comum" },
      { nome: "Aiku", raridade: "Lendário" },
      { nome: "Aryu", raridade: "Épico" },
      { nome: "Bachira", raridade: "Épico" },
      { nome: "Barou", raridade: "Lendário" },
      { nome: "Chevalier", raridade: "Mítico" },
      { nome: "Chigiri", raridade: "Épico" },
      { nome: "Darai", raridade: "Épico" },
      { nome: "Fukaku", raridade: "Comum" },
      { nome: "Gagamaru", raridade: "Lendário" },
      { nome: "Hiori", raridade: "Lendário" },
      { nome: "Hugo", raridade: "Mítico" },
      { nome: "Igaguri", raridade: "Raro" },
      { nome: "Iglesias", raridade: "Mítico" },
      { nome: "Ikki", raridade: "Raro" },
      { nome: "Isagi", raridade: "Lendário" },
      { nome: "Itoshi", raridade: "Mítico" },
      { nome: "Kaiser", raridade: "Mítico" },
      { nome: "Karasu", raridade: "Raro" },
      { nome: "Kiyora", raridade: "Raro" },
      { nome: "Kunigami", raridade: "Épico" },
      { nome: "Kurona", raridade: "Raro" },
      { nome: "Loki", raridade: "Mítico" },
      { nome: "Lorenzo", raridade: "Mítico" },
      { nome: "Mikage", raridade: "Lendário" },
      { nome: "Nagi", raridade: "Lendário" },
      { nome: "Naruhaya", raridade: "Comum" },
      { nome: "Ness", raridade: "Lendário" },
      { nome: "Onazi", raridade: "Lendário" },
      { nome: "Otoya", raridade: "Épico" },
      { nome: "Shidou", raridade: "Mítico" },
      { nome: "Tokimitsu", raridade: "Raro" },
      { nome: "Yukimiya", raridade: "Épico" }
    ];

    // 👑 DOMINÂNCIAS DOS PÉS
    const dominancias = [
      { 
        nome: "Dominância Destra", 
        raridade: "Comum", 
        descricao: "Bônus fixos: +2 Chute, +2 Velocidade, +2 Drible (ou alternativa defensiva: +2 Defesa, +2 Desarme, +2 Marcação).\n\n> ➾ *__Estilo:__* Preciso, estratégico e consistente." 
      },
      { 
        nome: "Dominância Canhota", 
        raridade: "Raro", 
        descricao: "Bônus fixos: +3 Finalização, +3 Passe, +3 Domínio (ou alternativa de velocidade: +3 Velocidade no lugar de um; ou alternativa defensiva: +3 Defesa, +3 Interceptação, +3 Marcação/Desarme).\n\n> ➾ *__Estilo:__* Criativo, imprevisível e refinado." 
      },
      { 
        nome: "Ambidestria Forçada", 
        raridade: "Lendário", 
        descricao: "Bônus fixos: +4 Chute, +4 Velocidade, +4 Força, +4 Desarme.\n\n> ➾ *__Estilo:__* Versátil, poderoso e moldado por treino extremo." 
      },
      { 
        nome: "Dominância Ambidestra", 
        raridade: "Mítico", 
        descricao: "Bônus fixos: +4 em todos os rolls.\n\n> ➾ *__Estilo:__* Perfeito, fluido e natural — o auge absoluto da técnica." 
      }
    ];

    // ⭐ DONS (Com descrições completas)
    const dons = [
      { 
        nome: "Gênio", 
        raridade: "Épico", 
        descricao: "Gênios nasceram acima da média, possuindo leitura de jogo absurda, adaptação instantânea e talento natural impossível de copiar.\n\n┃ㅤ・**__Passiva — Talento Absoluto__**\n┃ㅤ➾ Reduz em -60% o tempo de treinos. Recebe +6 pontos iniciais para distribuir e ganha +2 pontos livres a cada vitória oficial. Durante o Fluxo, todos os buffs recebem +2 adicionais.\n┃\n┃ㅤ・**__Ativa — Leitura Genial__**\n┃ㅤ➾ Uma vez por partida, o jogador pode prever completamente uma ação adversária, recebendo prioridade absoluta na disputa e anulando buffs menores do oponente." 
      },
      { 
        nome: "Aprendiz Talentoso", 
        raridade: "Raro", 
        descricao: "Sua força está em sua capacidade monstruosa de adaptação, conseguindo evoluir constantemente através das derrotas, pressão e experiências adquiridas.\n\n┃ㅤ・**__Passiva — Evolução Adaptativa__**\n┃ㅤ➾ Reduz em -45% o tempo dos treinos. Recebe +2 pontos livres a cada derrota oficial e, sempre que estiver sofrendo debuffs ou sendo devorado, ganha +8 no próximo roll.\n┃\n┃ㅤ・**__Ativa — Evolução Instantânea__**\n┃ㅤ➾ Uma vez por partida, após perder uma disputa, o jogador pode repetir imediatamente a ação com +10 no roll." 
      },
      { 
        nome: "Prodígio", 
        raridade: "Mítico", 
        descricao: "Uma verdadeira anomalia genética. Seu corpo nasceu absurdamente desenvolvido para um atributo específico, ultrapassando os limites normais.\n\n┃ㅤ・**__Passiva — Corpo Mutante__**\n┃ㅤ➾ Reduz em -35% o tempo de treinos. O maior atributo do usuário recebe +8 permanente e todas as disputas envolvendo este atributo aplicam -5 automaticamente no roll adversário.\n┃\n┃ㅤ・**__Ativa — Mutação__**\n┃ㅤ➾ Uma vez por partida, o jogador pode dobrar os bônus do seu maior atributo durante 2 turnos. Caso esteja em Fluxo, recebe +3 extras em todas as ações envolvendo seu atributo principal." 
      }
    ];

    // 🌀 ESTILOS (Comuns & Exclusivos com passivas)
    const estilos = [
      // === COMUNS ===
      { 
        nome: "Artilheiro", raridade: "Comum", 
        descricao: "Recebe +5 em Finalização quando estiver atuando ofensivamente.\n\n┃ㅤ・**__Passiva — Instinto de Gol__**\n┃ㅤ➾ Caso finalize após dominar a bola no mesmo turno, recebe +4 adicional no chute." 
      },
      { 
        nome: "Velocista", raridade: "Comum", 
        descricao: "Recebe +4 em Velocidade atuando pelas laterais ou pontas.\n\n┃ㅤ・**__Passiva — Arrancada Relâmpago__**\n┃ㅤ➾ Ao vencer disputas de velocidade, ganha prioridade automática no próximo movimento." 
      },
      { 
        nome: "Garçom", raridade: "Comum", 
        descricao: "Recebe +5 em Passe jogando como meia ou volante.\n\n┃ㅤ・**__Passiva — Visão de Campo__**\n┃ㅤ➾ Passes feitos para aliados livres recebem +3 adicional automaticamente." 
      },
      { 
        nome: "Marcador", raridade: "Comum", 
        descricao: "Recebe +5 em Marcação atuando defensivamente.\n\n┃ㅤ・**__Passiva — Pressão Constante__**\n┃ㅤ➾ Jogadores marcados por você recebem -3 em Drible." 
      },
      { 
        nome: "Muralha", raridade: "Comum", 
        descricao: "Recebe +4 Defesa e +4 Interceptação em posições defensivas.\n\n┃ㅤ・**__Passiva — Corpo Fechado__**\n┃ㅤ➾ Após interceptar uma bola, recebe +5 no próximo roll defensivo." 
      },
      { 
        nome: "Urso", raridade: "Comum", 
        descricao: "Recebe +6 em Defesa quando atua defensivamente.\n\n┃ㅤ・**__Passiva — Peso Brutal__**\n┃ㅤ➾ Ganha +4 em disputas físicas e pivôs." 
      },
      { 
        nome: "Driblador", raridade: "Comum", 
        descricao: "Recebe +5 em Drible atuando ofensivamente ou como meia.\n\n┃ㅤ・**__Passiva — Gingado Natural__**\n┃ㅤ➾ Caso vença um drible por +10 ou mais, o adversário perde prioridade no setor." 
      },
      { 
        nome: "Biológico", raridade: "Comum", 
        descricao: "Recebe +5 em Finalização jogando ofensivamente.\n\n┃ㅤ・**__Passiva — Adaptação Corporal__**\n┃ㅤ➾ Após errar uma finalização, ganha +5 no próximo chute da partida." 
      },
      { 
        nome: "Zumbi", raridade: "Comum", 
        descricao: "Recebe +4 Marcação e +4 Desarme em posições defensivas.\n\n┃ㅤ・**__Passiva — Persistência Mortal__**\n┃ㅤ➾ Mesmo após perder um desarme, pode tentar novamente depois de apenas 1 ação." 
      },
      { 
        nome: "Maestro", raridade: "Comum", 
        descricao: "Recebe +4 Drible e +4 Passe atuando como meia ou atacante.\n\n┃ㅤ・**__Passiva — Ritmo Perfeito__**\n┃ㅤ➾ Após completar dois passes seguidos, recebe +6 no próximo drible ou passe." 
      },
      // === EXCLUSIVOS ===
      { 
        nome: "Imperador", raridade: "Exclusivo", 
        descricao: "Recebe +14 em Finalização e +8 em Presença Ofensiva.\n\n┃ㅤ・**__Passiva — Domínio Absoluto__**\n┃ㅤ➾ Sempre que receber um passe diretamente, ganha +10 no chute daquela jogada." 
      },
      { 
        nome: "Demônio", raridade: "Exclusivo", 
        descricao: "Recebe +12 em Chutes Acrobáticos e +8 em Domínio.\n\n┃ㅤ・**__Passiva — Ego Insano__**\n┃ㅤ➾ Cada gol marcado concede +3 permanente em Finalização até o fim da partida." 
      },
      { 
        nome: "Áureo", raridade: "Exclusivo", 
        descricao: "Recebe +10 Passe, +10 Drible e +5 Domínio.\n\n┃ㅤ・**__Passiva — Perfeição Natural__**\n┃ㅤ➾ Adversários abaixo do seu rank recebem -6 ao tentar marcar ou interceptar você." 
      },
      { 
        nome: "Rei", raridade: "Exclusivo", 
        descricao: "Recebe +13 em Finalização e +9 em Força.\n\n┃ㅤ・**__Passiva — Autoridade Suprema__**\n┃ㅤ➾ Escolha dois aliados no início da partida; eles recebem +3 em Passe ao jogar com você." 
      },
      { 
        nome: "Servo", raridade: "Exclusivo", 
        descricao: "Recebe +12 Passe e +10 Drible.\n\n┃ㅤ・**__Passiva — Devoção Absoluta__**\n┃ㅤ➾ Escolha um aliado; passes feitos para ele recebem +15 e ignoram debuffs de distância." 
      }
    ];

    // 👾 MONSTRO ADORMECIDO (Único Tipo, Extremamente Raro!)
    const monstros = [
      { 
        nome: "Monstro Adormecido", 
        raridade: "Mítico", 
        descricao: "Um instinto irracional vive escondido dentro de você, uma entidade guiada pela obsessão absoluta do futebol instintivo.\n\n┃ㅤ・**__Ativação__**\n┃ㅤ➾ Defensores: 2 desarmes/interceptações.\n┃ㅤ➾ Meias: 2 assistências/dominações.\n┃ㅤ➾ Atacantes: 2 dribles/finalizações.\n┃ㅤ➾ Duração: Desperta por 4 turnos.\n┃\n┃ㅤ・**__Passiva — Instinto Selvagem__**\n┃ㅤ➾ +5 em drible, velocidade e passe. Opositores recebem -3 no primeiro confronto direto do turno.\n┃\n┃ㅤ・**__Passiva — Leitura do Caos__**\n┃ㅤ➾ Enxerga rotas perfeitas. Pode ignorar 1 debuff de marcação/pressão por turno.\n┃\n┃ㅤ・**__Ativa — Drible Instintivo__**\n┃ㅤ➾ Próximo drible recebe +10 no roll e reduz em -5 desarmes. Se vencer, ganha prioridade no setor por 1 turno (1x por partida)." 
      }
    ];

    // 🎖️ MAESTRIAS
    const maestrias = [
      { nome: "Maestria em Interceptação", raridade: "Exclusivo", descricao: "+4 em rolls de interceptação.\n\n> ➾ *__Passiva:__* Se vencer o roll por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Desarme", raridade: "Exclusivo", descricao: "+4 em rolls de desarme.\n\n> ➾ *__Passiva:__* Se vencer o roll por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Passes", raridade: "Exclusivo", descricao: "+4 em rolls de passe.\n\n> ➾ *__Ativa:__* 2x por partida, debuffa a interceptação adversária em -3." },
      { nome: "Maestria em Defesas", raridade: "Exclusivo", descricao: "+4 em rolls de defesa.\n\n> ➾ *__Ativa:__* 2x por partida, debuffa o chute do adversário em -3." },
      { nome: "Maestria em Força", raridade: "Exclusivo", descricao: "+4 em rolls de força.\n\n> ➾ *__Passiva:__* Se vencer o roll físico por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Drible", raridade: "Exclusivo", descricao: "+4 em rolls de drible.\n\n> ➾ *__Passiva:__* Se vencer o roll por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Domínio", raridade: "Exclusivo", descricao: "+4 em rolls de domínio.\n\n> ➾ *__Passiva:__* Se vencer o roll por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Velocidade", raridade: "Exclusivo", descricao: "+4 em rolls de velocidade.\n\n> ➾ *__Passiva:__* Se vencer a disputa de velocidade por +15, deixa o adversário em zoom por 2 turnos." },
      { nome: "Maestria em Finalização", raridade: "Exclusivo", descricao: "+4 em rolls de finalização.\n\n> ➾ *__Ativa:__* 2x por partida, debuffa interceptadores em -3." }
    ];

    // ⚔️ ARMAS (Buscando e mapeando as raridades dinamicamente com base nas estrelas)
    let listaHabilidades = [];
    if (typeof listarTodasHabilidades === 'function') {
      try {
        const resultadoHabilidades = listarTodasHabilidades();
        if (resultadoHabilidades && typeof resultadoHabilidades === 'object') {
          listaHabilidades = Object.values(resultadoHabilidades).map(hab => {
            let raridade = "Comum";
            const estrelas = hab.estrelas || "";

            // Mapeamento de estrelas para raridade
            if (estrelas === "★★★★★") raridade = "Mítico";
            else if (estrelas === "★★★★") raridade = "Lendário";
            else if (estrelas === "★★★") raridade = "Épico";
            else if (estrelas === "★★") raridade = "Raro";
            else raridade = "Comum";

            return {
              nome: hab.nome,
              raridade: raridade,
              descricao: hab.efeito || "Uma habilidade poderosa para virar o jogo."
            };
          });
        }
      } catch (err) {
        console.error("Erro ao carregar habilidades:", err);
      }
    }

    if (listaHabilidades.length === 0) {
      listaHabilidades = [
        { nome: "Chute de Trivela", raridade: "Raro", descricao: "Um belíssimo chute com três dedos que faz uma curva acentuada." },
        { nome: "Drible Elástico", raridade: "Épico", descricao: "Drible ágil e elástico para quebrar a coluna do marcador." },
        { nome: "Cabeceio Preciso", raridade: "Comum", descricao: "Subida aérea certeira visando o canto do gol." },
        { nome: "Controle de Bola", raridade: "Lendário", descricao: "Domínio milimétrico capaz de prender a bola sob pressão extrema." }
      ];
    }

    const armas = listaHabilidades;

    // 🎯 CONFIGURAÇÃO DAS IMAGENS DOS CARDS
    const imagensCard = {
      familia: "https://i.pinimg.com/736x/eb/5c/c7/eb5cc7015c9430dc284e5b6d1dd573d6.jpg",
      dom: "https://i.pinimg.com/736x/eb/e0/31/ebe031b7299baa37276613d6141a60d0.jpg",
      dominancia: "https://i.pinimg.com/736x/5a/73/9e/5a739e22dd38b1dfcb2e292f2928ce81.jpg",
      arma: "https://i.pinimg.com/736x/92/e5/61/92e561e5754283a3c6eca18685ffd050.jpg",
      estilo: "https://i.pinimg.com/736x/8e/e7/db/8ee7dbdc3a9199884a1d4f421e87c984.jpg",
      monstro: "https://i.pinimg.com/736x/91/56/ab/9156ab02011d6fbec0d7d1e19911d274.jpg",
      maestria: "https://i.pinimg.com/736x/23/a4/c0/23a4c012f74af69dd0288a65552dfb5a.jpg"
    };

    const gifGiro = "https://i.pinimg.com/originals/16/50/76/165076da0295092260bba9f9ddd2e720.gif";

    let pool = [];
    let nomeFormatado = "";

    if (tipo === "familia" || tipo === "família") {
      pool = familias;
      nomeFormatado = "Família";
    } else if (tipo === "dom" || tipo === "dons") {
      pool = dons;
      nomeFormatado = "Dom";
    } else if (tipo === "dominancia" || tipo === "dominância") {
      pool = dominancias;
      nomeFormatado = "Dominância";
    } else if (tipo === "arma") {
      pool = armas;
      nomeFormatado = "Arma";
    } else if (tipo === "estilo") {
      pool = estilos;
      nomeFormatado = "Estilo";
    } else if (tipo === "monstro") {
      pool = monstros;
      nomeFormatado = "Monstro";
    } else if (tipo === "maestria" || tipo === "maestrias") {
      pool = maestrias;
      nomeFormatado = "Maestria";
    } else {
      return message.reply("❌ Categoria inválida! Use: `familia` | `dom` | `dominancia` | `arma` | `estilo` | `monstro` | `maestria`");
    }

    if (pool.length === 0) {
      return message.reply("❌ Nenhuma opção disponível nesta categoria no momento!");
    }

    // ==========================================
    // 🎲 CÁLCULO E SORTEIO DO RESULTADO
    // ==========================================
    
    let resultado = null;

    // --- SISTEMA DE FALHA (Sem Dom / Sem Monstro) ---
    if (tipo === "dom") {
      // 50% de chance de não vir nada
      if (Math.random() < 0.50) {
        resultado = {
          nome: "Nenhum Dom",
          raridade: "Comum",
          descricao: "Seu ego permaneceu silencioso... Nenhum dom foi desperto ou descoberto nesta etapa do seu treinamento."
        };
      }
    } else if (tipo === "monstro") {
      // 85% de chance de não vir nada (Monstro Adormecido é extremamente raro)
      if (Math.random() < 0.85) {
        resultado = {
          nome: "Sem Monstro",
          raridade: "Comum",
          descricao: "A escuridão do campo continuou totalmente silenciosa. Nenhum monstro ou instinto interior respondeu ao seu egoísmo."
        };
      }
    }

    // Se não falhou (ou é outra categoria), realiza o sorteio normal
    if (!resultado) {
      const random = Math.random() * 100;
      let raridadeSorteada = "Comum";

      if (tipo === "estilo") {
        // Estilos têm apenas Comum (85%) e Exclusivo (15%)
        if (random < 85) raridadeSorteada = "Comum";
        else raridadeSorteada = "Exclusivo";
      } else if (tipo === "maestria" || tipo === "maestrias") {
        // Maestrias são sempre Exclusivas (Especialização de Elite)
        raridadeSorteada = "Exclusivo";
      } else {
        // Distribuição Geral Padrão
        if (random < 80) raridadeSorteada = "Comum";
        else if (random < 95) raridadeSorteada = "Raro";
        else if (random < 99) raridadeSorteada = "Épico";
        else if (random < 99.8) raridadeSorteada = "Lendário";
        else raridadeSorteada = "Mítico";
      }

      // Filtra o pool pela raridade sorteada
      let itensFiltrados = pool.filter(item => item.raridade === raridadeSorteada);

      // Fallback se não houver itens específicos dessa raridade no pool
      if (itensFiltrados.length === 0) {
        itensFiltrados = pool;
      }

      resultado = itensFiltrados[Math.floor(Math.random() * itensFiltrados.length)];
    }

    // Configuração Estética por Raridade
    const dadosRaridade = {
      Comum: { 
        cor: 0x95a5a6, 
        badge: "Comum", 
        emoji: "⚪",
        chance: tipo === "dom" ? "50%" : tipo === "monstro" ? "85%" : tipo === "estilo" ? "85%" : "80%", 
        textoHype: "libertando seu ego para a evolução",
        fraseFinal: "✨ Continue treinando firme para lapidar seu talento!"
      },
      Raro: { 
        cor: 0x3498db, 
        badge: "Rara", 
        emoji: "🔵",
        chance: "15%", 
        textoHype: "libertando seu ego para a evolução",
        fraseFinal: "✨ Excelente! Um elemento raro foi adicionado ao seu arsenal!"
      },
      Épico: { 
        cor: 0x9b59b6, 
        badge: "Épica", 
        emoji: "🟣",
        chance: "4%", 
        textoHype: "libertando seu ego para a evolução",
        fraseFinal: "✨ Incrível! Você obteve um item de grande destaque!"
      },
      Lendário: { 
        cor: 0xf1c40f, 
        badge: "Lendária", 
        emoji: "👑",
        chance: "0.8%", 
        textoHype: "libertando seu ego para a evolução",
        fraseFinal: "👑 Excepcional! Um potencial de estrela absoluta acaba de despertar!"
      },
      Mítico: { 
        cor: 0xe74c3c, 
        badge: "Mítica", 
        emoji: "🔥",
        chance: tipo === "monstro" ? "15%" : "0.2%", 
        textoHype: "Libertando seu ego diamante bruto e cheio de talento",
        fraseFinal: "🔥 Lendário! Você acaba de despertar o instinto absoluto do campo!"
      },
      Exclusivo: {
        cor: 0xe74c3c,
        badge: "Exclusiva",
        emoji: "😈",
        chance: tipo === "maestria" || tipo === "maestrias" ? "100%" : "15%",
        textoHype: "Libertando seu ego diamante bruto e cheio de talento",
        fraseFinal: "🔥 Incrível! Você obteve uma especialização técnica monstruosa!"
      }
    };

    const config = dadosRaridade[resultado.raridade] || { 
      cor: 0x95a5a6, 
      badge: "Desconhecido", 
      emoji: "🎲",
      chance: "100%", 
      textoHype: "libertando seu ego para a evolução", 
      fraseFinal: "✨ Sorteio concluído!" 
    };

    // Ajuste da descrição do item
    const descricaoItem = resultado.descricao ? resultado.descricao : config.textoHype;

    // 1. EMBED DE CARREGAMENTO (Animação de Giro)
    const embedGiro = new EmbedBuilder()
      .setColor('#1F2026')
      .setAuthor({ name: `🎲 ROLETA • ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTitle(`🎰 PROCESSANDO ATRIBUTOS...`)
      .setDescription(`⠀⌣⠀︵  ฺ  Sorteando seu elemento da categoria **${nomeFormatado}**...\nBoa sorte, Egoísta!`)
      .setImage(gifGiro)
      .setFooter({ text: '✦ Blue lock: Apex Flow • Desperte o seu instinto!' });

    const msg = await message.reply({ embeds: [embedGiro] });

    // 2. TRANSIÇÃO DE SUSPENSE RÁPIDA (Conexão do Fluxo)
    setTimeout(() => {
      embedGiro
        .setTitle('🔮 MENTALIZANDO O CAMPO DE JOGO...')
        .setDescription(`⠀⌣⠀︵  ฺ  *Conectando-se ao fluxo absoluto...*\n✨✨✨`);
      
      msg.edit({ embeds: [embedGiro] }).catch(() => {});
    }, 1200);

    // 3. REVELAÇÃO DO CARD EMBELEZADO COM O MOLDE DESIGNADO
    setTimeout(() => {
      const tipoChave = (tipo === "família" || tipo === "familia") ? "familia" 
                      : (tipo === "dons" || tipo === "dom") ? "dom" 
                      : (tipo === "dominância" || tipo === "dominancia") ? "dominancia" 
                      : (tipo === "maestrias" || tipo === "maestria") ? "maestria"
                      : tipo;
      
      const embedFinal = new EmbedBuilder()
        .setColor(config.cor)
        .setDescription(
          `> 死 \`${config.emoji}\`001〡『*__${resultado.nome}__*』︶・₊˚\n\n` +
          `➢ ${descricaoItem}\n\n` +
          `> ➾ Jogador: <@${message.author.id}>\n\n` +
          `┃ㅤ・**__${nomeFormatado}__**\n` +
          `┃ㅤ➢ *__Raridade:__* \`${config.badge}\`\n` +
          `┃ㅤ➾ *__Chance:__* \`${config.chance}\`\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━\n\n` +
          `${config.fraseFinal}`
        )
        .setImage(imagensCard[tipoChave] || imagensCard.arma)
        .setThumbnail("https://i.pinimg.com/originals/16/50/76/165076da0295092260bba9f9ddd2e720.gif")
        .setFooter({ text: '⚡ Sintonizado • ⊹⊱•••《 Blue lock: Apex Flow 》•••⊰⊹' })
        .setTimestamp();

      msg.edit({ embeds: [embedFinal] }).catch(() => {});
    }, 2800);
  }
};