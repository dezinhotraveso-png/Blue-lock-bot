const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const tiposDrible = [
    { nome: "✨ Drible Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Drible básico.", emoji: "✨" },
    { nome: "⚡ Drible Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Drible rápido.", emoji: "⚡" },
    { nome: "🎭 Drible Fantasia", bonus: 8, penalidade: -5, fatal: 10, desc: "Drible com estilo.", emoji: "🎭" },
    { nome: "🔄 Drible Elástico", bonus: 6, penalidade: -3, fatal: 7, desc: "Drible elástico.", emoji: "🔄" },
    { nome: "💨 Arrancada", bonus: 4, penalidade: -1, fatal: 5, desc: "Explosão de velocidade.", emoji: "💨" }
];

const statusPorCargo = {
    "drible": { stat: "drible", valor: 1 },
    "driblador": { stat: "drible", valor: 2 },
    "ginga": { stat: "drible", valor: 1 },
    "velocidade": { stat: "velocidade", valor: 1 },
    "velocista": { stat: "velocidade", valor: 2 }
};

function calcularStatusPorCargos(member) {
    if (!member) return { drible: 0, velocidade: 0 };
    const status = { drible: 0, velocidade: 0 };
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
        if (habInfo.tipo === "drible" && cargos.some(c => c.includes(habInfo.nome.toLowerCase()))) {
            habilidades.push({ ...habInfo, key, usosRestantes: 999 });
        }
    }
    return habilidades;
}

module.exports = {
    name: 'driblar',
    description: '✨ Tenta driblar um defensor',
    aliases: ['drible'],
    async execute(message, args) {
        const todasHabilidades = listarTodasHabilidades();
        const status = calcularStatusPorCargos(message.member);
        const habilidades = getHabilidadesPorCargos(message.member, todasHabilidades);
        await mostrarTiposDrible(message, status, habilidades);
    }
};

async function mostrarTiposDrible(message, status, habilidades) {
    const row = new ActionRowBuilder();
    tiposDrible.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Drible Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🎭 Drible Fantasia") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const texto = 
        `﹒ ⟢ ✨ ﹒ 𝗗𝗥𝗜𝗕𝗟𝗘 𝗖𝗢𝗡𝗧𝗥𝗔 𝗗𝗘𝗙𝗘𝗡𝗦𝗢𝗥 !\n\n` +
        `𖦹 ${message.author.username} vai tentar driblar!\n\n` +
        `ㅤㅤ⌞ 📊 ⌝\n\n` +
        `⤷ ✨ Drible · \`+${status.drible || 0}\`\n` +
        `⤷ ⚡ Velocidade · \`+${status.velocidade || 0}\`\n` +
        `⤷ 🛡️ Defensor · \`+5\`\n\n` +
        (habilidades.length > 0 ? `ㅤㅤ⌞ ✨ HABILIDADES ⌝\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n`).join('')}\n` : '') +
        `ㅤㅤ⌞ 🎯 ESTILOS ⌝\n\n` +
        tiposDrible.map(t => `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n`).join('\n') +
        `\n◞⚡ Escolha o estilo!\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embed = new EmbedBuilder().setColor('#2E86C1').setDescription(texto);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposDrible.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDrible(i, tipo, status, null)], components: [] });
        } else {
            await mostrarHabilidadesDrible(i, tipo, status, habilidades);
        }
    });
}

async function mostrarHabilidadesDrible(interaction, tipoInfo, status, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(ButtonStyle.Primary)));

    const texto = 
        `✨ **HABILIDADES DISPONÍVEIS**\n\n` +
        habilidades.map(h => `⤷ ${h.emoji} ${h.nome} (${h.estrelas})\n   📝 ${h.efeito}\n`).join('\n');

    await interaction.update({ embeds: [new EmbedBuilder().setColor('#9B59B6').setDescription(texto)], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        const habUsada = habKey !== 'nenhuma' ? habKey : null;
        await i.update({ embeds: [executarDrible(i, tipoInfo, status, habUsada)], components: [] });
    });
}

function executarDrible(interaction, tipoInfo, status, habilidadeKey) {
    let bonusDrible = (status.drible || 0) + tipoInfo.bonus;
    let bonusVelocidade = status.velocidade || 0;
    let bonusDesarme = 5;
    let chanceFatalFinal = tipoInfo.fatal;
    let habBonus = 0;
    let nomeHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            habBonus = habInfo.bonus?.drible || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dadoAtacante = Math.floor(Math.random() * 40) + 1;
    const dadoDefensor = Math.floor(Math.random() * 40) + 1;
    let totalAtacante = dadoAtacante + bonusDrible + bonusVelocidade + habBonus;
    let totalDefensor = dadoDefensor + bonusDesarme;
    let erroFatal = dadoAtacante <= chanceFatalFinal;
    
    if (erroFatal) {
        const texto = `💥 **ERRO FATAL!** ${interaction.user.username} perdeu o equilíbrio!\n\n🎲 Dado: ${dadoAtacante} (FATAL!)\n◞⚡ O defensor recupera a posse!`;
        return new EmbedBuilder().setColor('#DC143C').setDescription(texto).setImage(gifs.erro_fatal);
    }
    
    const venceu = totalAtacante > totalDefensor;
    const texto = 
        `${venceu ? '✨' : '🛡️'} **${venceu ? 'DRIBLE BEM-SUCEDIDO' : 'DESARMADO'}!**\n\n` +
        `𖦹 ${interaction.user.username} ${venceu ? 'passou pelo defensor!' : 'foi desarmado!'}\n\n` +
        `📊 **Dados:**\n` +
        (nomeHabilidade ? `✨ Habilidade: ${nomeHabilidade}\n` : '') +
        `🎲 Rolagem: ${dadoAtacante}\n` +
        `✨ Poder Drible: ${totalAtacante}\n` +
        `🛡️ Poder Defensor: ${totalDefensor}\n\n` +
        `◞⚡ ${venceu ? 'Você venceu o duelo!' : 'O defensor recupera a posse!'}`;
    
    return new EmbedBuilder().setColor(venceu ? '#00FF00' : '#FF0000').setDescription(texto).setImage(gifs.driblar);
}