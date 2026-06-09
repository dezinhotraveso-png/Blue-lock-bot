const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gifs = require('../../utils/gifs.js');
const { 
    listarHabilidadesPorTipo, 
    usarHabilidade, 
    aplicarBonusHabilidade, 
    listarTodasHabilidades,
    getJogador,
    atualizarEstatistica
} = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// Posições para verificar se pode chutar
const POSICOES = {
    GOLEIRO: { podeChutar: false },
    ZAGUEIRO: { podeChutar: false },
    LATERAL: { podeChutar: false },
    VOLANTE: { podeChutar: true },
    MEIA: { podeChutar: true },
    PONTA: { podeChutar: true },
    ATACANTE: { podeChutar: true }
};

// Tipos de chute
const tiposChute = [
    { nome: "chute", emoji: "⚽", label: "CHUTE", fatal: 3, desc: "Finalização padrão, equilibrada entre força e precisão.", bonus: 0, penalidade: 0, multiplicador: 1.0 },
    { nome: "voleio", emoji: "🦶", label: "VOLEIO", fatal: 8, desc: "Chute de primeira, sem deixar a bola cair. Alto risco, alta recompensa.", bonus: 8, penalidade: -4, multiplicador: 1.2 },
    { nome: "bicicleta", emoji: "🚲", label: "BICICLETA", fatal: 12, desc: "Chute acrobático com as pernas para trás. Muito plástico, mas extremamente arriscado.", bonus: 12, penalidade: -8, multiplicador: 1.3 },
    { nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", fatal: 5, desc: "Toque sutil por cima do goleiro. Requer precisão e calma.", bonus: 4, penalidade: 2, multiplicador: 0.9 }
];

// Forças do chute
const forcasChute = [
    { nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Chute com pouca força. Seguro, mas facilmente defensável." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Chute equilibrado. Boa relação entre força e precisão." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Chute com máxima potência. Difícil de defender, mas erra mais fácil." }
];

module.exports = {
    name: 'chute',
    description: '⚽ Finaliza ao gol!',
    aliases: ['finalizar', 'chutar', 'shot'],
    async execute(message, args) {
        // Carregar dados
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        // Verificações
        if (!partida || !partida.ativa) {
            return message.reply('❌ Não há partida ativa! Use `!partida iniciar` para começar.');
        }

        const jogador = dados.jogadores?.[message.author.id];
        if (!jogador) {
            return message.reply('❌ Você não está na partida! Use `!entrar` para participar.');
        }

        // Verificar se tem a posse da bola
        if (partida.posse !== message.author.id) {
            return message.reply('❌ Você não tem a posse da bola!');
        }

        // Verificar se o jogador pode chutar baseado na posição
        const posicaoInfo = POSICOES[jogador.posicao] || POSICOES.MEIA;
        if (!posicaoInfo.podeChutar) {
            return message.reply(`❌ Sua posição (${jogador.posicao}) não permite finalizar ao gol! Posições que podem chutar: Volante, Meia, Ponta, Atacante.`);
        }

        const bolaSetor = partida.bolaSetor || "Meio-Campo";
        
        // Verificar se está em setor de ataque
        const setoresAtaque = ["Ataque", "Meio-Campo"];
        if (!setoresAtaque.includes(bolaSetor) && jogador.posicao !== "ATACANTE") {
            return message.reply(`❌ Você está no setor ${bolaSetor}! Para chutar ao gol, você precisa estar no Ataque ou Meio-Campo.`);
        }

        await mostrarTiposChute(message, jogador, partida, dados);
    }
};

async function mostrarTiposChute(message, jogador, partida, dados) {
    const tiposRow = new ActionRowBuilder();
    tiposChute.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "voleio") estilo = ButtonStyle.Success;
        if (t.nome === "bicicleta") estilo = ButtonStyle.Danger;
        if (t.nome === "cavadinha") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`tipo_${t.nome}`)
                .setLabel(`${t.emoji} ${t.label}`)
                .setStyle(estilo)
        );
    });

    const bonusFinalizacao = jogador.status?.finalizacao || 0;
    const bolaSetor = partida.bolaSetor || "Meio-Campo";
    
    // Bônus/penalidade por setor
    let setorBonus = 0;
    let setorDesc = "";
    if (bolaSetor === "Ataque") {
        setorBonus = 5;
        setorDesc = "Bônus de +5 por estar na área!";
    } else if (bolaSetor === "Meio-Campo") {
        setorBonus = 0;
        setorDesc = "Chute de média distância. Sem bônus ou penalidade.";
    } else {
        setorBonus = -5;
        setorDesc = "Penalidade de -5 por estar longe do gol!";
    }

    const texto = 
        `˚ ˳ ﹙⚽﹚***__SELEÇÃO DE TÉCNICA__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} (${jogador.posicao}) se prepara para finalizar!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${bolaSetor}\` (${setorDesc})\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘**  **__Finalização__** —  \`+${bonusFinalizacao}\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Bônus Setor__** —  \`${setorBonus >= 0 ? `+${setorBonus}` : `${setorBonus}`}\`\n\n` +
        `> ˚ ˳ ﹙⚡﹚***__Técnicas Disponíveis__***\n\n` +
        `${tiposChute.map(t => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${t.emoji} ⦘**  **__${t.label}__** —  \`Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Mult: x${t.multiplicador}\`\n> │ *${t.desc}*\n`).join('\n')}\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a técnica nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 SELECIONE A TÉCNICA')
        .setDescription(texto)
        .setFooter({ text: '30 segundos para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: '❌ Apenas quem iniciou o chute pode escolher!', flags: 64 });
        }
        collector.stop();
        
        const tipoChute = tiposChute.find(t => t.nome === i.customId.replace('tipo_', ''));
        await mostrarForcasChute(i, jogador, tipoChute, partida, dados);
    });
    
    collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {});
    });
}

