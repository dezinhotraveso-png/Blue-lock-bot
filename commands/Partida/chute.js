const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const tiposChute = [
    { nome: "chute", emoji: "⚽", label: "CHUTE PADRÃO", fatal: 3, desc: "Finalização padrão.", gifKey: "chute_normal", bonus: 0, penalidade: 0, multiplicador: 1.0 },
    { nome: "voleio", emoji: "🦶", label: "VOLEIO", fatal: 8, desc: "Chute de primeira.", gifKey: "voleio", bonus: 8, penalidade: -4, multiplicador: 1.2 },
    { nome: "bicicleta", emoji: "🚲", label: "BICICLETA", fatal: 12, desc: "Chute acrobático.", gifKey: "bicicleta", bonus: 12, penalidade: -8, multiplicador: 1.3 },
    { nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", fatal: 5, desc: "Toque sutil.", gifKey: "cavadinha", bonus: 4, penalidade: 2, multiplicador: 0.9 }
];

const forcasChute = [
    { nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Chute seguro." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Chute equilibrado." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Chute potente." }
];

// ==========================================
// 🎯 FUNÇÕES PARA BUSCAR STATUS DOS CARGOS
// ==========================================

// Mapeamento de palavras-chave nos cargos para status
const statusPorCargo = {
    // Finalização
    "finalizacao": { stat: "finalizacao", valor: 1 },
    "chute": { stat: "finalizacao", valor: 1 },
    "gol": { stat: "finalizacao", valor: 1 },
    "artilheiro": { stat: "finalizacao", valor: 2 },
    
    // Drible
    "drible": { stat: "drible", valor: 1 },
    "driblador": { stat: "drible", valor: 2 },
    "ginga": { stat: "drible", valor: 1 },
    
    // Passe
    "passe": { stat: "passe", valor: 1 },
    "garçom": { stat: "passe", valor: 2 },
    "assistencia": { stat: "passe", valor: 1 },
    
    // Velocidade
    "velocidade": { stat: "velocidade", valor: 1 },
    "velocista": { stat: "velocidade", valor: 2 },
    "rapido": { stat: "velocidade", valor: 1 },
    
    // Físico
    "fisico": { stat: "fisico", valor: 1 },
    "forca": { stat: "fisico", valor: 1 },
    "forte": { stat: "fisico", valor: 1 },
    
    // Desarme
    "desarme": { stat: "desarme", valor: 1 },
    "marcacao": { stat: "desarme", valor: 1 },
    
    // Interceptação
    "interceptacao": { stat: "interceptacao", valor: 1 },
    "corte": { stat: "interceptacao", valor: 1 },
    
    // Domínio
    "dominio": { stat: "dominio", valor: 1 },
    "controle": { stat: "dominio", valor: 1 },
    
    // Defesa GK
    "defesa": { stat: "defesaGk", valor: 1 },
    "goleiro": { stat: "defesaGk", valor: 2 },
    "paredao": { stat: "defesaGk", valor: 1 }
};

// Função para calcular status baseado nos cargos do Discord
function calcularStatusPorCargos(member) {
    if (!member) return {
        finalizacao: 0, drible: 0, passe: 0, desarme: 0,
        velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0
    };
    
    const status = {
        finalizacao: 0, drible: 0, passe: 0, desarme: 0,
        velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0
    };
    
    const cargos = member.roles.cache.map(role => role.name.toLowerCase());
    
    for (const cargo of cargos) {
        for (const [palavra, info] of Object.entries(statusPorCargo)) {
            if (cargo.includes(palavra)) {
                status[info.stat] += info.valor;
            }
        }
    }
    
    return status;
}

// Função para buscar habilidades pelos cargos do Discord
function getHabilidadesPorCargos(member, todasHabilidades) {
    if (!member || !todasHabilidades) return [];
    
    const habilidadesEncontradas = [];
    const nomesCargos = member.roles.cache.map(role => role.name.toLowerCase());
    
    for (const [key, habInfo] of Object.entries(todasHabilidades)) {
        const nomeHabilidade = habInfo.nome.toLowerCase();
        const temHabilidade = nomesCargos.some(cargoNome => 
            cargoNome.includes(nomeHabilidade) || nomeHabilidade.includes(cargoNome)
        );
        
        if (temHabilidade) {
            habilidadesEncontradas.push({
                ...habInfo,
                key: key,
                usosRestantes: 999
            });
        }
    }
    
    return habilidadesEncontradas;
}

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

module.exports = {
    name: 'chute',
    description: '⚽ Chute ao gol',
    aliases: ['finalizar', 'chutar', 'shot'],
    async execute(message, args) {
        // Busca TODAS as habilidades do arquivo
        const todasHabilidades = listarTodasHabilidades();
        
        // Busca habilidades pelos CARGOS do Discord
        const habilidadesPorCargo = getHabilidadesPorCargos(message.member, todasHabilidades);
        
        // Busca STATUS pelos CARGOS do Discord
        const statusPorCargo = calcularStatusPorCargos(message.member);
        
        console.log(`🔍 Habilidades encontradas para ${message.author.username}: ${habilidadesPorCargo.map(h => h.nome).join(', ') || 'Nenhuma'}`);
        console.log(`📊 Status encontrados: Finalização +${statusPorCargo.finalizacao}, Drible +${statusPorCargo.drible}, Velocidade +${statusPorCargo.velocidade}`);
        
        await mostrarTiposChute(message, statusPorCargo, habilidadesPorCargo);
    }
};

async function mostrarTiposChute(message, status, habilidadesDoJogador) {
    const tiposRow = new ActionRowBuilder();
    tiposChute.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "voleio") estilo = ButtonStyle.Success;
        if (t.nome === "bicicleta") estilo = ButtonStyle.Danger;
        if (t.nome === "cavadinha") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome}`).setLabel(`${t.emoji} ${t.label}`).setStyle(estilo));
    });

    const bonusChute = status.finalizacao || 0;
    
    // Mostrar status dos cargos
    let statusTexto = `ㅤㅤ⌞ 📊 STATUS POR CARGOS ⌝\n\n`;
    statusTexto += `⤷ 🦵 Finalização · \`+${bonusChute}\`\n`;
    statusTexto += `⤷ ✨ Drible · \`+${status.drible || 0}\`\n`;
    statusTexto += `⤷ ☄️ Passe · \`+${status.passe || 0}\`\n`;
    statusTexto += `⤷ ⚡ Velocidade · \`+${status.velocidade || 0}\`\n`;
    statusTexto += `⤷ 💪 Físico · \`+${status.fisico || 0}\`\n`;
    statusTexto += `⤷ 🛡️ Desarme · \`+${status.desarme || 0}\`\n`;
    statusTexto += `⤷ 🎯 Interceptação · \`+${status.interceptacao || 0}\`\n`;
    statusTexto += `⤷ 🧤 Defesa GK · \`+${status.defesaGk || 0}\`\n`;
    statusTexto += `⤷ ⚽ Domínio · \`+${status.dominio || 0}\`\n\n`;
    
    // Mostrar habilidades encontradas
    let habilidadesTexto = "";
    if (habilidadesDoJogador.length > 0) {
        habilidadesTexto = `ㅤㅤ⌞ ✨ HABILIDADES ATIVAS (CARGOS) ⌝\n\n`;
        for (const hab of habilidadesDoJogador) {
            habilidadesTexto += `⤷ ${hab.emoji} **${hab.nome}** ${hab.estrelas}\n   📝 ${hab.efeito}\n`;
            if (hab.bonus?.finalizacao) habilidadesTexto += `   🦵 +${hab.bonus.finalizacao} Finalização\n`;
            habilidadesTexto += `\n`;
        }
    } else {
        habilidadesTexto = `ㅤㅤ⌞ ⚠️ NENHUMA HABILIDADE ⌝\n\nNenhuma habilidade equipada via cargo.\nAdicione cargos com nomes de habilidades!\n\n`;
    }
    
    const texto = 
        `﹒ ⟢ ⚽ ﹒ 𝗖𝗛𝗨𝗧𝗘 𝗔𝗢 𝗚𝗢𝗟 !\n\n` +
        `𖦹 ${message.author.username} se prepara para finalizar!\n\n` +
        `${statusTexto}` +
        `${habilidadesTexto}` +
        `ㅤㅤ⌞ 🎯 TÉCNICAS DISPONÍVEIS ⌝\n\n` +
        tiposChute.map(t => `⤷ ${t.emoji} ${t.label}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Mult: x${t.multiplicador}\n   📝 ${t.desc}\n`).join('\n') +
        `\n◞⚡ Escolha a técnica nos botões abaixo!\n\n` +
        `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 TÉCNICA DE CHUTE')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposChute.find(t => t.nome === i.customId.replace('tipo_', ''));
        await mostrarForcasChute(i, tipo, status, habilidadesDoJogador);
    });
}

async function mostrarForcasChute(interaction, tipoInfo, status, habilidadesDoJogador) {
    const forcaRow = new ActionRowBuilder();
    forcasChute.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const texto = 
        `﹒ ⟢ ⚖️ ﹒ 𝗗𝗘𝗙𝗜𝗡𝗜𝗥 𝗣𝗢𝗧𝗘̂𝗡𝗖𝗜𝗔 !\n\n` +
        `𖦹 ${interaction.user.username} define a força do chute!\n\n` +
        `ㅤㅤ⌞ 📊 ⌝\n\n` +
        `⤷ ⚽ Técnica · \`${tipoInfo.label}\`\n` +
        `⤷ 🦵 Finalização Base · \`+${status.finalizacao || 0}\`\n\n` +
        `ㅤㅤ⌞ 💪 FORÇAS DISPONÍVEIS ⌝\n\n` +
        forcasChute.map(f => `⤷ ${f.nome}\n   Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\n   📝 ${f.desc}\n`).join('\n') +
        `\n◞⚡ Escolha a força nos botões abaixo!\n\n` +
        `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `⚽ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ POTÊNCIA DO CHUTE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito!', flags: 64 });
        collector.stop();
        const forca = forcasChute.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        
        if (habilidadesDoJogador.length === 0) {
            await i.update({ embeds: [executarChute(i, tipoInfo, forca, status, null)], components: [] });
        } else {
            await mostrarHabilidadesChute(i, tipoInfo, forca, status, habilidadesDoJogador);
        }
    });
}

