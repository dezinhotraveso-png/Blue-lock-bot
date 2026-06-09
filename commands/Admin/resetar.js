const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'resetar',
    description: '👑 Admin: Reseta os status/pontos de um jogador ou todos',
    async execute(message, args, client, context) {
        // Verifica permissão
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }
        
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const subComando = args[0]?.toLowerCase();
        const target = message.mentions.users.first();
        
        // ==========================================
        // RESETAR UM JOGADOR ESPECÍFICO
        // ==========================================
        if (target) {
            if (!dados.jogadores[target.id]) {
                return message.reply(`❌ **${target.username}** não está registrado!`);
            }
            
            const tipo = args[1]?.toLowerCase();
            
            // Se não especificou tipo, pergunta o que resetar
            if (!tipo) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('reset_status').setLabel('📊 Resetar Status').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('reset_pontos').setLabel('⭐ Resetar Pontos').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('reset_rolls').setLabel('🎲 Resetar Rolls').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('reset_tudo').setLabel('💀 Resetar TUDO').setStyle(ButtonStyle.Danger)
                    );
                
                const texto = 
                    `˚ ˳ ﹙⚠️﹚***__RESETAR JOGADOR__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${target.username}\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha o que deseja resetar!***__\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                
                const msg = await message.reply({ embeds: [new EmbedBuilder().setColor('#FF0000').setAuthor({ name: `⚠️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('⚠️ RESETAR JOGADOR').setDescription(texto)], components: [row] });
                
                const collector = msg.createMessageComponentCollector({ time: 30000 });
                
                collector.on('collect', async i => {
                    if (i.user.id !== message.author.id) {
                        return i.reply({ content: '❌ Apenas o admin pode escolher!', flags: 64 });
                    }
                    
                    let dadosAtual = {};
                    if (fs.existsSync(blueLockPath)) dadosAtual = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
                    const jogador = dadosAtual.jogadores[target.id];
                    let mensagem = '';
                    
                    switch(i.customId) {
                        case 'reset_status':
                            jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
                            mensagem = `✅ Status de **${target.username}** resetados!`;
                            break;
                        case 'reset_pontos':
                            jogador.pontosTreino = 0;
                            mensagem = `✅ Pontos de treino de **${target.username}** resetados!`;
                            break;
                        case 'reset_rolls':
                            jogador.rolls = {};
                            jogador.rollsDisponiveis = {};
                            mensagem = `✅ Rolls de **${target.username}** resetados!`;
                            break;
                        case 'reset_tudo':
                            jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
                            jogador.pontosTreino = 0;
                            jogador.rolls = {};
                            jogador.rollsDisponiveis = {};
                            jogador.estatisticas = { gols: 0, assistencias: 0, passes: 0, dribles: 0, desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, vitorias: 0, pdr: 0 };
                            mensagem = `💀 **${target.username}** foi completamente resetado!`;
                            break;
                    }
                    
                    fs.writeFileSync(blueLockPath, JSON.stringify(dadosAtual, null, 2));
                    collector.stop();
                    await i.update({ content: mensagem, embeds: [], components: [] });
                });
                
                return;
            }
            
            // Reset rápido por comando
            const jogador = dados.jogadores[target.id];
            let mensagem = '';
            
            switch(tipo) {
                case 'status':
                    jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
                    mensagem = `✅ Status de **${target.username}** resetados!`;
                    break;
                case 'pontos':
                    jogador.pontosTreino = 0;
                    mensagem = `✅ Pontos de **${target.username}** resetados!`;
                    break;
                case 'rolls':
                    jogador.rolls = {};
                    jogador.rollsDisponiveis = {};
                    mensagem = `✅ Rolls de **${target.username}** resetados!`;
                    break;
                case 'tudo':
                    jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
                    jogador.pontosTreino = 0;
                    jogador.rolls = {};
                    jogador.rollsDisponiveis = {};
                    jogador.estatisticas = { gols: 0, assistencias: 0, passes: 0, dribles: 0, desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, vitorias: 0, pdr: 0 };
                    mensagem = `💀 **${target.username}** foi completamente resetado!`;
                    break;
                default:
                    return message.reply('❌ Tipo inválido! Use: `status`, `pontos`, `rolls`, `tudo`');
            }
            
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            return message.reply(mensagem);
        }
        
        // ==========================================
        // RESETAR TODOS (RESETALL) - APENAS DONO
        // ==========================================
        if (subComando === 'resetall') {
            // Verifica se é o dono do bot
            const donoId = '772060684417499156'; // Seu ID
            if (message.author.id !== donoId) {
                return message.reply('❌ Apenas o **DONO** do bot pode usar este comando!');
            }
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('confirmar_resetall').setLabel('💀 CONFIRMAR RESET GERAL').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancelar_resetall').setLabel('❌ CANCELAR').setStyle(ButtonStyle.Secondary)
                );
            
            const totalJogadores = Object.keys(dados.jogadores).length;
            
            const texto = 
                `˚ ˳ ﹙⚠️﹚***__⚠️ RESET GERAL ⚠️__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 💀 ⦘**  **__ATENÇÃO!__**\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👥 ⦘**  **__Total de jogadores__** —  \`${totalJogadores}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Isso vai resetar STATUS, PONTOS e ROLLS de TODOS os jogadores! Esta ação é IRREVERSÍVEL!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            const msg = await message.reply({ embeds: [new EmbedBuilder().setColor('#FF0000').setAuthor({ name: `⚠️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('⚠️ RESET GERAL').setDescription(texto)], components: [row] });
            
            const collector = msg.createMessageComponentCollector({ time: 15000 });
            
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '❌ Apenas o dono pode confirmar!', flags: 64 });
                }
                
                if (i.customId === 'cancelar_resetall') {
                    collector.stop();
                    return i.update({ content: '✅ Reset geral **CANCELADO**!', embeds: [], components: [] });
                }
                
                if (i.customId === 'confirmar_resetall') {
                    let dadosAtual = {};
                    if (fs.existsSync(blueLockPath)) dadosAtual = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
                    
                    let resetados = 0;
                    for (const [id, jogador] of Object.entries(dadosAtual.jogadores)) {
                        jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
                        jogador.pontosTreino = 0;
                        jogador.rolls = {};
                        jogador.rollsDisponiveis = {};
                        resetados++;
                    }
                    
                    fs.writeFileSync(blueLockPath, JSON.stringify(dadosAtual, null, 2));
                    collector.stop();
                    
                    const textoFinal = 
                        `˚ ˳ ﹙💀﹚***__RESET GERAL CONCLUÍDO__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 👥 ⦘**  **__Jogadores resetados__** —  \`${resetados}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Status, pontos e rolls de todos foram resetados!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    return i.update({ embeds: [new EmbedBuilder().setColor('#FF0000').setTitle('💀 RESET GERAL').setDescription(textoFinal)], components: [] });
                }
            });
            
            return;
        }
        
        // ==========================================
        // HELP
        // ==========================================
        const texto = 
            `˚ ˳ ﹙📋﹚***__COMANDOS DE RESET__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Resetar jogador__**\n` +
            `> │ \`c!resetar @jogador\` — Menu interativo\n` +
            `> │ \`c!resetar @jogador status\` — Reseta status\n` +
            `> │ \`c!resetar @jogador pontos\` — Reseta pontos\n` +
            `> │ \`c!resetar @jogador rolls\` — Reseta rolls\n` +
            `> │ \`c!resetar @jogador tudo\` — Reseta tudo\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💀 ⦘**  **__Resetar TODOS__** *(apenas dono)*\n` +
            `> │ \`c!resetar resetall\` — Reseta todos os jogadores\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        
        return message.reply({ embeds: [new EmbedBuilder().setColor('#FF0000').setTitle('📋 COMANDOS DE RESET').setDescription(texto)] });
    }
};