const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// 📊 SISTEMA DE RANKING E PDR
// ==========================================

const ranks = [
    { nome: "Anônimo", emoji: "🌱", pdrMin: 0, limiteStatus: 15, armas: 1, maestrias: 1, individualidades: 2, cor: "#808080" },
    { nome: "Municipal", emoji: "🏘️", pdrMin: 400, limiteStatus: 20, armas: 1, maestrias: 1, individualidades: 2, cor: "#00FF00" },
    { nome: "Estadual", emoji: "🏟️", pdrMin: 800, limiteStatus: 25, armas: 1, maestrias: 2, individualidades: 3, cor: "#0099FF" },
    { nome: "Regional", emoji: "🌎", pdrMin: 1200, limiteStatus: 30, armas: 1, maestrias: 3, individualidades: 3, cor: "#4169E1" },
    { nome: "Nacional", emoji: "🇧🇷", pdrMin: 1350, limiteStatus: 45, armas: 1, maestrias: 4, individualidades: 4, cor: "#50C878" },
    { nome: "Continental", emoji: "🌍", pdrMin: 1550, limiteStatus: 50, armas: 2, maestrias: 5, individualidades: 6, cor: "#C0A050" },
    { nome: "New Gen", emoji: "🌟", pdrMin: 1850, limiteStatus: 55, armas: 2, maestrias: 5, individualidades: 7, cor: "#FFD700" },
    { nome: "Mundial", emoji: "👑", pdrMin: 2050, limiteStatus: 70, armas: 3, maestrias: 7, individualidades: 8, cor: "#FF4500" }
];

// ==========================================
// 📊 BÔNUS POR POSIÇÃO
// ==========================================
const bonusPosicao = {
    "Goleiro": { defesaGk: 4, interceptacao: 2, desc: "Proteger o gol e impedir finalizações" },
    "Lateral": { velocidade: 3, drible: 3, passe: 2, desc: "Apoiar defesa e ataque pelas pontas" },
    "Zagueiro": { desarme: 4, fisico: 4, interceptacao: 2, desc: "Impedir ataques e dominar o jogo físico" },
    "Volante": { velocidade: 3, fisico: 3, desarme: 2, desc: "Controlar o meio-campo com resistência" },
    "Meia Defensivo": { passe: 4, interceptacao: 4, desc: "Interceptar e distribuir jogadas" },
    "Meio Ofensivo": { dominio: 4, passe: 4, drible: 2, desc: "Criar jogadas ofensivas" },
    "Centro Avante": { finalizacao: 5, fisico: 4, dominio: 2, desc: "Finalização e presença na área" },
    "Segundo Atacante": { finalizacao: 4, dominio: 3, drible: 3, velocidade: 3, desc: "Criar espaço e acompanhar o ataque" },
    "Pontas": { drible: 5, velocidade: 4, finalizacao: 2, desc: "Quebrar linhas defensivas com explosão" }
};

// ==========================================
// 📊 BÔNUS POR UNIVERSIDADE
// ==========================================
const bonusUniversidade = {
    "Kurogane": { velocidade: 3, fisico: 3, estilo: "Físico, explosivo, transições rápidas" },
    "Seiryu": { passe: 3, drible: 3, estilo: "Técnico, criativo, controle de bola" },
    "Raiden": { finalizacao: 3, interceptacao: 3, estilo: "Híbrido ofensivo-defensivo" },
    "Genshō": { defesaGk: 3, fisico: 3, estilo: "Defensivo dominante, físico e contenção" },
    "Tenshō": { finalizacao: 3, dominio: 3, estilo: "Precisão, tomada de decisão" },
    "Arashi": { drible: 3, desarme: 3, estilo: "Agressivo, caótico, pressão e recuperação" },
    "Shiden": { velocidade: 3, drible: 3, estilo: "Extremo ofensivo, explosão individual" },
    "Ryuketsu": { finalizacao: 3, fisico: 3, estilo: "Finalizador bruto, potência máxima" },
    "Hakuryu": { passe: 3, defesaGk: 3, estilo: "Suporte tático, leitura de jogo" }
};

// ==========================================
// 📊 BÔNUS POR NACIONALIDADE
// ==========================================
const bonusNacionalidade = {
    "Japonês": { dominio: 4, passe: 4, desc: "Disciplinado, preciso, controle de jogo" },
    "Francês": { drible: 5, velocidade: 4, finalizacao: 2, desc: "Elegante, veloz, imprevisível" },
    "Espanhol": { finalizacao: 5, drible: 3, passe: 2, desc: "Técnico, criativo, letal" },
    "Argentino": { passe: 4, desarme: 3, desc: "Criação e marcação" },
    "Italiano": { desc: "8 pontos livres +1 em todos os rolls no 2º tempo" },
    "Alemão": { finalizacao: 4, dominio: 3, desarme: 3, interceptacao: 2, desc: "Eficiente, disciplinado, letal" },
    "Brasileiro": { drible: 5, velocidade: 4, finalizacao: 2, desc: "Criativo, alegre, imprevisível no drible" }
};

