const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const tiposRolls = {
    arma: { nome: "Arma", emoji: "⚔️" },
    estilo: { nome: "Estilo de Jogo", emoji: "🎭" },
    dom: { nome: "Dom (Talento)", emoji: "⭐" },
    monstro: { nome: "Monstro", emoji: "👹" },
    dominancia: { nome: "Dominância", emoji: "👑" }
};

module.exports = {
    name: 'addrolls',
    description: '👑 Admin: Adiciona rolls por categoria para o jogador gastar',
    async execute(message, args, client, context) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }
        
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first();
        const tipo = args[1]?.toLowerCase();
        const quantidade = parseInt(args[2]);
        
        if (!target || !tipo || isNaN(quantidade) || quantidade <= 0) {
            const texto = 
                `˚ ˳ ﹙📋﹚***__ADDROLLS - COMANDO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📖 ⦘**  **__Uso__** —  \`c!addrolls @jogador <tipo> <quantidade>\`\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Tipos de Rolls__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__arma__** —  Roll de Arma\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__estilo__** —  Roll de Estilo de Jogo\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__dom__** —  Roll de Dom (Talento)\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__monstro__** —  Roll de Monstro\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__dominancia__** —  Roll de Dominância\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Exemplos__** —\n` +
                `> │ \`c!addrolls @jogador arma 3\`\n` +
                `> │ \`c!addrolls @jogador estilo 1\`\n` +
                `> │ \`c!addrolls @jogador dom 2\`\n` +
                `> │ \`c!addrolls @jogador monstro 1\`\n` +
                `> │ \`c!addrolls @jogador dominancia 1\`\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#FFD700').setTitle('📋 ADDROLLS').setDescription(texto)] });
        }
        
        if (!tiposRolls[tipo]) {
            return message.reply(`❌ Tipo inválido! Use: ${Object.keys(tiposRolls).join(', ')}`);
        }
        
        // Cria jogador se não existir
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = {
                nome: target.username,
                status: { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 },
                rolls: {},
                rollsDisponiveis: {}
            };
        }
        
        const jogador = dados.jogadores[target.id];
        if (!jogador.rollsDisponiveis) jogador.rollsDisponiveis = {};
        if (!jogador.rollsDisponiveis[tipo]) jogador.rollsDisponiveis[tipo] = 0;
        
        jogador.rollsDisponiveis[tipo] += quantidade;
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
        
        // Mostra todos os rolls disponíveis
        let rollsTexto = '';
        for (const [t, info] of Object.entries(tiposRolls)) {
            const qtd = jogador.rollsDisponiveis[t] || 0;
            rollsTexto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${info.emoji} ⦘**  **__${info.nome}__** —  \`${qtd} rolls\`\n`;
        }
        
        const texto = 
            `˚ ˳ ﹙🎫﹚***__ROLLS ADICIONADOS__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${target.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ➕ ⦘**  **__Adicionado__** —  \`+${quantidade} ${tiposRolls[tipo].emoji} ${tiposRolls[tipo].nome}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Rolls Disponíveis__***\n\n` +
            rollsTexto +
            `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!roll <tipo> para gastar um roll!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: `🎲 ${target.username}`, iconURL: target.displayAvatarURL() })
            .setTitle('🎫 ROLLS ADICIONADOS')
            .setDescription(texto)
            .setFooter({ text: '⚽ Blue Lock • c!roll <tipo> para gastar' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};