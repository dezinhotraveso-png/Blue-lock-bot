const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const tiposPasse = [
    { nome: "⚡ Passe Rápido", bonus: 0, penalidade: 0, fatal: 3, desc: "Passe rápido e rasteiro.", emoji: "⚡", dificuldadeMin: 8 },
    { nome: "🎯 Passe Colocado", bonus: 4, penalidade: 0, fatal: 4, desc: "Passe milimétrico.", emoji: "🎯", dificuldadeMin: 10 },
    { nome: "🦶 Passe Trivela", bonus: 6, penalidade: -2, fatal: 6, desc: "Passe com efeito.", emoji: "🦶", dificuldadeMin: 12 },
    { nome: "🧠 Passe de Calcanhar", bonus: 8, penalidade: -4, fatal: 8, desc: "Passe de calcanhar.", emoji: "🧠", dificuldadeMin: 14 }
];

const forcasPasse = [
    { nome: "🟢 Curto", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Passe curto e seguro." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Passe de média distância." },
    { nome: "🔴 Longo", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Passe longo e arriscado." }
];

// Mapeamento de palavras-chave para status
const statusPorCargo = {
    "passe": { stat: "passe", valor: 1 },
    "garçom": { stat: "passe", valor: 2 },
    "assistencia": { stat: "passe", valor: 1 },
    "maestro": { stat: "passe", valor: 2 },
    "visao": { stat: "passe", valor: 1 }
};

function calcularStatusPorCargos(member) {
    if (!member) return { passe: 0 };
    const status = { passe: 0 };
    const cargos = member.roles.cache.map(role => role.name.toLowerCase());
    for (const cargo of cargos) {
        for (const [palavra, info] of Object.entries(statusPorCargo)) {
            if (cargo.includes(palavra)) status[info.stat] += info.valor;
        }
    }
    return status;
}

function getHabilidadesPorCargos(member, todasHabilidades) {
    if (!member || !todasHabilidades) return [];
    const habilidades = [];
    const cargos = member.roles.cache.map(role => role.name.toLowerCase());
    for (const [key, habInfo] of Object.entries(todasHabilidades)) {
        if (habInfo.tipo === "passe" && cargos.some(c => c.includes(habInfo.nome.toLowerCase()))) {
            habilidades.push({ ...habInfo, key, usosRestantes: 999 });
        }
    }
    return habilidades;
}

module.exports = {
    name: 'passe',
    description: '☄️ Tenta passar a bola',
    aliases: ['passar', 'pass'],
    async execute(message, args) {
        const todasHabilidades = listarTodasHabilidades();
        const status = calcularStatusPorCargos(message.member);
        const habilidades = getHabilidadesPorCargos(message.member, todasHabilidades);
        
        const alvo = message.mentions.users.first();
        if (!alvo) return message.reply('❌ Mencione o jogador para receber o passe!');
        
        await mostrarTiposPasse(message, status, habilidades, alvo);
    }
};

async function mostrarTiposPasse(message, status, habilidades, alvo) {
    const tiposRow = new ActionRowBuilder();
    tiposPasse.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "🎯 Passe Colocado") estilo = ButtonStyle.Success;
        if (t.nome === "🦶 Passe Trivela") estilo = ButtonStyle.Danger;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const texto = 
        `﹒ ⟢ ☄️ ﹒ 𝗣𝗔𝗦𝗦𝗘 𝗣𝗔𝗥𝗔 ${alvo.username.toUpperCase()} !\n\n` +
        `𖦹 ${message.author.username} vai passar a bola!\n\n` +
        `ㅤㅤ⌞ 📊 ⌝\n\n` +
        `⤷ ☄️ Passe Base · \`+${status.passe || 0}\`\n` +
        `⤷ 🎯 Alvo · \`${alvo.username}\`\n\n` +
        (habilidades.length > 0 ? `ㅤㅤ⌞ ✨ HABILIDADES ATIVAS ⌝\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n`).join('')}\n` : '') +
        `ㅤㅤ⌞ 🎯 TIPOS DE PASSE ⌝\n\n` +
        tiposPasse.map(t => `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Dif.Mín: ${t.dificuldadeMin}\n   📝 ${t.desc}\n`).join('\n') +
        `\n◞⚡ Escolha o tipo de passe!\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embed = new EmbedBuilder().setColor('#2E86C1').setDescription(texto);
    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposPasse.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        await mostrarForcasPasse(i, tipo, status, habilidades, alvo);
    });
}

