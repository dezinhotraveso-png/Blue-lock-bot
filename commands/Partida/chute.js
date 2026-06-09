const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarHabilidadesPorTipo, usarHabilidade, aplicarBonusHabilidade, listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// Setores do campo
const setoresCampo = {
    "Goleiro": { nome: "🧤 Goleiro", posicao: 1 },
    "Defesa": { nome: "🛡️ Defesa", posicao: 2 },
    "Meio-Campo": { nome: "⚡ Meio-Campo", posicao: 3 },
    "Ataque": { nome: "⚽ Ataque", posicao: 4 }
};

const tiposChute = [
    { nome: "chute", emoji: "⚽", label: "CHUTE PADRÃO", fatal: 3, desc: "Finalização padrão, equilibrada entre força e precisão.", gifKey: "chute_normal", bonus: 0, penalidade: 0, multiplicador: 1.0 },
    { nome: "voleio", emoji: "🦶", label: "VOLEIO", fatal: 8, desc: "Chute de primeira, sem deixar a bola cair. Alto risco, alta recompensa.", gifKey: "voleio", bonus: 8, penalidade: -4, multiplicador: 1.2 },
    { nome: "bicicleta", emoji: "🚲", label: "BICICLETA", fatal: 12, desc: "Chute acrobático com as pernas para trás.", gifKey: "bicicleta", bonus: 12, penalidade: -8, multiplicador: 1.3 },
    { nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", fatal: 5, desc: "Toque sutil por cima do goleiro.", gifKey: "cavadinha", bonus: 4, penalidade: 2, multiplicador: 0.9 }
];

const forcasChute = [
    { nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Chute com pouca força. Seguro, mas facilmente defensável." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Chute equilibrado. Boa relação entre força e precisão." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Chute com máxima potência. Difícil de defender, mas erra mais fácil." }
];

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

function formatarBonusHabilidade(hab) {
    let texto = '';
    if (hab.bonus) {
        if (hab.bonus.finalizacao) texto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

module.exports = {
    name: 'chute',
    description: '⚽ Finaliza ao gol!',
    aliases: ['finalizar', 'chutar', 'shot'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.jogadores || !partida.jogadores[message.author.id]) {
            return message.reply('❌ Você não está na partida!');
        }

        const jogador = partida.jogadores[message.author.id];
        
        if (partida.posse !== message.author.id) {
            return message.reply('❌ Você não tem a posse da bola!');
        }

        const bolaSetor = partida.bolaSetor;
        if (jogador.setor !== bolaSetor) {
            return message.reply(`❌ Você não está no setor da bola! A bola está em ${bolaSetor}`);
        }

        // Verificar se pode chutar baseado no setor
        if (jogador.setor === "Goleiro") {
            return message.reply('❌ Você está no gol! Saia jogando antes de chutar.');
        }

        // Bônus por setor
        let setorBonus = 0;
        let setorDesc = "";
        if (jogador.setor === "Ataque") {
            setorBonus = 8;
            setorDesc = "Bônus de +8 por estar na área!";
        } else if (jogador.setor === "Meio-Campo") {
            setorBonus = 0;
            setorDesc = "Chute de média distância.";
        } else if (jogador.setor === "Defesa") {
            setorBonus = -5;
            setorDesc = "Penalidade de -5 por estar longe do gol!";
        }

        await mostrarTiposChute(message, jogador, setorBonus, setorDesc, partida, dados);
    }
};

async function mostrarTiposChute(message, jogador, setorBonus, setorDesc, partida, dados) {
    const tiposRow = new ActionRowBuilder();
    tiposChute.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "voleio") estilo = ButtonStyle.Success;
        if (t.nome === "bicicleta") estilo = ButtonStyle.Danger;
        if (t.nome === "cavadinha") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome}`).setLabel(`${t.emoji} ${t.label}`).setStyle(estilo));
    });

    const bonusChute = jogador.status?.finalizacao || 0;
    const setorAtual = jogador.setor;
    
    const informativos = [
        { emoji: "📍", label: "Seu Setor", valor: `${setorAtual} (${setoresCampo[setorAtual]?.nome || setorAtual})` },
        { emoji: "🦵", label: "Finalização Base", valor: `+${bonusChute}` },
        { emoji: "🎯", label: "Bônus Setor", valor: `${setorBonus >= 0 ? `+${setorBonus}` : `${setorBonus}`} (${setorDesc})` }
    ];
    
    const texto = 
        `˚ ˳ ﹙⚽﹚***__SELEÇÃO DE TÉCNICA__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} se prepara para finalizar!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        informativos.map(i => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${i.emoji} ⦘**  **__${i.label}__** —  \`${i.valor}\`\n`).join('') +
        `\n> ˚ ˳ ﹙⚡﹚***__Técnicas Disponíveis__***\n\n` +
        tiposChute.map(t => `> **${t.emoji} ${t.label}** — \`Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Mult: x${t.multiplicador}\`\n> *${t.desc}*`).join('\n\n') +
        `\n\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a técnica nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 SELEÇÃO DE TÉCNICA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas quem iniciou o teste!', flags: 64 });
        collector.stop();
        const tipo = tiposChute.find(t => t.nome === i.customId.replace('tipo_', ''));
        await mostrarForcasChute(i, jogador, tipo, setorBonus, setorDesc, partida, dados);
    });
}

async function mostrarForcasChute(interaction, jogador, tipoInfo, setorBonus, setorDesc, partida, dados) {
    const forcaRow = new ActionRowBuilder();
    forcasChute.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const informativos = [
        { emoji: "⚽", label: "Técnica", valor: `${tipoInfo.label}` }
    ];
    
    const texto = 
        `˚ ˳ ﹙⚖️﹚***__DEFINIÇÃO DE FORÇA__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} define a potência do chute!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        informativos.map(i => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${i.emoji} ⦘**  **__${i.label}__** —  \`${i.valor}\`\n`).join('') +
        `\n> ˚ ˳ ﹙💪﹚***__Forças Disponíveis__***\n\n` +
        forcasChute.map(f => `> **${f.nome}** — \`Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\`\n> *${f.desc}*`).join('\n\n') +
        `\n\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a força do chute nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `⚽ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ DEFINIÇÃO DE POTÊNCIA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito ao criador!', flags: 64 });
        collector.stop();
        const forca = forcasChute.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogador, 'chute');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarChute(i, jogador, tipoInfo, forca, setorBonus, partida, dados, null)], components: [] });
        } else {
            await mostrarHabilidadesChute(i, jogador, tipoInfo, forca, setorBonus, partida, dados, habilidades);
        }
    });
}

