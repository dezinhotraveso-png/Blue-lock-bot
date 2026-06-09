const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const atributos = {
    "finalizacao": { nome: "Finalização", emoji: "🦵" },
    "drible": { nome: "Drible", emoji: "✨" },
    "passe": { nome: "Passe", emoji: "☄️" },
    "desarme": { nome: "Desarme", emoji: "🛡️" },
    "velocidade": { nome: "Velocidade", emoji: "⚡" },
    "fisico": { nome: "Físico", emoji: "💪" },
    "interceptacao": { nome: "Interceptação", emoji: "🎯" },
    "defesaGk": { nome: "Defesa GK", emoji: "🧱" },
    "dominio": { nome: "Domínio", emoji: "⚽" }
};

module.exports = {
    name: 'treinar',
    description: '🏋️ Treina para ganhar pontos e distribuir nos status (a cada 24h)',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const jogadorId = message.author.id;
        
        if (!dados.jogadores[jogadorId]) {
            return message.reply('❌ Você não está registrado! Use `c!entrar` primeiro.');
        }
        
        const jogador = dados.jogadores[jogadorId];
        if (!jogador.status) {
            jogador.status = { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 };
        }
        if (!jogador.pontosTreino) jogador.pontosTreino = 0;
        
        const subComando = args[0]?.toLowerCase();
        
        // ==========================================
        // 🏋️ FAZER TREINO
        // ==========================================
        if (!subComando || subComando === 'fazer') {
            const agora = Date.now();
            const ultimoTreino = jogador.ultimoTreinoTimestamp || 0;
            const diferenca = agora - ultimoTreino;
            const horasRestantes = Math.ceil((86400000 - diferenca) / 3600000);
            
            if (diferenca < 86400000 && ultimoTreino > 0) {
                const texto = 
                    `˚ ˳ ﹙🏋️﹚***__TREINO EM ESPERA__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⏰ ⦘**  **__Aguarde!__** —  \`Faltam ${horasRestantes} hora(s)\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Pontos disponíveis__** —  \`${jogador.pontosTreino}\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Treino disponível a cada 24 horas!***__\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                
                return message.reply({ embeds: [new EmbedBuilder().setColor('#FFA500').setAuthor({ name: `🏋️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('🏋️ TREINO EM ESPERA').setDescription(texto)] });
            }
            
            const pontosGanhos = Math.floor(Math.random() * 5) + 3;
            jogador.pontosTreino += pontosGanhos;
            jogador.ultimoTreinoTimestamp = agora;
            
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            const texto = 
                `˚ ˳ ﹙🏋️﹚***__TREINO CONCLUÍDO!__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏋️ ⦘**  **__Treino finalizado!__**\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Pontos ganhos__** —  \`+${pontosGanhos}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Total disponível__** —  \`${jogador.pontosTreino} pontos\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!treinar distribuir <atributo> <quantidade>***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setAuthor({ name: `🏋️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('🏋️ TREINO CONCLUÍDO').setDescription(texto)] });
        }
        
        // ==========================================
        // 📊 VER PONTOS
        // ==========================================
        if (subComando === 'pontos') {
            const agora = Date.now();
            const ultimoTreino = jogador.ultimoTreinoTimestamp || 0;
            const diferenca = agora - ultimoTreino;
            let statusTreino = '✅ Disponível!';
            if (diferenca < 86400000 && ultimoTreino > 0) {
                const horasRestantes = Math.ceil((86400000 - diferenca) / 3600000);
                statusTreino = `⏰ Disponível em ${horasRestantes}h`;
            }
            
            const texto = 
                `˚ ˳ ﹙📊﹚***__PONTOS DE TREINO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Pontos disponíveis__** —  \`${jogador.pontosTreino}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏋️ ⦘**  **__Próximo treino__** —  \`${statusTreino}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!treinar distribuir <atributo> <qtd>***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#9B59B6').setAuthor({ name: `📊 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('📊 PONTOS DE TREINO').setDescription(texto)] });
        }
        
        // ==========================================
        // 📈 DISTRIBUIR PONTOS
        // ==========================================
        if (subComando === 'distribuir') {
            const atributoKey = args[1]?.toLowerCase();
            const quantidade = parseInt(args[2]);
            
            if (!atributoKey || !atributos[atributoKey]) {
                let listaAtributos = '';
                for (const [key, attr] of Object.entries(atributos)) {
                    listaAtributos += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${attr.emoji} ⦘**  **__${attr.nome}__** —  \`c!treinar distribuir ${key} <qtd>\`\n`;
                }
                
                const texto = 
                    `˚ ˳ ﹙📋﹚***__ATRIBUTOS DISPONÍVEIS__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Pontos__** —  \`${jogador.pontosTreino}\`\n\n` +
                    listaAtributos +
                    `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Exemplo__** —  \`c!treinar distribuir finalizacao 5\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                
                return message.reply({ embeds: [new EmbedBuilder().setColor('#FFD700').setAuthor({ name: `📈 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('📈 DISTRIBUIR PONTOS').setDescription(texto)] });
            }
            
            if (isNaN(quantidade) || quantidade <= 0) {
                return message.reply('❌ Informe uma quantidade válida! Use: `c!treinar distribuir <atributo> <quantidade>`');
            }
            
            if (quantidade > jogador.pontosTreino) {
                return message.reply(`❌ Você só tem **${jogador.pontosTreino}** pontos! Não pode distribuir ${quantidade}.`);
            }
            
            const attrInfo = atributos[atributoKey];
            
            // Distribui os pontos
            jogador.pontosTreino -= quantidade;
            jogador.status[atributoKey] = (jogador.status[atributoKey] || 0) + quantidade;
            
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            const texto = 
                `˚ ˳ ﹙✅﹚***__PONTOS DISTRIBUÍDOS!__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ${attrInfo.emoji} ⦘**  **__${attrInfo.nome}__** —  \`+${quantidade} pontos\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Novo valor__** —  \`${jogador.status[atributoKey]}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Pontos restantes__** —  \`${jogador.pontosTreino}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!status para ver seus atributos!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('✅ PONTOS DISTRIBUÍDOS').setDescription(texto)] });
        }
        
        // ==========================================
        // HELP
        // ==========================================
        const agora = Date.now();
        const ultimoTreino = jogador.ultimoTreinoTimestamp || 0;
        const diferenca = agora - ultimoTreino;
        let statusTreino = '✅ Disponível!';
        if (diferenca < 86400000 && ultimoTreino > 0) {
            const horasRestantes = Math.ceil((86400000 - diferenca) / 3600000);
            statusTreino = `⏰ Em ${horasRestantes}h`;
        }
        
        const texto = 
            `˚ ˳ ﹙🏋️﹚***__SISTEMA DE TREINO__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏋️ ⦘**  **__c!treinar__** —  \`Faz o treino (3-7 pontos a cada 24h)\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!treinar pontos__** —  \`Vê quantos pontos tem\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__c!treinar distribuir__** —  \`Mostra atributos disponíveis\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__c!treinar distribuir <attr> <qtd>__** —  \`Distribui pontos\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Pontos__** —  \`${jogador.pontosTreino}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏋️ ⦘**  **__Treino__** —  \`${statusTreino}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Exemplos__** —\n` +
            `> │ \`c!treinar distribuir finalizacao 5\`\n` +
            `> │ \`c!treinar distribuir drible 3\`\n` +
            `> │ \`c!treinar distribuir velocidade 2\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        
        return message.reply({ embeds: [new EmbedBuilder().setColor('#FFD700').setAuthor({ name: `🏋️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('🏋️ SISTEMA DE TREINO').setDescription(texto)] });
    }
};