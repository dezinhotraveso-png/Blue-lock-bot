const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const pesosPosicoes = {
    "Goleiro": { defesaGk: 0.70, fisico: 0.15, desarme: 0.05, interceptacao: 0.05, velocidade: 0.03, passe: 0.01, finalizacao: 0.01, drible: 0.00, dominio: 0.00 },
    "Lateral": { velocidade: 0.25, desarme: 0.20, fisico: 0.15, drible: 0.15, passe: 0.15, interceptacao: 0.05, finalizacao: 0.03, defesaGk: 0.01, dominio: 0.01 },
    "Zagueiro": { desarme: 0.30, fisico: 0.25, interceptacao: 0.20, velocidade: 0.10, passe: 0.08, finalizacao: 0.03, drible: 0.02, defesaGk: 0.01, dominio: 0.01 },
    "Volante": { desarme: 0.20, passe: 0.20, fisico: 0.15, interceptacao: 0.15, velocidade: 0.10, drible: 0.10, finalizacao: 0.05, defesaGk: 0.03, dominio: 0.02 },
    "Meia Defensivo": { passe: 0.25, desarme: 0.20, interceptacao: 0.15, fisico: 0.15, drible: 0.10, velocidade: 0.10, finalizacao: 0.03, defesaGk: 0.01, dominio: 0.01 },
    "Meio Ofensivo": { passe: 0.30, drible: 0.25, finalizacao: 0.15, velocidade: 0.15, dominio: 0.05, fisico: 0.05, interceptacao: 0.03, desarme: 0.01, defesaGk: 0.01 },
    "Centro Avante": { finalizacao: 0.40, fisico: 0.20, drible: 0.15, velocidade: 0.10, dominio: 0.05, passe: 0.05, interceptacao: 0.03, desarme: 0.01, defesaGk: 0.01 },
    "Segundo Atacante": { finalizacao: 0.25, drible: 0.25, velocidade: 0.20, passe: 0.15, dominio: 0.05, fisico: 0.05, interceptacao: 0.03, desarme: 0.01, defesaGk: 0.01 },
    "Pontas": { velocidade: 0.30, drible: 0.30, finalizacao: 0.15, passe: 0.10, dominio: 0.05, fisico: 0.05, interceptacao: 0.03, desarme: 0.01, defesaGk: 0.01 },
    "livre": { finalizacao: 0.15, drible: 0.15, velocidade: 0.15, fisico: 0.15, passe: 0.15, desarme: 0.10, interceptacao: 0.10, defesaGk: 0.02, dominio: 0.03 }
};

const posicaoNomes = ["Goleiro", "Lateral", "Zagueiro", "Volante", "Meia Defensivo", "Meio Ofensivo", "Centro Avante", "Segundo Atacante", "Pontas"];

const emojiAtributos = {
    finalizacao: "🦵", drible: "✨", passe: "☄️", desarme: "🛡️",
    velocidade: "⚡", fisico: "💪", interceptacao: "🎯", defesaGk: "🧱", dominio: "⚽"
};

function getRankingInfo(overall) {
    if (overall >= 90) return { estrelas: "★★★★★", cor: "#FFD700", nome: "Lenda", emoji: "👑" };
    if (overall >= 85) return { estrelas: "★★★★☆", cor: "#C0A050", nome: "Especialista", emoji: "🔥" };
    if (overall >= 80) return { estrelas: "★★★★", cor: "#50C878", nome: "Destaque", emoji: "✨" };
    if (overall >= 75) return { estrelas: "★★★☆", cor: "#4169E1", nome: "Bom Jogador", emoji: "📈" };
    if (overall >= 70) return { estrelas: "★★★", cor: "#9370DB", nome: "Regular", emoji: "⚡" };
    if (overall >= 65) return { estrelas: "★★☆", cor: "#FFA500", nome: "Promessa", emoji: "🌟" };
    if (overall >= 60) return { estrelas: "★★", cor: "#FF8C00", nome: "Iniciante", emoji: "📊" };
    if (overall >= 50) return { estrelas: "★☆", cor: "#CD853F", nome: "Amador", emoji: "🕊️" };
    return { estrelas: "★", cor: "#808080", nome: "Novato", emoji: "🌱" };
}

