const { EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Importação direta do arquivo de habilidades
const habilidadesPath = path.join(__dirname, '../../utils/habilidades.js');
let listarTodasHabilidades;

try {
    if (fs.existsSync(habilidadesPath)) {
        const habilidadesModulo = require(habilidadesPath);
        listarTodasHabilidades = habilidadesModulo.listarTodasHabilidades;
        console.log('✅ Habilidades carregadas com sucesso!');
    } else {
        console.log('⚠️ Arquivo habilidades.js não encontrado em:', habilidadesPath);
    }
} catch (err) {
    console.error('❌ Erro ao carregar habilidades:', err);
}

// Função de fallback caso não consiga carregar as habilidades
function getHabilidadesFallback() {
    return {
        supremeDomain: { nome: 'Supreme Domain', emoji: '🕊️', tipo: 'interceptacao', estrelas: '★', efeito: 'Domínio supremo que intercepta chutes' },
        secondChance: { nome: 'Second Chance', emoji: '⚽️', tipo: 'chute', estrelas: '★', efeito: 'Segunda chance em chutes' },
        freestyle: { nome: 'Freestyle', emoji: '💫', tipo: 'drible', estrelas: '★', efeito: 'Drible com reroll' },
        agressiveDesarm: { nome: 'Agressive Desarm', emoji: '💢', tipo: 'desarme', estrelas: '★', efeito: 'Desarme agressivo' },
        rupture: { nome: 'Rupture', emoji: '📍', tipo: 'drible', estrelas: '★', efeito: 'Drible com avanço' },
        advanced1v1: { nome: 'Advanced 1v1', emoji: '🥋', tipo: 'interceptacao', estrelas: '★', efeito: 'Interceptação 1v1' },
        fakePass: { nome: 'Fake Pass', emoji: '🪄', tipo: 'drible', estrelas: '★', efeito: 'Drible com fake' },
        secondDefense: { nome: 'Second Defense', emoji: '🏃‍♀️', tipo: 'defesa', estrelas: '★', efeito: 'Reroll na defesa' },
        anxiety: { nome: 'Anxiety', emoji: '🙏🏻', tipo: 'fisico', estrelas: '★★', efeito: 'Físico com bônus' },
        simulacao: { nome: 'Simulação', emoji: '🤭', tipo: 'drible', estrelas: '★★', efeito: 'Simula falta' },
        chuteAzarao: { nome: 'Chute Azarão', emoji: '🫤', tipo: 'chute', estrelas: '★★', efeito: 'Chute azarado' },
        roleta: { nome: 'Roleta', emoji: '🪀', tipo: 'drible', estrelas: '★★', efeito: 'Drible roleta' },
        canhotinha: { nome: 'Canhotinha', emoji: '♣️', tipo: 'chute', estrelas: '★★', efeito: 'Chute canhoto' },
        enfiadaGostosa: { nome: 'Enfiada Gostosa', emoji: '⏱️', tipo: 'passe', estrelas: '★★', efeito: 'Passe enfiado' },
        powerShot: { nome: 'Power Shot', emoji: '🦵', tipo: 'chute', estrelas: '★★', efeito: 'Chute potente' },
        paredinha: { nome: 'Paredinha', emoji: '⛳️', tipo: 'defesa', estrelas: '★★', efeito: 'Defesa paredão' },
        crowAnalysis: { nome: 'Crow Analysis', emoji: '🐦‍⬛', tipo: 'desarme', estrelas: '★★★', efeito: 'Análise do corvo' },
        papaGol: { nome: 'Papa Gol', emoji: '😨', tipo: 'interceptacao', estrelas: '★★★', efeito: 'Rouba passes' },
        fakeShot: { nome: 'Fake Shot', emoji: '😵‍💫', tipo: 'chute', estrelas: '★★★', efeito: 'Fake shot' },
        chuteDireto: { nome: 'Chute Direto', emoji: '🧩', tipo: 'chute', estrelas: '★★★', efeito: 'Chute direto' },
        curveMax: { nome: 'Curve Max', emoji: '⤴️', tipo: 'chute', estrelas: '★★★', efeito: 'Chute curvo' },
        dribleMarionete: { nome: 'Drible Marionete', emoji: '💭', tipo: 'drible', estrelas: '★★★', efeito: 'Drible marionete' },
        ferroadaDoEscorpiao: { nome: 'Ferroada do Escorpião', emoji: '🦂', tipo: 'chute', estrelas: '★★★', efeito: 'Chute de calcanhar' },
        dribleSupersonico: { nome: 'Drible Supersônico', emoji: '💨', tipo: 'drible', estrelas: '★★★', efeito: 'Drible supersônico' },
        as: { nome: 'Ás', emoji: '🎃', tipo: 'desarme', estrelas: '★★★★', efeito: 'Marca um adversário' },
        absolutePhysics: { nome: 'Absolute Physics', emoji: '💪🏼', tipo: 'fisico', estrelas: '★★★★', efeito: 'Física absoluta' },
        kaiserBike: { nome: 'Kaiser Bike', emoji: '🕹️', tipo: 'chute', estrelas: '★★★★', efeito: 'Bicicleta do Kaiser' },
        defesaDoUrso: { nome: 'Defesa do Urso', emoji: '🐻', tipo: 'defesa', estrelas: '★★★★', efeito: 'Defesa poderosa' },
        dribbleKiller: { nome: 'Dribble Killer', emoji: '☠️', tipo: 'drible', estrelas: '★★★★', efeito: 'Drible mortal' },
        africaCrush: { nome: 'Africa Crush', emoji: '🇬🇭', tipo: 'chute', estrelas: '★★★★', efeito: 'Chute africano' },
        snakeIntercept: { nome: 'Snake Intercept', emoji: '🐍', tipo: 'interceptacao', estrelas: '★★★★', efeito: 'Interceptação serpente' },
        myNameIs: { nome: 'My Name Is...', emoji: '💤', tipo: 'chute', estrelas: '★★★★', efeito: 'Chute marcante' },
        twoGunVolley: { nome: 'Two Gun Volley', emoji: '🎯', tipo: 'chute', estrelas: '★★★★', efeito: 'Dois tiros' },
        kaiserImpact: { nome: 'Kaiser Impact', emoji: '🔘', tipo: 'chute', estrelas: '★★★★★', efeito: 'Impacto do Kaiser' },
        kaiserImpactMagnus: { nome: 'Kaiser Impact Magnus', emoji: '↪️', tipo: 'chute', estrelas: '★★★★★', efeito: 'Impacto Magnus' },
        passePerfeito: { nome: 'Passe Perfeito', emoji: '🏅', tipo: 'passe', estrelas: '★★★★★', efeito: 'Passe perfeito' },
        dribleRobotico: { nome: 'Drible Robotico', emoji: '🤖', tipo: 'drible', estrelas: '★★★★★', efeito: 'Drible robótico' },
        elasticoNutmeg: { nome: 'Elastico Nutmeg', emoji: '🪢', tipo: 'drible', estrelas: '★★★★★', efeito: 'Elástico nutmeg' },
        godspeed: { nome: 'Godspeed', emoji: '⚡️', tipo: 'velocidade', estrelas: '★★★★★', efeito: 'Velocidade divina' },
        verySlow: { nome: 'Very Slow', emoji: '⚡️', tipo: 'interceptacao', estrelas: '★★★★★', efeito: 'Intercepta tudo' },
        bigBang: { nome: 'Big Bang', emoji: '🌌', tipo: 'chute', estrelas: '★★★★★', efeito: 'Chute cósmico' },
        ginga: { nome: 'Ginga', emoji: '🎶', tipo: 'drible', estrelas: '★★★★★', efeito: 'Ginga brasileira' },
        goldenIntercept: { nome: 'Golden Intercept', emoji: '🪙', tipo: 'interceptacao', estrelas: '★★★★★', efeito: 'Interceptação dourada' },
        destroyerShot: { nome: 'Destroyer Shot', emoji: '🤬', tipo: 'chute', estrelas: '★★★★★', efeito: 'Chute destruidor' }
    };
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
                descricao: "Bônus fixos: +2 Chute, +2 Velocidade, +2 Drible\n\n> ➾ *__Estilo:__* Preciso, estratégico e consistente." 
            },
            { 
                nome: "Dominância Canhota", 
                raridade: "Raro", 
                descricao: "Bônus fixos: +3 Finalização, +3 Passe, +3 Domínio\n\n> ➾ *__Estilo:__* Criativo, imprevisível e refinado." 
            },
            { 
                nome: "Ambidestria Forçada", 
                raridade: "Lendário", 
                descricao: "Bônus fixos: +4 Chute, +4 Velocidade, +4 Força, +4 Desarme\n\n> ➾ *__Estilo:__* Versátil, poderoso e moldado por treino extremo." 
            },
            { 
                nome: "Dominância Ambidestra", 
                raridade: "Mítico", 
                descricao: "Bônus fixos: +4 em todos os rolls.\n\n> ➾ *__Estilo:__* Perfeito, fluido e natural — o auge absoluto da técnica." 
            }
        ];

        // ⭐ DONS
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

        // 🌀 ESTILOS
        const estilos = [
            { nome: "Artilheiro", raridade: "Comum", descricao: "+5 Finalização atacando.\n┃ㅤ・**__Passiva:__** Finalizar após dominar dá +4 adicional." },
            { nome: "Velocista", raridade: "Comum", descricao: "+4 Velocidade pelas laterais.\n┃ㅤ・**__Passiva:__** Vencer disputa de velocidade dá prioridade." },
            { nome: "Garçom", raridade: "Comum", descricao: "+5 Passe como meia.\n┃ㅤ・**__Passiva:__** Passes para aliados livres ganham +3." },
            { nome: "Marcador", raridade: "Comum", descricao: "+5 Marcação defendendo.\n┃ㅤ・**__Passiva:__** Marcados recebem -3 no Drible." },
            { nome: "Muralha", raridade: "Comum", descricao: "+4 Defesa e Interceptação.\n┃ㅤ・**__Passiva:__** Após interceptar, +5 no próximo roll defensivo." },
            { nome: "Urso", raridade: "Comum", descricao: "+6 Defesa defendendo.\n┃ㅤ・**__Passiva:__** +4 em disputas físicas e pivôs." },
            { nome: "Driblador", raridade: "Comum", descricao: "+5 Drible atacando.\n┃ㅤ・**__Passiva:__** Vencer drible por +10 derruba adversário." },
            { nome: "Biológico", raridade: "Comum", descricao: "+5 Finalização atacando.\n┃ㅤ・**__Passiva:__** Errar finalização dá +5 no próximo chute." },
            { nome: "Zumbi", raridade: "Comum", descricao: "+4 Marcação e Desarme.\n┃ㅤ・**__Passiva:__** Após perder desarme, pode tentar de novo após 1 ação." },
            { nome: "Maestro", raridade: "Comum", descricao: "+4 Drible e Passe.\n┃ㅤ・**__Passiva:__** 2 passes seguidos dão +6 no próximo drible/passe." },
            { nome: "Imperador", raridade: "Exclusivo", descricao: "+14 Finalização, +8 Presença Ofensiva.\n┃ㅤ・**__Passiva:__** Receber passe direto dá +10 no chute." },
            { nome: "Demônio", raridade: "Exclusivo", descricao: "+12 Chutes Acrobáticos, +8 Domínio.\n┃ㅤ・**__Passiva:__** Cada gol dá +3 permanente em Finalização na partida." },
            { nome: "Áureo", raridade: "Exclusivo", descricao: "+10 Passe, Drible e +5 Domínio.\n┃ㅤ・**__Passiva:__** Adversários abaixo do rank recebem -6." },
            { nome: "Rei", raridade: "Exclusivo", descricao: "+13 Finalização, +9 Força.\n┃ㅤ・**__Passiva:__** 2 aliados escolhidos recebem +3 Passe." },
            { nome: "Servo", raridade: "Exclusivo", descricao: "+12 Passe, +10 Drible.\n┃ㅤ・**__Passiva:__** Passes para aliado escolhido recebem +15." }
        ];

        // 👾 MONSTRO
        const monstros = [
            { 
                nome: "Monstro Adormecido", 
                raridade: "Mítico", 
                descricao: "Um instinto irracional vive escondido dentro de você.\n\n┃ㅤ・**__Passiva — Instinto Selvagem__**\n┃ㅤ➾ +5 em drible, velocidade e passe.\n┃\n┃ㅤ・**__Passiva — Leitura do Caos__**\n┃ㅤ➾ Enxerga rotas perfeitas. Pode ignorar 1 debuff por turno.\n┃\n┃ㅤ・**__Ativa — Drible Instintivo__**\n┃ㅤ➾ +10 no drible, -5 no desarme adversário (1x por partida)." 
            }
        ];

        // 🎖️ MAESTRIAS
        const maestrias = [
            { nome: "Maestria em Interceptação", raridade: "Exclusivo", descricao: "+4 interceptação.\n┃ㅤ・**__Passiva:__** Vencer por +15 deixa adversário em zoom." },
            { nome: "Maestria em Desarme", raridade: "Exclusivo", descricao: "+4 desarme.\n┃ㅤ・**__Passiva:__** Vencer por +15 deixa adversário em zoom." },
            { nome: "Maestria em Passes", raridade: "Exclusivo", descricao: "+4 passe.\n┃ㅤ・**__Ativa:__** 2x por partida, -3 na interceptação adversária." },
            { nome: "Maestria em Defesas", raridade: "Exclusivo", descricao: "+4 defesa.\n┃ㅤ・**__Ativa:__** 2x por partida, -3 no chute adversário." },
            { nome: "Maestria em Força", raridade: "Exclusivo", descricao: "+4 força.\n┃ㅤ・**__Passiva:__** Vencer físico por +15 deixa adversário em zoom." },
            { nome: "Maestria em Drible", raridade: "Exclusivo", descricao: "+4 drible.\n┃ㅤ・**__Passiva:__** Vencer por +15 deixa adversário em zoom." },
            { nome: "Maestria em Domínio", raridade: "Exclusivo", descricao: "+4 domínio.\n┃ㅤ・**__Passiva:__** Vencer por +15 deixa adversário em zoom." },
            { nome: "Maestria em Velocidade", raridade: "Exclusivo", descricao: "+4 velocidade.\n┃ㅤ・**__Passiva:__** Vencer disputa por +15 deixa adversário em zoom." },
            { nome: "Maestria em Finalização", raridade: "Exclusivo", descricao: "+4 finalização.\n┃ㅤ・**__Ativa:__** 2x por partida, -3 em interceptadores." }
        ];

        // ⚔️ ARMAS - PEGANDO TODAS AS HABILIDADES
        let armas = [];
        
        if (listarTodasHabilidades && typeof listarTodasHabilidades === 'function') {
            try {
                const habilidadesObj = listarTodasHabilidades();
                if (habilidadesObj && typeof habilidadesObj === 'object') {
                    armas = Object.values(habilidadesObj).map(hab => {
                        let raridade = "Comum";
                        const estrelas = hab.estrelas || "";
                        
                        if (estrelas === "★★★★★") raridade = "Mítico";
                        else if (estrelas === "★★★★") raridade = "Lendário";
                        else if (estrelas === "★★★") raridade = "Épico";
                        else if (estrelas === "★★") raridade = "Raro";
                        else raridade = "Comum";
                        
                        return {
                            nome: hab.nome,
                            raridade: raridade,
                            descricao: hab.efeito || "Uma habilidade poderosa para virar o jogo.",
                            emoji: hab.emoji || "⚔️",
                            tipo: hab.tipo || "geral"
                        };
                    });
                    console.log(`✅ ${armas.length} armas/habilidades carregadas!`);
                }
            } catch (err) {
                console.error("Erro ao carregar habilidades:", err);
                armas = getHabilidadesFallback();
                armas = Object.values(armas).map(hab => ({
                    nome: hab.nome,
                    raridade: "Comum",
                    descricao: hab.efeito || "Habilidade especial",
                    emoji: hab.emoji || "⚔️"
                }));
            }
        } else {
            console.log("⚠️ Usando fallback de habilidades");
            const fallback = getHabilidadesFallback();
            armas = Object.values(fallback).map(hab => ({
                nome: hab.nome,
                raridade: "Comum",
                descricao: hab.efeito || "Habilidade especial",
                emoji: hab.emoji || "⚔️"
            }));
        }

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

        // 🎲 SORTEIO
        let resultado = null;

        if (tipo === "dom") {
            if (Math.random() < 0.50) {
                resultado = {
                    nome: "Nenhum Dom",
                    raridade: "Comum",
                    descricao: "Seu ego permaneceu silencioso... Nenhum dom foi desperto ou descoberto nesta etapa do seu treinamento."
                };
            }
        } else if (tipo === "monstro") {
            if (Math.random() < 0.85) {
                resultado = {
                    nome: "Sem Monstro",
                    raridade: "Comum",
                    descricao: "A escuridão do campo continuou totalmente silenciosa. Nenhum monstro ou instinto interior respondeu ao seu egoísmo."
                };
            }
        }

        if (!resultado) {
            const random = Math.random() * 100;
            let raridadeSorteada = "Comum";

            if (tipo === "estilo") {
                if (random < 85) raridadeSorteada = "Comum";
                else raridadeSorteada = "Exclusivo";
            } else if (tipo === "maestria" || tipo === "maestrias") {
                raridadeSorteada = "Exclusivo";
            } else if (tipo === "arma") {
                if (random < 60) raridadeSorteada = "Comum";
                else if (random < 85) raridadeSorteada = "Raro";
                else if (random < 96) raridadeSorteada = "Épico";
                else if (random < 99.5) raridadeSorteada = "Lendário";
                else raridadeSorteada = "Mítico";
            } else {
                if (random < 80) raridadeSorteada = "Comum";
                else if (random < 95) raridadeSorteada = "Raro";
                else if (random < 99) raridadeSorteada = "Épico";
                else if (random < 99.8) raridadeSorteada = "Lendário";
                else raridadeSorteada = "Mítico";
            }

            let itensFiltrados = pool.filter(item => item.raridade === raridadeSorteada);
            if (itensFiltrados.length === 0) {
                itensFiltrados = pool;
            }
            resultado = itensFiltrados[Math.floor(Math.random() * itensFiltrados.length)];
        }

        // Configuração estética
        const dadosRaridade = {
            Comum: { cor: 0x95a5a6, badge: "Comum", emoji: "⚪", chance: tipo === "dom" ? "50%" : tipo === "monstro" ? "85%" : tipo === "estilo" ? "85%" : "80%", fraseFinal: "✨ Continue treinando firme para lapidar seu talento!" },
            Raro: { cor: 0x3498db, badge: "Rara", emoji: "🔵", chance: "15%", fraseFinal: "✨ Excelente! Um elemento raro foi adicionado ao seu arsenal!" },
            Épico: { cor: 0x9b59b6, badge: "Épica", emoji: "🟣", chance: "4%", fraseFinal: "✨ Incrível! Você obteve um item de grande destaque!" },
            Lendário: { cor: 0xf1c40f, badge: "Lendária", emoji: "👑", chance: tipo === "arma" ? "4%" : "0.8%", fraseFinal: "👑 Excepcional! Um potencial de estrela absoluta acaba de despertar!" },
            Mítico: { cor: 0xe74c3c, badge: "Mítica", emoji: "🔥", chance: tipo === "arma" ? "0.5%" : tipo === "monstro" ? "15%" : "0.2%", fraseFinal: "🔥 Lendário! Você acaba de despertar o instinto absoluto do campo!" },
            Exclusivo: { cor: 0xe74c3c, badge: "Exclusiva", emoji: "😈", chance: "15%", fraseFinal: "🔥 Incrível! Você obteve uma especialização técnica monstruosa!" }
        };

        const config = dadosRaridade[resultado.raridade] || dadosRaridade.Comum;
        const emojiFinal = resultado.emoji || config.emoji;

        // 1. Embed de carregamento
        const embedGiro = new EmbedBuilder()
            .setColor('#1F2026')
            .setAuthor({ name: `🎲 ROLETA • ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTitle(`🎰 PROCESSANDO ATRIBUTOS...`)
            .setDescription(`⠀⌣⠀︵  ฺ  Sorteando seu elemento da categoria **${nomeFormatado}**...\nBoa sorte, Egoísta!`)
            .setImage(gifGiro)
            .setFooter({ text: '✦ Blue lock: Apex Flow • Desperte o seu instinto!' });

        const msg = await message.reply({ embeds: [embedGiro] });

        // 2. Transição
        setTimeout(() => {
            embedGiro
                .setTitle('🔮 MENTALIZANDO O CAMPO DE JOGO...')
                .setDescription(`⠀⌣⠀︵  ฺ  *Conectando-se ao fluxo absoluto...*\n✨✨✨`);
            msg.edit({ embeds: [embedGiro] }).catch(() => {});
        }, 1200);

        // 3. Resultado final
        setTimeout(() => {
            const tipoChave = (tipo === "família" || tipo === "familia") ? "familia" 
                            : (tipo === "dons" || tipo === "dom") ? "dom" 
                            : (tipo === "dominância" || tipo === "dominancia") ? "dominancia" 
                            : (tipo === "maestrias" || tipo === "maestria") ? "maestria"
                            : tipo;
            
            const embedFinal = new EmbedBuilder()
                .setColor(config.cor)
                .setDescription(
                    `> 死 \`${emojiFinal}\`001〡『*__${resultado.nome}__*』︶・₊˚\n\n` +
                    `➢ ${resultado.descricao}\n\n` +
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