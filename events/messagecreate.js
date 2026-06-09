const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

// ==========================================
// 📜 CONSTANTES DO BLUE LOCK (DEFINIDAS AQUI)
// ==========================================

// Status base dos jogadores
const STATUS_PADRAO = {
    finalizacao: 0,
    passe: 0,
    desarme: 0,
    drible: 0,
    velocidade: 0,
    fisico: 0,
    interceptacao: 0,
    defesaGk: 0,
    dominio: 0
};

// Posições de futebol
const POSICOES = {
    goleiro: { nome: "🧤 Goleiro", bonus: { defesaGk: 10, interceptacao: 5 } },
    zagueiro: { nome: "🛡️ Zagueiro", bonus: { desarme: 8, interceptacao: 8, fisico: 5 } },
    lateral: { nome: "⚡ Lateral", bonus: { velocidade: 8, passe: 5, desarme: 5 } },
    volante: { nome: "🔄 Volante", bonus: { passe: 8, desarme: 7, fisico: 5 } },
    meia: { nome: "✨ Meia", bonus: { passe: 10, drible: 8, dominio: 5 } },
    atacante: { nome: "⚽ Atacante", bonus: { finalizacao: 10, drible: 8, velocidade: 5 } }
};

// EGOS disponíveis
const EGOS = {
    aprisionamento: {
        nome: "死 ⚽ Ego Individualista: Aprisionamento",
        bonus: { finalizacao: 5, passe: 10, desarme: 35, drible: 0, velocidade: 15, fisico: 30, interceptacao: 10, defesaGk: 0, dominio: 5 },
        habilidades: ["🔒 Corrente Invisível: O oponente marcado perde -5 em rolls de drible e passe", "⛓️ Quebra de Fluxo: 1x por partida, anula ativação de fluxo adversária e aplica -3 no roll"]
    },
    estrategico: {
        nome: "死 🧠 Ego Holístico: Estratégico",
        bonus: { finalizacao: 10, passe: 30, desarme: 15, drible: 5, velocidade: 10, fisico: 10, interceptacao: 25, defesaGk: 0, dominio: 20 },
        habilidades: ["♟️ Jogada Antecipada: +4 em interceptações e desarmes contra oponentes já enfrentados", "🔄 Reset Tático: 1x a cada 2 jogos, refaz uma ação falha com reroll mantendo o melhor resultado"]
    },
    determinado: {
        nome: "死 🔗 Ego Holístico: Determinado",
        bonus: { finalizacao: 15, passe: 15, desarme: 10, drible: 10, velocidade: 15, fisico: 15, interceptacao: 10, defesaGk: 0, dominio: 20 },
        habilidades: ["🎯 Marcador Infalível: +3 em rolls contra rival definido (+5 se vencer 3 duelos seguidos)", "💠 Sacrifício Determinado: 1x a cada 3 partidas, +8 em um roll crítico"]
    }
};

const LISTA_EGOS = ["aprisionamento", "estrategico", "determinado"];
const NOMES_EGOS = {
    aprisionamento: "⚽ Ego Individualista: Aprisionamento",
    estrategico: "🧠 Ego Holístico: Estratégico",
    determinado: "🔗 Ego Holístico: Determinado"
};

const PERNAS = ["🦵 Destro", "🦶 Canhoto", "🦿 Ambidestro"];
const ROLLS = ["estilo", "familia", "ego", "perna", "prodigio", "talento", "armas", "estilo-fisico", "dons", "monstro", "dominancia"];

// ==========================================
// 📦 FUNÇÕES AUXILIARES
// ==========================================

function loadJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
        return JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
    } catch (e) { return {}; }
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadBlueLock() {
    return loadJSON('./blueLock.json');
}

function saveBlueLock(data) {
    saveJSON('./blueLock.json', data);
}

function getJogador(id, dados = null) {
    const blueData = dados || loadBlueLock();
    if (!blueData.jogadores) blueData.jogadores = {};
    if (!blueData.jogadores[id]) {
        blueData.jogadores[id] = {
            id: id,
            nome: "Novato",
            posicao: "meia",
            ego: null,
            perna: "🦵 Destro",
            rolls: {
                estilo: null, familia: null, ego: null, perna: null, prodigio: 0,
                talento: null, armas: null, "estilo-fisico": null, dons: null, monstro: null, dominancia: null
            },
            status: { ...STATUS_PADRAO },
            estatisticas: { gols: 0, assistencias: 0, passes: 0, dribles: 0, desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, vitorias: 0 },
            egosDesbloqueados: [],
            egoAtivo: null
        };
    }
    return blueData.jogadores[id];
}

function formatarTempo(ms) {
    const horas = Math.floor(ms / 3600000);
    const minutos = Math.floor((ms % 3600000) / 60000);
    return `${horas}h ${minutos}m`;
}

// ==========================================
// 📥 MESSAGE CREATE
// ==========================================

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        
        const prefix = 'c!';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        // 🔥 CONTEXTO PARA OS COMANDOS (CORRIGIDO)
        const context = {
            loadBlueLock,
            saveBlueLock,
            getJogador,
            formatarTempo,
            STATUS_PADRAO,
            POSICOES,
            EGOS,
            LISTA_EGOS,
            NOMES_EGOS,
            PERNAS,
            ROLLS
        };
        
        try {
            await command.execute(message, args, client, context);
        } catch (error) {
            console.error(`[ERRO] ${commandName}:`, error);
            await message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Ocorreu um erro ao executar este comando.')] });
        }
    }
};