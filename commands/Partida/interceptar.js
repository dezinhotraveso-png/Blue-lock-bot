const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const tiposInterceptacao = [
    { nome: "🛡️ Interceptação Segura", bonus: 0, penalidade: 0, fatal: 3, desc: "Corta a linha do passe.", emoji: "🛡️" },
    { nome: "⚡ Interceptação Rápida", bonus: 5, penalidade: -2, fatal: 6, desc: "Corte rápido.", emoji: "⚡" },
    { nome: "🎭 Interceptação Fantasia", bonus: 8, penalidade: -4, fatal: 9, desc: "Corte com estilo.", emoji: "🎭" },
    { nome: "💪 Interceptação Física", bonus: 4, penalidade: -1, fatal: 5, desc: "Usa o corpo.", emoji: "💪" },
    { nome: "🎯 Leitura de Passe", bonus: 6, penalidade: 0, fatal: 4, desc: "Antecipa a trajetória.", emoji: "🎯" }
];

const statusPorCargo = {
    "interceptacao": { stat: "interceptacao", valor: 1 },
    "corte": { stat: "interceptacao", valor: 1 },
    "leitura": { stat: "interceptacao", valor: 2 }
};

function calcularStatusPorCargos(member) {
    if (!member) return { interceptacao: 0 };
    const status = { interceptacao: 0 };
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
        if (habInfo.tipo === "interceptacao" && cargos.some(c => c.includes(habInfo.nome.toLowerCase()))) {
            habilidades.push({ ...habInfo, key, usosRestantes: 999 });
        }
    }
    return habilidades;
}

let ultimoPasseSimulado = null;

module.exports = {
    name: 'interceptar',
    description: '🎯 Tenta interceptar um passe',
    aliases: ['cortar'],
    async execute(message, args) {
        const todasHabilidades = listarTodasHabilidades();
        const status = calcularStatusPorCargos(message.member);
        const habilidades = getHabilidadesPorCargos(message.member, todasHabilidades);
        
        if (!ultimoPasseSimulado) {
            ultimoPasseSimulado = {
                poder: Math.floor(Math.random() * 40) + 10,
                passador: ['Jogador A', 'Atacante', 'Meia'][Math.floor(Math.random() * 3)],
                receptor: ['Jogador B', 'Atacante 2', 'Ponta'][Math.floor(Math.random() * 3)]
            };
        }
        
        await mostrarTiposInterceptacao(message, status, habilidades);
    }
};

async function mostrarTiposInterceptacao(message, status, habilidades) {
    const row = new ActionRowBuilder();
    tiposInterceptacao.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Interceptação Rápida") estilo = ButtonStyle.Success;
        if (t.nome === "🎭 Interceptação Fantasia") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const texto = 
        `🎯 **INTERCEPTAR PASSE**\n\n` +
        `𖦹 ${message.author.username} vai tentar interceptar!\n\n` +
        `📊 **Status:**\n` +
        `⤷ 🎯 Interceptação: +${status.interceptacao || 0}\n` +
        `⤷ ☄️ Poder do Passe: ${ultimoPasseSimulado.poder}\n` +
        `⤷ 🎯 Passador: ${ultimoPasseSimulado.passador} → ${ultimoPasseSimulado.receptor}\n` +
        (habilidades.length > 0 ? `\n✨ **Habilidades:**\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n`).join('')}` : '') +
        `\n🎯 **Estilos:**\n` +
        tiposInterceptacao.map(t => `⤷ ${t.nome} (+${t.bonus}, fatal ≤${t.fatal})\n   ${t.desc}\n`).join('');

    const embed = new EmbedBuilder().setColor('#E67E22').setDescription(texto);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposInterceptacao.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarInterceptacao(i, tipo, status, null)], components: [] });
            ultimoPasseSimulado = null;
        } else {
            await mostrarHabilidadesInterceptacao(i, tipo, status, habilidades);
        }
    });
}

async function mostrarHabilidadesInterceptacao(interaction, tipoInfo, status, habilidades) {
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
        await i.update({ embeds: [executarInterceptacao(i, tipoInfo, status, habUsada)], components: [] });
        ultimoPasseSimulado = null;
    });
}

function executarInterceptacao(interaction, tipoInfo, status, habilidadeKey) {
    let bonusInterceptacao = (status.interceptacao || 0) + tipoInfo.bonus;
    let chanceFatalFinal = tipoInfo.fatal;
    let habBonus = 0;
    let nomeHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            habBonus = habInfo.bonus?.interceptacao || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = dado + bonusInterceptacao + habBonus;
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    const diferenca = total - ultimoPasseSimulado.poder;
    
    if (erroFatal) {
        const texto = `💥 **ERRO FATAL!** ${interaction.user.username} falhou!\n\n🎲 Dado: ${dado} (FATAL!)\n◞⚡ O passe continua!`;
        return new EmbedBuilder().setColor('#DC143C').setDescription(texto).setImage(gifs.erro_fatal);
    }
    
    let resultado = "";
    let cor = "";
    let icone = "";
    
    if (total >= ultimoPasseSimulado.poder && diferenca >= 8) {
        cor = '#00FF00';
        icone = '✅';
        resultado = `INTERCEPTAÇÃO PERFEITA! Você dominou a bola! (+${diferenca})`;
    } else if (total >= ultimoPasseSimulado.poder && diferenca >= 3) {
        cor = '#FFA500';
        icone = '🟡';
        resultado = `INTERCEPTAÇÃO! Você desviou a bola! (+${diferenca})`;
    } else if (total >= ultimoPasseSimulado.poder) {
        cor = '#87CEEB';
        icone = '🟢';
        resultado = `TOCOU NA BOLA! Você não dominou! (+${diferenca})`;
    } else if (diferenca >= -3) {
        cor = '#FF6347';
        icone = '❌';
        resultado = `POR POUCO! Você quase pegou! (${diferenca})`;
    } else {
        cor = '#FF0000';
        icone = '❌';
        resultado = `FALHOU! Você não chegou perto! (${diferenca})`;
    }
    
    const texto = 
        `${icone} **${resultado}**\n\n` +
        `𖦹 ${interaction.user.username} tentou interceptar!\n\n` +
        `📊 **Dados:**\n` +
        (nomeHabilidade ? `✨ Habilidade: ${nomeHabilidade}\n` : '') +
        `🎲 Rolagem: ${dado}\n` +
        `🎯 Poder Interceptação: ${total}\n` +
        `☄️ Poder do Passe: ${ultimoPasseSimulado.poder}\n` +
        `⚡ Diferença: ${diferenca >= 0 ? `+${diferenca}` : `${diferenca}`}\n\n` +
        `◞⚡ ${resultado}`;
    
    return new EmbedBuilder().setColor(cor).setDescription(texto).setImage(gifs.interceptar);
}