const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const estilosDefesa = [
    { nome: "🧤 Defesa Normal", bonus: 0, penalidade: 0, fatal: 3, desc: "Posição neutra.", multiplicador: 1.0 },
    { nome: "⚡ Defesa Rápida", bonus: 5, penalidade: -2, fatal: 6, desc: "Reação rápida.", multiplicador: 1.1 },
    { nome: "💪 Defesa Forte", bonus: 8, penalidade: -5, fatal: 9, desc: "Força bruta.", multiplicador: 1.2 },
    { nome: "🎭 Espalmada", bonus: 3, penalidade: 0, fatal: 4, desc: "Espalma a bola.", multiplicador: 1.0 },
    { nome: "🦵 Defesa com Pé", bonus: 4, penalidade: -1, fatal: 5, desc: "Defesa com os pés.", multiplicador: 1.0 }
];

const forcasDefesa = [
    { nome: "🟢 Leve", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Defesa suave." },
    { nome: "🟡 Média", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Defesa equilibrada." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Defesa potente." }
];

const statusPorCargo = {
    "defesa": { stat: "defesaGk", valor: 1 },
    "goleiro": { stat: "defesaGk", valor: 2 },
    "paredao": { stat: "defesaGk", valor: 1 }
};

function calcularStatusPorCargos(member) {
    if (!member) return { defesaGk: 0 };
    const status = { defesaGk: 0 };
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
        if (habInfo.tipo === "defesa" && cargos.some(c => c.includes(habInfo.nome.toLowerCase()))) {
            habilidades.push({ ...habInfo, key, usosRestantes: 999 });
        }
    }
    return habilidades;
}

let ultimoChuteSimulado = null;

module.exports = {
    name: 'defender',
    description: '🧤 Tenta defender um chute',
    aliases: ['defesa', 'save'],
    async execute(message, args) {
        const todasHabilidades = listarTodasHabilidades();
        const status = calcularStatusPorCargos(message.member);
        const habilidades = getHabilidadesPorCargos(message.member, todasHabilidades);
        
        if (!ultimoChuteSimulado) {
            ultimoChuteSimulado = {
                poder: Math.floor(Math.random() * 80) + 20,
                atacante: ['Atacante', 'Jogador', 'Adversário'][Math.floor(Math.random() * 3)],
                tipo: ['Chute Forte', 'Voleio', 'Bicicleta'][Math.floor(Math.random() * 3)]
            };
        }
        
        await mostrarEstilosDefesa(message, status, habilidades);
    }
};

async function mostrarEstilosDefesa(message, status, habilidades) {
    const row = new ActionRowBuilder();
    estilosDefesa.forEach(e => row.addComponents(new ButtonBuilder().setCustomId(`estilo_${e.nome.replace(/ /g, '_')}`).setLabel(e.nome).setStyle(ButtonStyle.Primary)));

    const texto = 
        `🧤 **DEFESA DE CHUTE**\n\n` +
        `𖦹 ${message.author.username} vai tentar defender!\n\n` +
        `📊 **Status:**\n` +
        `⤷ 🧤 Defesa Base: +${status.defesaGk || 0}\n` +
        `⤷ 💥 Poder do Chute: ${ultimoChuteSimulado.poder} (${ultimoChuteSimulado.atacante})\n` +
        (habilidades.length > 0 ? `\n✨ **Habilidades:**\n${habilidades.map(h => `⤷ ${h.emoji} ${h.nome}\n`).join('')}` : '') +
        `\n🎯 **Estilos:**\n` +
        estilosDefesa.map(e => `⤷ ${e.nome} (+${e.bonus}, fatal ≤${e.fatal})\n   ${e.desc}\n`).join('');

    const embed = new EmbedBuilder().setColor('#3498DB').setDescription(texto);
    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const estilo = estilosDefesa.find(e => e.nome === i.customId.replace('estilo_', '').replace(/_/g, ' '));
        await mostrarForcasDefesa(i, estilo, status, habilidades);
    });
}

async function mostrarForcasDefesa(interaction, estilo, status, habilidades) {
    const row = new ActionRowBuilder();
    forcasDefesa.forEach(f => row.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const texto = 
        `⚖️ **DEFINIR FORÇA**\n\n` +
        `𖦹 ${interaction.user.username} define a força!\n\n` +
        `⤷ 🧤 Estilo: ${estilo.nome}\n\n` +
        `💪 **Forças:**\n` +
        forcasDefesa.map(f => `⤷ ${f.nome} (+${f.bonus}, mult x${f.multiplicador}, fatal ≤${f.fatal})\n   ${f.desc}\n`).join('');

    await interaction.update({ embeds: [new EmbedBuilder().setColor('#F39C12').setDescription(texto)], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito!', flags: 64 });
        collector.stop();
        const forca = forcasDefesa.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDefesa(i, estilo, forca, status, null)], components: [] });
            ultimoChuteSimulado = null;
        } else {
            await mostrarHabilidadesDefesa(i, estilo, forca, status, habilidades);
        }
    });
}

async function mostrarHabilidadesDefesa(interaction, estilo, forca, status, habilidades) {
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
        await i.update({ embeds: [executarDefesa(i, estilo, forca, status, habUsada)], components: [] });
        ultimoChuteSimulado = null;
    });
}

function executarDefesa(interaction, estilo, forca, status, habilidadeKey) {
    let bonusDefesa = (status.defesaGk || 0) + estilo.bonus + forca.bonus;
    let multiplicador = estilo.multiplicador * forca.multiplicador;
    let chanceFatalFinal = Math.max(estilo.fatal, forca.fatal);
    let habBonus = 0;
    let nomeHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            habBonus = habInfo.bonus?.defesaGk || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusDefesa + habBonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    const diff = total - ultimoChuteSimulado.poder;
    
    if (erroFatal) {
        const texto = `💥 **FRANGUEIRA FATAL!** ${interaction.user.username} falhou!\n\n🎲 Dado: ${dado} (FATAL!)\n◞⚡ GOL INCONTESTÁVEL!`;
        return new EmbedBuilder().setColor('#DC143C').setDescription(texto).setImage(gifs.erro_fatal);
    }
    
    const defendeu = total >= ultimoChuteSimulado.poder;
    const texto = 
        `${defendeu ? '🧤' : '⚽'} **${defendeu ? 'DEFESA REALIZADA' : 'GOL SOFRIDO'}!**\n\n` +
        `𖦹 ${interaction.user.username} ${defendeu ? 'fez uma defesa incrível!' : 'não conseguiu alcançar!'}\n\n` +
        `📊 **Dados:**\n` +
        (nomeHabilidade ? `✨ Habilidade: ${nomeHabilidade}\n` : '') +
        `🎲 Rolagem: ${dado}\n` +
        `🧤 Defesa Base: +${bonusDefesa}\n` +
        `✖️ Multiplicador: x${multiplicador}\n` +
        `📈 Valor Final: ${total}\n` +
        `💥 Força do Chute: ${ultimoChuteSimulado.poder}\n\n` +
        `◞⚡ ${defendeu ? `Defendeu com ${diff} pontos de sobra!` : `O chute superou por ${Math.abs(diff)} pontos!`}`;
    
    return new EmbedBuilder().setColor(defendeu ? '#2ECC71' : '#E74C3C').setDescription(texto).setImage(gifs.defesa);
}