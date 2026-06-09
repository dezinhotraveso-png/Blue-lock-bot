const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// Posições do futebol
const POSICOES = {
    GOLEIRO: { 
        nome: "🧤 Goleiro", 
        setores: ["Goleiro"], 
        podeDefender: true, 
        podeChutar: false, 
        podePassar: true, 
        defesaBase: 15,
        desc: "Última linha de defesa. Pode usar as mãos dentro da área."
    },
    ZAGUEIRO: { 
        nome: "🛡️ Zagueiro", 
        setores: ["Defesa"], 
        podeDefender: true, 
        podeChutar: false, 
        podePassar: true, 
        defesaBase: 12,
        desc: "Defesa central. Responsável por parar os ataques adversários."
    },
    LATERAL: { 
        nome: "⚡ Lateral", 
        setores: ["Defesa", "Meio-Campo"], 
        podeDefender: true, 
        podeChutar: false, 
        podePassar: true, 
        defesaBase: 10,
        desc: "Apoia tanto na defesa quanto no ataque pelas laterais."
    },
    VOLANTE: { 
        nome: "💪 Volante", 
        setores: ["Defesa", "Meio-Campo"], 
        podeDefender: true, 
        podeChutar: true, 
        podePassar: true, 
        defesaBase: 11,
        desc: "Marcação forte no meio-campo. Protege a defesa."
    },
    MEIA: { 
        nome: "🎯 Meia", 
        setores: ["Meio-Campo"], 
        podeDefender: true, 
        podeChutar: true, 
        podePassar: true, 
        defesaBase: 8,
        desc: "Cérebro do time. Cria jogadas e distribui passes."
    },
    PONTA: { 
        nome: "⚡ Ponta", 
        setores: ["Meio-Campo", "Ataque"], 
        podeDefender: false, 
        podeChutar: true, 
        podePassar: true, 
        defesaBase: 5,
        desc: "Velocidade pelas pontas. Cruza e finaliza."
    },
    ATACANTE: { 
        nome: "⚽ Atacante", 
        setores: ["Ataque"], 
        podeDefender: false, 
        podeChutar: true, 
        podePassar: true, 
        defesaBase: 4,
        desc: "Artilheiro do time. Focado em finalizar as jogadas."
    }
};

module.exports = {
    name: 'posicao',
    description: '🎭 Muda sua posição em campo',
    aliases: ['pos', 'setposicao', 'setpos'],
    async execute(message, args) {
        const subComando = args[0]?.toLowerCase();
        
        // Listar posições disponíveis
        if (subComando === 'listar' || !subComando) {
            const texto = 
                `˚ ˳ ﹙🎭﹚***__POSIÇÕES DISPONÍVEIS__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *Escolha sua posição para atuar em campo!*\n\n` +
                Object.entries(POSICOES).map(([key, p]) => 
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ${p.nome.split(' ')[0]} ⦘**  **__${p.nome}__** —  \`${key}\`\n` +
                    `> │ 🛡️ Defesa Base: +${p.defesaBase}\n` +
                    `> │ 📍 Setores: ${p.setores.join(', ')}\n` +
                    `> │ 🛡️ Pode Defender: ${p.podeDefender ? "✅ Sim" : "❌ Não"}\n` +
                    `> │ ⚽ Pode Chutar: ${p.podeChutar ? "✅ Sim" : "❌ Não"}\n` +
                    `> │ 📝 *${p.desc}*\n\n`
                ).join('') +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use !posicao <NOME> para mudar de posição***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setAuthor({ name: `🎭 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('📋 POSIÇÕES DO FUTEBOL')
                .setDescription(texto)
                .setFooter({ text: 'Ex: !posicao ZAGUEIRO' });
            
            return message.reply({ embeds: [embed] });
        }
        
        // Mudar de posição
        const posicaoKey = args[0]?.toUpperCase();
        
        if (!POSICOES[posicaoKey]) {
            return message.reply(`❌ Posição inválida! Use \`!posicao listar\` para ver todas as posições disponíveis.`);
        }
        
        // Carregar dados
        let dados = {};
        if (fs.existsSync(blueLockPath)) {
            dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        }
        
        if (!dados.jogadores) dados.jogadores = {};
        if (!dados.jogadores[message.author.id]) {
            dados.jogadores[message.author.id] = {
                id: message.author.id,
                nome: message.author.username,
                posicao: "MEIA",
                status: {
                    finalizacao: 0, drible: 0, passe: 0, desarme: 0,
                    velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0,
                    dominio: 0, bloqueio: 0, marcacao: 0, antecipacao: 0
                },
                estatisticas: {
                    gols: 0, assistencias: 0, passes: 0, dribles: 0,
                    desarmes: 0, interceptacoes: 0, defesas: 0, bloqueios: 0,
                    partidas: 0, vitorias: 0
                }
            };
        }
        
        // Mudar posição
        const posAntiga = dados.jogadores[message.author.id].posicao;
        const posInfo = POSICOES[posicaoKey];
        dados.jogadores[message.author.id].posicao = posicaoKey;
        
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
        
        const texto = 
            `˚ ˳ ﹙✅﹚***__POSIÇÃO ALTERADA!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} agora é ${posInfo.nome}!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Informações da Nova Posição__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Defesa Base__** —  \`+${posInfo.defesaBase}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setores__** —  \`${posInfo.setores.join(', ')}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Pode Defender__** —  \`${posInfo.podeDefender ? "Sim" : "Não"}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Pode Chutar__** —  \`${posInfo.podeChutar ? "Sim" : "Não"}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Descrição__** —  *${posInfo.desc}*\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use !posicao listar para ver todas as posições***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        
        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('🎭 POSIÇÃO ALTERADA!')
            .setDescription(texto)
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};