async function mostrarForcasChute(interaction, jogador, tipoInfo, partida, dados) {
    const forcaRow = new ActionRowBuilder();
    forcasChute.forEach(f => {
        let estilo = ButtonStyle.Secondary;
        if (f.nome === "🟡 Médio") estilo = ButtonStyle.Primary;
        if (f.nome === "🔴 Forte") estilo = ButtonStyle.Danger;
        forcaRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`forca_${f.nome.replace(/ /g, '_')}`)
                .setLabel(f.nome)
                .setStyle(estilo)
        );
    });

    const texto = 
        `˚ ˳ ﹙⚖️﹚***__DEFINIÇÃO DE FORÇA__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} define a potência do chute!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Técnica__** —  \`${tipoInfo.label}\`\n\n` +
        `> ˚ ˳ ﹙💪﹚***__Forças Disponíveis__***\n\n` +
        `${forcasChute.map(f => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${f.nome.split(' ')[0]} ⦘**  **__${f.nome}__** —  \`Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\`\n> │ *${f.desc}*\n`).join('\n')}\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a força do chute nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `⚽ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ DEFINIÇÃO DE POTÊNCIA')
        .setDescription(texto)
        .setFooter({ text: '30 segundos para escolher' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msgAtual = await interaction.fetchReply();
    const collector = msgAtual.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Restrito ao criador!', flags: 64 });
        }
        collector.stop();
        
        const forca = forcasChute.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidadesChute = listarHabilidadesPorTipo(jogador, 'chute');
        
        if (habilidadesChute.length === 0) {
            await executarChute(i, jogador, tipoInfo, forca, partida, dados, null);
        } else {
            await mostrarHabilidadesChute(i, jogador, tipoInfo, forca, partida, dados, habilidadesChute);
        }
    });
}

async function mostrarHabilidadesChute(interaction, jogador, tipoInfo, forca, partida, dados, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('hab_nenhuma')
            .setLabel("🚫 Nenhuma")
            .setStyle(ButtonStyle.Secondary)
    );
    
    habilidades.slice(0, 4).forEach(hab => {
        let estilo = ButtonStyle.Primary;
        if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`hab_${hab.key}`)
                .setLabel(`${hab.emoji} ${hab.nome}`)
                .setStyle(estilo)
        );
    });

    let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Chute__***\n> │\n`;
    habilidades.forEach(hab => {
        habilidadesTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
        if (hab.bonus) {
            if (hab.bonus.finalizacao) habilidadesTexto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
            if (hab.bonus.velocidade) habilidadesTexto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
            if (hab.bonus.dominio) habilidadesTexto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
            if (hab.bonus.fisico) habilidadesTexto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        }
        habilidadesTexto += `> │   📝 *${hab.efeito}*\n> │\n`;
    });
    habilidadesTexto += `> │ **🚫 Nenhuma Habilidade**\n> │   Executar sem usar habilidade especial\n> ╰───────────⁀✨⁀───────────╯`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(habilidadesTexto)
        .setFooter({ text: 'Clique na habilidade para ativar' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msgAtual = await interaction.fetchReply();
    const collector = msgAtual.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Apenas você!', flags: 64 });
        }
        
        const habKey = i.customId.replace('hab_', '');
        let habilidadeUsada = null;
        let mensagemConfirmacao = '';
        
        if (habKey !== 'nenhuma') {
            const resultado = usarHabilidade(jogador, habKey);
            if (resultado.sucesso) {
                habilidadeUsada = habKey;
                mensagemConfirmacao = resultado.mensagem;
            } else {
                await i.reply({ content: resultado.mensagem, flags: 64 });
                return;
            }
        }
        
        collector.stop();
        await executarChute(i, jogador, tipoInfo, forca, partida, dados, habilidadeUsada);
        
        if (mensagemConfirmacao) {
            await i.followUp({ content: mensagemConfirmacao, flags: 64 });
        }
    });
}