async function mostrarForcasPasse(interaction, tipoInfo, status, habilidades, alvo) {
    const forcaRow = new ActionRowBuilder();
    forcasPasse.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const texto = 
        `﹒ ⟢ ⚖️ ﹒ 𝗗𝗘𝗙𝗜𝗡𝗜𝗥 𝗙𝗢𝗥𝗖̧𝗔 !\n\n` +
        `𖦹 ${interaction.user.username} define a força do passe!\n\n` +
        `ㅤㅤ⌞ 📊 ⌝\n\n` +
        `⤷ ⚡ Tipo · \`${tipoInfo.nome}\`\n` +
        `⤷ ☄️ Passe Base · \`+${status.passe || 0}\`\n\n` +
        `ㅤㅤ⌞ 💪 FORÇAS DISPONÍVEIS ⌝\n\n` +
        forcasPasse.map(f => `⤷ ${f.nome}\n   Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\n   📝 ${f.desc}\n`).join('\n') +
        `\n◞⚡ Escolha a força!\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    await interaction.update({ embeds: [new EmbedBuilder().setColor('#F1C40F').setDescription(texto)], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito!', flags: 64 });
        collector.stop();
        const forca = forcasPasse.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarPasse(i, tipoInfo, forca, status, alvo, null)], components: [] });
        } else {
            await mostrarHabilidadesPasse(i, tipoInfo, forca, status, habilidades, alvo);
        }
    });
}

async function mostrarHabilidadesPasse(interaction, tipoInfo, forca, status, habilidades, alvo) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(ButtonStyle.Primary)));

    const texto = 
        `﹒ ⟢ ✨ ﹒ 𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 !\n\n` +
        `𖦹 ${interaction.user.username}, escolha uma habilidade!\n\n` +
        habilidades.map(h => `⤷ ${h.emoji} ${h.nome} (${h.estrelas})\n   📝 ${h.efeito}\n`).join('\n') +
        `\n◞⚡ Clique no botão para ativar.\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    await interaction.update({ embeds: [new EmbedBuilder().setColor('#9B59B6').setDescription(texto)], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        const habUsada = habKey !== 'nenhuma' ? habKey : null;
        await i.update({ embeds: [executarPasse(i, tipoInfo, forca, status, alvo, habUsada)], components: [] });
    });
}

function executarPasse(interaction, tipoInfo, forca, status, alvo, habilidadeKey) {
    let bonusPasse = status.passe || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let dificuldadeMin = tipoInfo.dificuldadeMin;
    
    const habInfo = habilidadeKey ? listarTodasHabilidades()[habilidadeKey] : null;
    const nomeHabilidade = habInfo?.nome || null;
    const habBonus = habInfo?.bonus?.passe || 0;
    if (habInfo && habInfo.fatal) chanceFatalFinal = habInfo.fatal;
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusPasse + bonusTipo + forca.bonus + habBonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo + forca.bonus + habBonus;
    
    if (erroFatal) {
        const texto = `💥 **ERRO FATAL!** ${interaction.user.username} isolou a bola!\n\n🎲 Dado: ${dado} (FATAL!)\n◞⚡ Bola foi para fora!`;
        return new EmbedBuilder().setColor('#DC143C').setDescription(texto).setImage(gifs.erro_fatal);
    }
    
    const sucesso = total >= dificuldadeMin;
    const texto = 
        `${sucesso ? '✅' : '⚠️'} **PASSE ${sucesso ? 'PERFEITO' : 'PERIGOSO'}!**\n\n` +
        `𖦹 ${interaction.user.username} → ${alvo.username}\n\n` +
        `📊 **Dados:**\n` +
        (nomeHabilidade ? `✨ Habilidade: ${nomeHabilidade}\n` : '') +
        `🎲 Rolagem: ${dado}\n` +
        `☄️ Passe Base: +${bonusPasse}\n` +
        `🎯 Bônus: +${bonusTotal}\n` +
        `✖️ Multiplicador: x${multiplicador}\n` +
        `💥 Poder Final: ${total} (min: ${dificuldadeMin})\n\n` +
        `◞⚡ ${sucesso ? `O passe chega limpo em ${alvo.username}!` : `O passe é impreciso!`}`;
    
    return new EmbedBuilder().setColor(sucesso ? '#2ECC71' : '#FFA500').setDescription(texto).setImage(gifs.passe_normal);
}