async function mostrarHabilidadesChute(interaction, jogador, tipoInfo, forca, setorBonus, partida, dados, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Chute__***\n> │\n`;
    habilidades.forEach(hab => {
        habsTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
        habsTexto += formatarBonusHabilidade(hab);
        habsTexto += `> │\n`;
    });
    habsTexto += `> │ **🚫 Nenhuma Habilidade**\n> │   Executar sem usar habilidade especial\n> ╰───────────⁀✨⁀───────────╯`;

    const texto = 
        `˚ ˳ ﹙✨﹚***__HABILIDADES ESPECIAIS__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este chute!*\n\n` +
        `${habsTexto}\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Clique na habilidade para usá-la!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade para ativar' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogador, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarChute(i, jogador, tipoInfo, forca, setorBonus, partida, dados, habUsada)], components: [] });
    });
}

async function executarChute(interaction, jogador, tipoInfo, forca, setorBonus, partida, dados, habilidadeKey) {
    let bonusChute = jogador.status?.finalizacao || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let podeRerrolar = false;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.finalizacao || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const bonusAplicado = aplicarBonusHabilidade(jogador, habilidadeKey, { bonusChute, multiplicador, chanceFatal: chanceFatalFinal });
        bonusChute = bonusAplicado.bonusChute || bonusChute;
        multiplicador = bonusAplicado.multiplicador || multiplicador;
        chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
        podeRerrolar = bonusAplicado.podeRerrolar || false;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusChute + bonusTipo + forca.bonus + habBonus + setorBonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    if (habilidadeKey === 'secondChance' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        let novoTotal = Math.floor((novoDado + bonusChute + bonusTipo + forca.bonus + habBonus + setorBonus) * multiplicador);
        if (novoTotal < 1) novoTotal = 1;
        erroFatal = novoDado <= chanceFatalFinal;
        total = novoTotal;
        rerrolou = true;
    }
    
    const bonusTotal = bonusTipo + forca.bonus + habBonus + setorBonus;
    let embed;
    
    if (erroFatal) {
        const texto = 
            `˚ ˳ ﹙💥﹚***__ERRO FATAL!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} tentou ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e errou feio!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal} (FATAL! ≤${chanceFatalFinal})\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💢 ⦘**  **__Penalidade__** —  \`${penalidadeTipo + forca.penalidade}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`A bola foi direto para fora de campo! Tiro de meta.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALHA CRÍTICA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
            
        partida.posse = null;
        partida.aguardandoPontapeAposGol = true;
        
    } else {
        const texto = 
            `˚ ˳ ﹙⚽﹚***__CHUTE EXECUTADO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} desferiu um remate incrível!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘**  **__Finalização__** —  \`+${bonusChute}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Bônus__** —  \`+${bonusTotal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✖️ ⦘**  **__Multiplicador__** —  \`x${multiplicador}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`Chute executado! Aguardando defesa do goleiro.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: `🔥 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs[tipoInfo.gifKey] || gifs.chute_normal);
        
        partida.aguardandoChute = {
            atacanteId: interaction.user.id,
            atacanteNome: interaction.user.username,
            poder: total,
            setor: jogador.setor,
            tecnica: `${tipoInfo.label} ${forca.nome}`,
            habilidade: nomeHabilidade
        };
        partida.posse = null;
    }
    
    partida.minuto = (partida.minuto || 0) + 0.5;
    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    
    await interaction.update({ embeds: [embed], components: [] });
}