module.exports = {
    name: 'overall',
    description: 'Mostra o overall do jogador baseado na posição (estilo FIFA)',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        if (!dados.jogadores[target.id]) {
            return message.reply('❌ Jogador não encontrado!');
        }
        
        const jogador = dados.jogadores[target.id];
        if (!jogador.status) {
            jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
        }
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        
        // Posição: roll > cargo
        const cargoPosicao = membro?.roles.cache.find(r => posicaoNomes.includes(r.name));
        const posicao = jogador.posicao || cargoPosicao?.name || "livre";
        
        const pesos = pesosPosicoes[posicao] || pesosPosicoes["livre"];
        const nomePosicao = posicao;
        
        // Bônus de armas (cargo + roll)
        const bonusArmas = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
        
        const todasHabilidades = listarTodasHabilidades();
        
        // Verifica arma do roll
        if (jogador.rolls?.armas && jogador.rolls.armas !== "Nenhuma") {
            for (const [key, hab] of Object.entries(todasHabilidades)) {
                if (hab.nome.toLowerCase() === jogador.rolls.armas.toLowerCase() && hab.bonus) {
                    if (hab.bonus.finalizacao) bonusArmas.finalizacao += hab.bonus.finalizacao;
                    if (hab.bonus.drible) bonusArmas.drible += hab.bonus.drible;
                    if (hab.bonus.passe) bonusArmas.passe += hab.bonus.passe;
                    if (hab.bonus.desarme) bonusArmas.desarme += hab.bonus.desarme;
                    if (hab.bonus.velocidade) bonusArmas.velocidade += hab.bonus.velocidade;
                    if (hab.bonus.fisico) bonusArmas.fisico += hab.bonus.fisico;
                    if (hab.bonus.interceptacao) bonusArmas.interceptacao += hab.bonus.interceptacao;
                    if (hab.bonus.defesaGk) bonusArmas.defesaGk += hab.bonus.defesaGk;
                    if (hab.bonus.dominio) bonusArmas.dominio += hab.bonus.dominio;
                }
            }
        }
        
        // Verifica arma do cargo
        if (membro) {
            const cargoArma = membro.roles.cache.find(r => {
                for (const [key, hab] of Object.entries(todasHabilidades)) {
                    if (hab.nome.toLowerCase() === r.name.toLowerCase()) return true;
                }
                return false;
            });
            
            if (cargoArma) {
                for (const [key, hab] of Object.entries(todasHabilidades)) {
                    if (hab.nome.toLowerCase() === cargoArma.name.toLowerCase() && hab.bonus) {
                        if (hab.bonus.finalizacao) bonusArmas.finalizacao += hab.bonus.finalizacao;
                        if (hab.bonus.drible) bonusArmas.drible += hab.bonus.drible;
                        if (hab.bonus.passe) bonusArmas.passe += hab.bonus.passe;
                        if (hab.bonus.desarme) bonusArmas.desarme += hab.bonus.desarme;
                        if (hab.bonus.velocidade) bonusArmas.velocidade += hab.bonus.velocidade;
                        if (hab.bonus.fisico) bonusArmas.fisico += hab.bonus.fisico;
                        if (hab.bonus.interceptacao) bonusArmas.interceptacao += hab.bonus.interceptacao;
                        if (hab.bonus.defesaGk) bonusArmas.defesaGk += hab.bonus.defesaGk;
                        if (hab.bonus.dominio) bonusArmas.dominio += hab.bonus.dominio;
                    }
                }
            }
        }
        
        const statusTotal = {
            finalizacao: (jogador.status.finalizacao || 0) + bonusArmas.finalizacao,
            drible: (jogador.status.drible || 0) + bonusArmas.drible,
            passe: (jogador.status.passe || 0) + bonusArmas.passe,
            desarme: (jogador.status.desarme || 0) + bonusArmas.desarme,
            velocidade: (jogador.status.velocidade || 0) + bonusArmas.velocidade,
            fisico: (jogador.status.fisico || 0) + bonusArmas.fisico,
            interceptacao: (jogador.status.interceptacao || 0) + bonusArmas.interceptacao,
            defesaGk: (jogador.status.defesaGk || 0) + bonusArmas.defesaGk,
            dominio: (jogador.status.dominio || 0) + bonusArmas.dominio
        };
        
        let overall = 0;
        let atributosDetalhados = [];
        
        for (const [atributo, peso] of Object.entries(pesos)) {
            const valor = statusTotal[atributo] || 0;
            const contribuicao = valor * peso;
            overall += contribuicao;
            
            if (peso > 0.01) {
                atributosDetalhados.push({
                    nome: atributo,
                    valor: valor,
                    base: jogador.status[atributo] || 0,
                    bonus: bonusArmas[atributo] || 0,
                    peso: peso,
                    contribuicao: contribuicao
                });
            }
        }
        
        overall = Math.round(overall);
        atributosDetalhados.sort((a, b) => b.contribuicao - a.contribuicao);
        
        const rankingInfo = getRankingInfo(overall);
        const imagemStatus = jogador.imagem || perfil_padrao;
        
        let texto = 
            `˚ ˳ ﹙🏆﹚***__OVERALL DO JOGADOR__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${jogador.nome || target.username} • Análise de Desempenho*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙📊﹚***__Overall__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Posição__** —  \`${nomePosicao}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__OVERALL__** —  \`${overall} ${rankingInfo.estrelas}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏅 ⦘**  **__Ranking__** —  \`${rankingInfo.emoji} ${rankingInfo.nome}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙🎯﹚***__Atributos__*** *(Base + Armas = Total | Peso no Overall)*\n\n`;
        
        atributosDetalhados.forEach(attr => {
            const nomeAttr = attr.nome.charAt(0).toUpperCase() + attr.nome.slice(1);
            const emoji = emojiAtributos[attr.nome] || "🎯";
            const bonusStr = attr.bonus > 0 ? ` + ${attr.bonus}` : '';
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${emoji} ⦘**  **__${nomeAttr}__** —  \`${attr.base}${bonusStr} = ${attr.valor} | ${Math.round(attr.peso * 100)}% do overall\`\n`;
        });
        
        texto += `\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***${rankingInfo.emoji} ${rankingInfo.nome} • Overall calculado com pesos da sua posição!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        const embed = new EmbedBuilder()
            .setColor(rankingInfo.cor)
            .setAuthor({ name: `🏆 ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('🏆 OVERALL DO JOGADOR')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemStatus)
            .setFooter({ text: `⚽ Blue Lock • Overall como ${nomePosicao} | Base + Armas = Total` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};