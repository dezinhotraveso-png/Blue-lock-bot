const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const tiposDesarme = [
    { nome: "🛡️ Desarme Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Tentativa básica.", emoji: "🛡️" },
    { nome: "⚡ Desarme Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Desarme rápido.", emoji: "⚡" },
    { nome: "💪 Desarme Físico", bonus: 7, penalidade: -3, fatal: 8, desc: "Usa força.", emoji: "💪" },
    { nome: "🎭 Desarme de Classe", bonus: 4, penalidade: -1, fatal: 5, desc: "Desarme limpo.", emoji: "🎭" },
    { nome: "🦵 Carrinho", bonus: 6, penalidade: -4, fatal: 10, desc: "Carrinho.", emoji: "🦵" }
];

const statusPorCargo = {
    "desarme": { stat: "desarme", valor: 1 },
    "marcador": { stat: "desarme", valor: 2 },
    "fisico": { stat: "fisico", valor: 1 },
    "forca": { stat: "fisico", valor: 1 }
};

function calcularStatusPorCargos(member) {
    if (!member) return { desarme: 0, fisico: 0 };
    const status = { desarme: 0, fisico: 0 };
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
        if (habInfo.tipo === "desarme" && cargos.some(c => c.includes(habInfo.nome.toLowerCase()))) {
            habilidades.push({ ...habInfo, key, usosRestantes: 999 });
        }
    }
    return habilidades;
}

module.exports = {
    name: 'desarmar',
    description: '🛡️ Tenta desarmar um adversário',
    aliases: ['roubar', 'tackle'],
    async execute(message, args) {
        const todasHabilidades = listarTodasHabilidades();
        const status = calcularStatusPorCargos(message.member);
        const habilidades = getHabilidadesPorCargos(message.member, todasHabilidades);
        
        const alvo = message.mentions.users.first();
        if (!alvo) return message.reply('❌ Mencione o jogador para desarmar!');
        
        await mostrarTiposDesarme(message, status, habilidades, alvo);
    }
};

async function mostrarTiposDesarme(message, status, habilidades, alvo) {
    const row = new ActionRowBuilder();
    tiposDesarme.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Desarme Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🦵 Carrinho") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const texto = 
        `🛡️ **DESARME CONTRA ${alvo.username.toUpperCase()}**\n\n` +
        `𖦹 ${message.author.username} vai tentar roubar a bola!\n\n` +
        `📊 **Status:**\n` +
        `⤷ 🛡️ Desarme: +${status.desarme || 0}\n` +
        `⤷ 💪 Físico: +${status.fisico || 0}\n` +
        (habilidades.length > 0 ? `\n✨ **Habilidades:**\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n`).join('')}` : '') +
        `\n🎯 **Estilos:**\n` +
        tiposDesarme.map(t => `⤷ ${t.nome} (+${t.bonus}, fatal ≤${t.fatal})\n   ${t.desc}\n`).join('');

    const embed = new EmbedBuilder().setColor('#3498DB').setDescription(texto);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposDesarme.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDesarme(i, tipo, status, alvo, null)], components: [] });
        } else {
            await mostrarHabilidadesDesarme(i, tipo, status, habilidades, alvo);
        }
    });
}

async function mostrarHabilidadesDesarme(interaction, tipoInfo, status, habilidades, alvo) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(ButtonStyle.Primary)));

    const texto = `✨ **Habilidades**\n\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n   ${h.efeito}\n`).join('')}`;
    await interaction.update({ embeds: [new EmbedBuilder().setColor('#9B59B6').setDescription(texto)], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        const habUsada = habKey !== 'nenhuma' ? habKey : null;
        await i.update({ embeds: [executarDesarme(i, tipoInfo, status, alvo, habUsada)], components: [] });
    });
}

function executarDesarme(interaction, tipoInfo, status, alvo, habilidadeKey) {
    let bonusDesarme = (status.desarme || 0) + tipoInfo.bonus;
    let bonusFisico = status.fisico || 0;
    let bonusDrible = 5;
    let chanceFatalFinal = tipoInfo.fatal;
    let habBonus = 0;
    let nomeHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            habBonus = habInfo.bonus?.desarme || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dadoAtacante = Math.floor(Math.random() * 40) + 1;
    const dadoDefensor = Math.floor(Math.random() * 40) + 1;
    let totalAtacante = dadoAtacante + bonusDesarme + bonusFisico + habBonus;
    let totalDefensor = dadoDefensor + bonusDrible;
    let erroFatal = dadoAtacante <= chanceFatalFinal;
    
    if (erroFatal) {
        const texto = `💥 **FALTA!** ${interaction.user.username} cometeu falta!\n\n🎲 Dado: ${dadoAtacante} (FATAL!)\n◞⚡ O adversário mantém a posse!`;
        return new EmbedBuilder().setColor('#DC143C').setDescription(texto).setImage(gifs.erro_fatal);
    }
    
    const sucesso = totalAtacante > totalDefensor;
    const texto = 
        `${sucesso ? '✅' : '❌'} **${sucesso ? 'DESARME PERFEITO' : 'DESARME FALHOU'}!**\n\n` +
        `𖦹 ${interaction.user.username} ${sucesso ? 'roubou a bola!' : 'tentou desarmar ${alvo.username}!'}\n\n` +
        `📊 **Dados:**\n` +
        (nomeHabilidade ? `✨ Habilidade: ${nomeHabilidade}\n` : '') +
        `🎲 Rolagem: ${dadoAtacante}\n` +
        `🛡️ Poder Desarme: ${totalAtacante}\n` +
        `✨ Poder Drible: ${totalDefensor}\n\n` +
        `◞⚡ ${sucesso ? 'Você recuperou a posse!' : 'O adversário mantém a posse!'}`;
    
    return new EmbedBuilder().setColor(sucesso ? '#00FF00' : '#FF0000').setDescription(texto).setImage(gifs.desarmar);
}