// ==========================================
// 📊 BÔNUS POR DOMINÂNCIA
// ==========================================
const bonusDominancia = {
    "Destro": { finalizacao: 2, velocidade: 2, drible: 2, desc: "Preciso, estratégico e consistente" },
    "Canhoto": { finalizacao: 3, passe: 3, dominio: 3, desc: "Criativo, imprevisível e refinado" },
    "Ambidestria Forçada": { finalizacao: 4, velocidade: 4, fisico: 4, desarme: 4, desc: "Versátil, poderoso, moldado por treino extremo" },
    "Ambidestro": { desc: "+4 em todos os rolls - O auge da técnica" }
};

function formatarNumero(valor) {
    return `\`${valor.toString().padStart(2, ' ')}\``;
}

function getRankAtual(pdr) {
    let rankAtual = ranks[0];
    for (const rank of ranks) {
        if (pdr >= rank.pdrMin) rankAtual = rank;
    }
    return rankAtual;
}

function getProximoRank(pdr) {
    for (const rank of ranks) {
        if (pdr < rank.pdrMin) return rank;
    }
    return null;
}

module.exports = {
    name: 'estatisticas',
    description: 'Mostra estatísticas, PDR, ranking e bônus do jogador',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        if (!dados.jogadores[target.id]) {
            return message.reply('❌ Jogador não encontrado!');
        }
        
        const jogador = dados.jogadores[target.id];
        if (!jogador.estatisticas) {
            jogador.estatisticas = { gols: 0, assistencias: 0, passes: 0, dribles: 0, desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, vitorias: 0, pdr: 0 };
        }
        if (jogador.estatisticas.pdr === undefined) jogador.estatisticas.pdr = 0;
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        
        // Buscar cargos
        function encontrarCargo(lista) {
            if (!membro) return null;
            const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
            for (const nome of listaOrdenada) {
                const cargo = membro.roles.cache.find(r => r.name.toLowerCase().includes(nome.toLowerCase()));
                if (cargo) return nome;
            }
            return null;
        }
        
        const posicao = encontrarCargo(["Goleiro", "Lateral", "Zagueiro", "Volante", "Meia Defensivo", "Meio Ofensivo", "Centro Avante", "Segundo Atacante", "Pontas"]);
        const nacionalidade = encontrarCargo(["Brasileiro", "Alemão", "Italiano", "Argentino", "Espanhol", "Francês", "Japonês"]);
        const universidade = encontrarCargo(["Kurogane", "Seiryu", "Raiden", "Genshō", "Tenshō", "Arashi", "Shiden", "Ryuketsu", "Hakuryu"]);
        const dominancia = encontrarCargo(["Ambidestria Forçada", "Ambidestro", "Destro", "Canhoto"]);
        
        const pdr = jogador.estatisticas.pdr || 0;
        const rankAtual = getRankAtual(pdr);
        const proximoRank = getProximoRank(pdr);
        
        const imagemEstat = jogador.imagem || perfil_padrao;
        
        // ==========================================
        // MONTAR TEXTO
        // ==========================================
        let texto = 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${jogador.nome || target.username} • Blue Lock*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        
        // 🏆 RANKING
        texto += 
            `> ˚ ˳ ﹙🏆﹚***__Ranking__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__Rank Atual__** —  \`${rankAtual.emoji} ${rankAtual.nome}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💠 ⦘**  **__PDR Total__** —  \`${pdr}\`\n`;
        
        if (proximoRank) {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__Próximo Rank__** —  \`${proximoRank.emoji} ${proximoRank.nome} (faltam ${proximoRank.pdrMin - pdr} PDR)\`\n`;
        }
        
        texto += 
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Limite Status__** —  \`${rankAtual.limiteStatus}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`${rankAtual.armas}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📜 ⦘**  **__Maestrias__** —  \`${rankAtual.maestrias}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__Individualidades__** —  \`${rankAtual.individualidades}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        
        // ⚽ BÔNUS ATIVOS
        texto += `> ˚ ˳ ﹙⚽﹚***__Bônus Ativos__*** *(Cargos do Discord)*\n\n`;
        
        if (posicao && bonusPosicao[posicao]) {
            const b = bonusPosicao[posicao];
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Posição: ${posicao}__**\n`;
            texto += `> │   📝 ${b.desc}\n`;
            if (b.finalizacao) texto += `> │   🦵 Finalização +${b.finalizacao}\n`;
            if (b.drible) texto += `> │   ✨ Drible +${b.drible}\n`;
            if (b.passe) texto += `> │   ☄️ Passe +${b.passe}\n`;
            if (b.velocidade) texto += `> │   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.fisico) texto += `> │   💪 Físico +${b.fisico}\n`;
            if (b.desarme) texto += `> │   🛡️ Desarme +${b.desarme}\n`;
            if (b.interceptacao) texto += `> │   🎯 Interceptação +${b.interceptacao}\n`;
            if (b.defesaGk) texto += `> │   🧱 Defesa GK +${b.defesaGk}\n`;
            if (b.dominio) texto += `> │   ⚽ Domínio +${b.dominio}\n`;
            texto += `\n`;
        }
        
        if (nacionalidade && bonusNacionalidade[nacionalidade]) {
            const b = bonusNacionalidade[nacionalidade];
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ 🌍 ⦘**  **__Nacionalidade: ${nacionalidade}__**\n`;
            texto += `> │   📝 ${b.desc}\n`;
            if (b.finalizacao) texto += `> │   🦵 Finalização +${b.finalizacao}\n`;
            if (b.drible) texto += `> │   ✨ Drible +${b.drible}\n`;
            if (b.passe) texto += `> │   ☄️ Passe +${b.passe}\n`;
            if (b.velocidade) texto += `> │   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.dominio) texto += `> │   ⚽ Domínio +${b.dominio}\n`;
            if (b.desarme) texto += `> │   🛡️ Desarme +${b.desarme}\n`;
            if (b.interceptacao) texto += `> │   🎯 Interceptação +${b.interceptacao}\n`;
            texto += `\n`;
        }
        
        if (universidade && bonusUniversidade[universidade]) {
            const b = bonusUniversidade[universidade];
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏫 ⦘**  **__Universidade: ${universidade}__**\n`;
            texto += `> │   📝 Estilo: ${b.estilo}\n`;
            if (b.finalizacao) texto += `> │   🦵 Finalização +${b.finalizacao}\n`;
            if (b.drible) texto += `> │   ✨ Drible +${b.drible}\n`;
            if (b.passe) texto += `> │   ☄️ Passe +${b.passe}\n`;
            if (b.velocidade) texto += `> │   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.fisico) texto += `> │   💪 Físico +${b.fisico}\n`;
            if (b.desarme) texto += `> │   🛡️ Desarme +${b.desarme}\n`;
            if (b.interceptacao) texto += `> │   🎯 Interceptação +${b.interceptacao}\n`;
            if (b.defesaGk) texto += `> │   🧱 Defesa GK +${b.defesaGk}\n`;
            if (b.dominio) texto += `> │   ⚽ Domínio +${b.dominio}\n`;
            texto += `\n`;
        }
        
        if (dominancia && bonusDominancia[dominancia]) {
            const b = bonusDominancia[dominancia];
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦶 ⦘**  **__Dominância: ${dominancia}__**\n`;
            texto += `> │   📝 ${b.desc}\n`;
            if (b.finalizacao) texto += `> │   🦵 Finalização +${b.finalizacao}\n`;
            if (b.drible) texto += `> │   ✨ Drible +${b.drible}\n`;
            if (b.passe) texto += `> │   ☄️ Passe +${b.passe}\n`;
            if (b.velocidade) texto += `> │   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.fisico) texto += `> │   💪 Físico +${b.fisico}\n`;
            if (b.desarme) texto += `> │   🛡️ Desarme +${b.desarme}\n`;
            if (b.dominio) texto += `> │   ⚽ Domínio +${b.dominio}\n`;
            texto += `\n`;
        }
        
        if (!posicao && !nacionalidade && !universidade && !dominancia) {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ❌ ⦘**  **__Nenhum bônus ativo__** —  \`Consiga cargos para receber bônus!\`\n\n`;
        }
        
        texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        
        // 📊 ESTATÍSTICAS DE JOGO
        texto += 
            `> ˚ ˳ ﹙⚽﹚***__Estatísticas de Jogo__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Gols__** —  ${formatarNumero(jogador.estatisticas.gols || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Assistências__** —  ${formatarNumero(jogador.estatisticas.assistencias || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Dribles__** —  ${formatarNumero(jogador.estatisticas.dribles || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Desarmes__** —  ${formatarNumero(jogador.estatisticas.desarmes || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Interceptações__** —  ${formatarNumero(jogador.estatisticas.interceptacoes || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧤 ⦘**  **__Defesas__** —  ${formatarNumero(jogador.estatisticas.defesas || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__Partidas__** —  ${formatarNumero(jogador.estatisticas.partidas || 0)}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__Vitórias__** —  ${formatarNumero(jogador.estatisticas.vitorias || 0)}\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Continue jogando para aumentar seu PDR e subir de rank!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor(rankAtual.cor)
            .setAuthor({ name: `⚽ ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('˚ ˳ ﹙📊﹚***__ESTATÍSTICAS DO JOGADOR__***')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemEstat)
            .setFooter({ text: `⚽ Blue Lock • Rank: ${rankAtual.nome} | PDR: ${pdr}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};