async function mostrarHabilidadesChute(interaction, tipoInfo, forca, status, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    
    habilidades.slice(0, 4).forEach(hab => {
        let estilo = ButtonStyle.Primary;
        if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${hab.key}`).setLabel(`${hab.emoji} ${hab.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS (CARGOS) ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.finalizacao) habsTexto += `   🦵 +${hab.bonus.finalizacao} Finalização\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = 
        `﹒ ⟢ ✨ ﹒ 𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗗𝗜𝗦𝗣𝗢𝗡𝗜́𝗩𝗘𝗜𝗦 !\n\n` +
        `𖦹 ${interaction.user.username}, escolha uma habilidade!\n\n` +
        `${habsTexto}\n` +
        `◞⚡ Clique no botão para ativar.\n\n` +
        `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        let mensagemConfirmacao = '';
        
        if (habKey !== 'nenhuma') {
            const habSelecionada = habilidades.find(h => h.key === habKey);
            if (habSelecionada) {
                habUsada = habKey;
                mensagemConfirmacao = `✅ **${habSelecionada.emoji} ${habSelecionada.nome}** ativada!`;
            }
        }
        
        await i.update({ embeds: [executarChute(i, tipoInfo, forca, status, habUsada)], components: [] });
        if (mensagemConfirmacao) {
            await i.followUp({ content: mensagemConfirmacao, flags: 64 });
        }
    });
}