async function executarChute(interaction, jogador, tipoInfo, forca, partida, dados, habilidadeKey) {
    // Bônus base
    let bonusChute = jogador.status?.finalizacao || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = tipoInfo.multiplicador * forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let podeRerrolar = false;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    
    // Bônus de setor
    const bolaSetor = partida.bolaSetor || "Meio-Campo";
    let setorBonus = 0;
    if (bolaSetor === "Ataque") setorBonus = 5;
    else if (bolaSetor === "Meio-Campo") setorBonus = 0;
    else setorBonus = -5;
    
    // Aplica habilidade
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        
        const bonusAplicado = aplicarBonusHabilidade(jogador, habilidadeKey, { 
            bonusChute, 
            multiplicador, 
            chanceFatal: chanceFatalFinal 
        });
        
        bonusChute = bonusAplicado.bonusChute || bonusChute;
        multiplicador = bonusAplicado.multiplicador || multiplicador;
        chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
        podeRerrolar = bonusAplicado.podeRerrolar || false;
    }
    
    // Rola o dado (1-40)
    const dado = Math.floor(Math.random() * 40) + 1;
    
    // Calcula poder total
    let total = Math.floor((dado + bonusChute + bonusTipo + forca.bonus + setorBonus) * multiplicador);
    if (total < 1) total = 1;

    // Verifica erro fatal
    let erroFatal = dado <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    // Reroll se tiver habilidade
    if (habilidadeKey === 'secondChance' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        let novoTotal = Math.floor((novoDado + bonusChute + bonusTipo + forca.bonus + setorBonus) * multiplicador);
        if (novoTotal < 1) novoTotal = 1;
        erroFatal = novoDado <= chanceFatalFinal;
        total = novoTotal;
        rerrolou = true;
    }
    
    const buffs = bonusChute + bonusTipo + forca.bonus + setorBonus;
    let embed;
    
    // Atualiza estatísticas do jogador
    atualizarEstatistica(interaction.user.id, 'finalizacoes', 1);
    
    // Salva o chute para ser defendido
    partida.ultimoChute = {
        atacanteId: interaction.user.id,
        atacanteNome: interaction.user.username,
        poder: total,
        setor: bolaSetor,
        tecnica: `${tipoInfo.label} ${forca.nome}`,
        time: partida.timeDoAtacante || "casa",
        habilidade: nomeHabilidade
    };
    partida.aguardandoDefesa = true;
    partida.posse = null;
    partida.posseNome = null;
    
    let resultado = "";
    let cor = "";
    
    if (erroFatal) {
        resultado = "ERRO FATAL! A bola foi para fora!";
        cor = "#DC143C";
        partida.ultimoChute = null;
        partida.aguardandoDefesa = false;
        partida.aguardandoPontapeAposGol = true;
        
        const texto = 
            `˚ ˳ ﹙💥﹚***__ERRO FATAL!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} tentou ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e errou feio!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔴 ⦘**  **__Margem Fatal__** —  \`≤ ${chanceFatalFinal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💢 ⦘**  **__Penalidades__** —  \`${penalidadeTipo + forca.penalidade}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`${resultado}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor(cor)
            .setAuthor({ name: `💥 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
            
    } else {
        resultado = `CHUTE EXECUTADO! Aguardando defesa do goleiro...`;
        cor = "#2ECC71";
        
        const texto = 
            `˚ ˳ ﹙⚽﹚***__CHUTE EXECUTADO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} desferiu um remate incrível!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘**  **__Finalização__** —  \`+${bonusChute}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Bônus Técnica/Força__** —  \`+${bonusTipo + forca.bonus}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Bônus Setor__** —  \`${setorBonus >= 0 ? `+${setorBonus}` : `${setorBonus}`}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✖️ ⦘**  **__Multiplicador__** —  \`x${multiplicador}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`${resultado}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Defesa__** —  \`Use !defender para tentar defender este chute!\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor(cor)
            .setAuthor({ name: `🔥 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs.chute_normal);
    }
    
    // Salva os dados
    partida.minuto = (partida.minuto || 0) + 0.5;
    const blueData = dados;
    blueData.partidas[`partida_${interaction.channel.id}`] = partida;
    fs.writeFileSync(blueLockPath, JSON.stringify(blueData, null, 2));
    
    await interaction.update({ embeds: [embed], components: [] });
}