function executarChute(interaction, tipoInfo, forca, status, habilidadeKey) {
    let bonusChute = status.finalizacao || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let podeRerrolar = false;
    let gifHabilidade = null;
    
    // Busca a habilidade completa
    const todasHabilidades = listarTodasHabilidades();
    const habInfo = habilidadeKey ? todasHabilidades[habilidadeKey] : null;
    const nomeHabilidade = habInfo?.nome || null;
    const habBonus = habInfo?.bonus?.finalizacao || 0;
    
    if (habInfo) {
        gifHabilidade = habInfo.gif;
        if (habInfo.rerollChute) podeRerrolar = true;
        if (habInfo.fatal !== undefined) chanceFatalFinal = habInfo.fatal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusChute + bonusTipo + forca.bonus + habBonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    // Reroll para Second Chance
    if (habilidadeKey === 'secondChance' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        let novoTotal = Math.floor((novoDado + bonusChute + bonusTipo + forca.bonus + habBonus) * multiplicador);
        if (novoTotal < 1) novoTotal = 1;
        erroFatal = novoDado <= chanceFatalFinal;
        total = novoTotal;
        rerrolou = true;
    }
    
    const bonusTotal = bonusTipo + forca.bonus + habBonus;
    
    if (erroFatal) {
        const texto = 
            `﹒ ⟢ 💥 ﹒ 𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟 !\n\n` +
            `𖦹 ${interaction.user.username} tentou ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e errou feio!\n\n` +
            `ㅤㅤ⌞ 📊 ⌝\n\n` +
            `⤷ 🎲 Rolagem · \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal} (FATAL! ≤${chanceFatalFinal})\`\n` +
            `⤷ 💢 Penalidade · \`${penalidadeTipo + forca.penalidade}\`\n\n` +
            `◞⚡ A bola foi direto para fora de campo!\n\n` +
            `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
            
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    const texto = 
        `﹒ ⟢ ⚽ ﹒ 𝗖𝗛𝗨𝗧𝗘 𝗘𝗫𝗘𝗖𝗨𝗧𝗔𝗗𝗢 !\n\n` +
        `𖦹 ${interaction.user.username} desferiu um remate incrível!\n\n` +
        `ㅤㅤ⌞ 📊 ⌝\n\n` +
        (nomeHabilidade ? `⤷ ✨ Habilidade · \`${nomeHabilidade}\`\n` : '') +
        `⤷ 🎲 Rolagem · \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}\`\n` +
        `⤷ 🦵 Finalização · \`+${bonusChute}\`\n` +
        `⤷ 🎯 Bônus · \`+${bonusTotal}\`\n` +
        `⤷ ✖️ Multiplicador · \`x${multiplicador}\`\n` +
        `⤷ 💥 Poder Final · \`${total}\`\n\n` +
        `◞⚡ O chute foi executado com sucesso!\n\n` +
        `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setAuthor({ name: `🔥 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs[tipoInfo.gifKey] || gifs.chute_normal)
        .setTimestamp();
}