const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades, aplicarBonusHabilidade } = require('../../utils/habilidades.js');
const { calcularStatusTotal } = require('../../utils/statusCalculator.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');
const defenderModule = require('./defender.js');

// ═══════════════════════════════════════════════════════
// 🎨 MOLDE DE PREPARAÇÃO
// ═══════════════════════════════════════════════════════
function criarMoldePreparacao(icone, titulo, descricao, informativos, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 INFORMAÇÕES ⌝\n\n`;
    informativos.forEach(info => {
        texto += `⤷ ${info.emoji} ${info.label} · \`${info.valor}\`\n`;
    });
    texto += `\n◞⚡ ${resultado}\n\n`;
    texto += `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

// ═══════════════════════════════════════════════════════
// 🎨 MOLDE DE RESULTADO
// ═══════════════════════════════════════════════════════
function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 DETALHES DA AÇÃO ⌝\n\n`;
    dadosArray.forEach(dado => {
        texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`;
    });
    texto += `\n◞⚡ ${resultado}\n`;
    texto += `\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

// ═══════════════════════════════════════════════════════
// ⚽ TIPOS DE CHUTE DISPONÍVEIS
// ═══════════════════════════════════════════════════════
const tiposChute = [
    { 
        nome: "chute", emoji: "⚽", label: "CHUTE PADRÃO", 
        fatal: 3, bonus: 0, penalidade: 0, multiplicador: 1.0,
        gifKey: "chute_normal",
        desc: "Finalização padrão, equilibrada entre força e precisão. Ideal para situações seguras onde o jogador quer garantir que a bola vá em direção ao gol sem assumir grandes riscos."
    },
    { 
        nome: "voleio", emoji: "🦶", label: "VOLEIO", 
        fatal: 8, bonus: 8, penalidade: -4, multiplicador: 1.2,
        gifKey: "voleio",
        desc: "Chute de primeira, sem deixar a bola cair no chão. Extremamente difícil de defender pela velocidade e imprevisibilidade, mas requer timing perfeito. Alto risco, alta recompensa."
    },
    { 
        nome: "bicicleta", emoji: "🚲", label: "BICICLETA", 
        fatal: 12, bonus: 12, penalidade: -8, multiplicador: 1.3,
        gifKey: "bicicleta",
        desc: "Chute acrobático onde o jogador projeta as pernas para trás e chuta a bola no ar. Muito plástico e extremamente potente, mas a chance de erro é enorme. Só os mais habilidosos dominam."
    },
    { 
        nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", 
        fatal: 5, bonus: 4, penalidade: 2, multiplicador: 0.9,
        gifKey: "cavadinha",
        desc: "Toque sutil por cima do goleiro, exigindo precisão cirúrgica e muita calma. Eficaz quando o goleiro se adianta, mas frágil contra goleiros bem posicionados."
    }
];

// ═══════════════════════════════════════════════════════
// 💪 FORÇAS DE CHUTE DISPONÍVEIS
// ═══════════════════════════════════════════════════════
const forcasChute = [
    { 
        nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2,
        desc: "Chute com pouca força. Seguro e preciso, mas facilmente defensável. Ideal para finalizações colocadas onde a precisão importa mais que a potência."
    },
    { 
        nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5,
        desc: "Chute equilibrado entre força e precisão. A escolha mais versátil para a maioria das situações de finalização."
    },
    { 
        nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8,
        desc: "Chute com máxima potência. Extremamente difícil de defender devido à velocidade da bola, mas a precisão é comprometida pelo excesso de força. Arriscado."
    }
];

// ═══════════════════════════════════════════════════════
// 📊 STATUS PADRÃO
// ═══════════════════════════════════════════════════════
const STATUS_PADRAO = {
    finalizacao: 0, drible: 0, passe: 0, desarme: 0,
    velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0
};

// ═══════════════════════════════════════════════════════
// 👤 CARREGAR/CRIAR JOGADOR
// ═══════════════════════════════════════════════════════
function getJogador(dados, userId, username) {
    if (!dados.jogadores) dados.jogadores = {};
    if (!dados.jogadores[userId]) {
        dados.jogadores[userId] = {
            id: userId, nome: username,
            status: { ...STATUS_PADRAO },
            habilidades: {},
            estatisticas: { gols: 0, finalizacoes: 0, partidas: 0 }
        };
    }
    if (!dados.jogadores[userId].status) dados.jogadores[userId].status = { ...STATUS_PADRAO };
    if (!dados.jogadores[userId].habilidades) dados.jogadores[userId].habilidades = {};
    if (!dados.jogadores[userId].estatisticas) dados.jogadores[userId].estatisticas = { gols: 0, finalizacoes: 0, partidas: 0 };
    
    // Corrigir defenseGk -> defesaGk
    if (dados.jogadores[userId].status.defenseGk !== undefined) {
        dados.jogadores[userId].status.defesaGk = dados.jogadores[userId].status.defenseGk;
        delete dados.jogadores[userId].status.defenseGk;
    }
    // Garantir todos os atributos
    ['finalizacao','drible','passe','desarme','velocidade','fisico','interceptacao','defesaGk','dominio'].forEach(a => {
        if (dados.jogadores[userId].status[a] === undefined || dados.jogadores[userId].status[a] === null) {
            dados.jogadores[userId].status[a] = 0;
        }
    });
    return dados.jogadores[userId];
}

// ═══════════════════════════════════════════════════════
// 🔍 BUSCAR HABILIDADES NOS CARGOS DO DISCORD
// ═══════════════════════════════════════════════════════
function buscarHabilidadesPorCargos(membro) {
    const todasHabilidades = listarTodasHabilidades();
    const encontradas = [];
    
    if (!membro) {
        console.log('⚠️ Membro não encontrado para buscar habilidades');
        return encontradas;
    }
    
    console.log(`\n🔍 [CHUTE] Buscando habilidades nos cargos de ${membro.user.username}...`);
    
    membro.roles.cache.forEach(cargo => {
        const nomeCargo = cargo.name.toLowerCase();
        
        for (const [key, hab] of Object.entries(todasHabilidades)) {
            if (nomeCargo.includes(hab.nome.toLowerCase())) {
                if (!encontradas.find(h => h.key === key)) {
                    console.log(`  ✅ Encontrada: ${hab.emoji} ${hab.nome} (${hab.estrelas}) - Tipo: ${hab.tipo}`);
                    encontradas.push({
                        key,
                        nome: hab.nome,
                        emoji: hab.emoji || '✨',
                        estrelas: hab.estrelas || '★★★',
                        efeito: hab.efeito || hab.desc || '',
                        bonus: hab.bonus || {},
                        tipo: hab.tipo || '',
                        gif: hab.gif || null,
                        rerollChute: hab.rerollChute || false,
                        fatal: hab.fatal || null,
                        usos: hab.usos || 1
                    });
                }
            }
        }
    });
    
    console.log(`📋 Total de habilidades encontradas: ${encontradas.length}\n`);
    return encontradas;
}

// ═══════════════════════════════════════════════════════
// ✅ USAR HABILIDADE COM CRIAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════
function usarHabilidadeSegura(jogador, habKey) {
    const todasHabilidades = listarTodasHabilidades();
    const habInfo = todasHabilidades[habKey];
    
    if (!habInfo) {
        return { sucesso: false, mensagem: '❌ Habilidade não encontrada no sistema.' };
    }
    
    if (!jogador.habilidades) jogador.habilidades = {};
    
    // Se não existe no JSON, cria automaticamente
    if (!jogador.habilidades[habKey]) {
        jogador.habilidades[habKey] = {
            nome: habInfo.nome,
            usosRestantes: habInfo.usos || 1,
            tipo: habInfo.tipo || 'chute'
        };
        console.log(`✅ Habilidade "${habInfo.nome}" criada automaticamente para ${jogador.nome} com ${habInfo.usos || 1} uso(s)`);
    }
    
    // Verifica usos restantes
    if (jogador.habilidades[habKey].usosRestantes <= 0) {
        return { sucesso: false, mensagem: `❌ Usos esgotados para **${habInfo.emoji} ${habInfo.nome}**! Aguarde a próxima partida para recuperar.` };
    }
    
    // Consome um uso
    jogador.habilidades[habKey].usosRestantes--;
    const restantes = jogador.habilidades[habKey].usosRestantes;
    
    let detalhesBonus = '';
    if (habInfo.bonus) {
        const bonus = habInfo.bonus;
        if (bonus.finalizacao) detalhesBonus += `\n   🦵 Finalização +${bonus.finalizacao}`;
        if (bonus.velocidade) detalhesBonus += `\n   ⚡ Velocidade +${bonus.velocidade}`;
        if (bonus.fisico) detalhesBonus += `\n   💪 Físico +${bonus.fisico}`;
        if (bonus.dominio) detalhesBonus += `\n   ⚽ Domínio +${bonus.dominio}`;
        if (bonus.drible) detalhesBonus += `\n   ✨ Drible +${bonus.drible}`;
    }
    
    return {
        sucesso: true,
        mensagem: `✅ **${habInfo.emoji} ${habInfo.nome}** ativada com sucesso!\n📊 Bônus aplicados:${detalhesBonus || ' Nenhum bônus adicional'}\n📥 Usos restantes: **${restantes}**`,
        habilidade: habInfo
    };
}

// ═══════════════════════════════════════════════════════
// 📤 EXPORTAR COMANDO
// ═══════════════════════════════════════════════════════
module.exports = {
    name: 'chute',
    description: '⚽ Realiza uma finalização ao gol com diferentes técnicas e potências',
    aliases: ['finalizar', 'chutar', 'shot'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        const jogador = getJogador(dados, message.author.id, message.author.username);
        const membro = await message.guild.members.fetch(message.author.id).catch(() => null);
        const statusTotal = calcularStatusTotal(jogador, membro, listarTodasHabilidades());
        
        jogador._statusTotal = statusTotal;
        jogador._membro = membro;
        
        console.log(`\n⚽ [CHUTE] ${jogador.nome} iniciou uma finalização!`);
        console.log(`📊 Status Total: Finalização +${statusTotal.finalizacao}`);
        
        await mostrarTiposChute(message, jogador, dados);
    }
};

// ═══════════════════════════════════════════════════════
// 🎯 TELA 1: ESCOLHER TIPO DE CHUTE
// ═══════════════════════════════════════════════════════
async function mostrarTiposChute(message, jogador, dados) {
    const row = new ActionRowBuilder();
    tiposChute.forEach(t => {
        let style = ButtonStyle.Primary;
        if (t.nome === "voleio") style = ButtonStyle.Success;
        if (t.nome === "bicicleta") style = ButtonStyle.Danger;
        if (t.nome === "cavadinha") style = ButtonStyle.Secondary;
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`tipo_${t.nome}`)
                .setLabel(`${t.emoji} ${t.label}`)
                .setStyle(style)
        );
    });

    const bonusChute = jogador._statusTotal?.finalizacao || 0;
    
    const informativos = [
        { emoji: "👤", label: "Jogador", valor: jogador.nome || message.author.username },
        { emoji: "📍", label: "Setor", valor: "Ataque" },
        { emoji: "🦵", label: "Finalização Total", valor: `+${bonusChute}` },
        { emoji: "🎯", label: "Técnica", valor: "Escolha abaixo" }
    ];
    
    let descricaoTecnicas = `\nㅤㅤ⌞ 🎯 TÉCNICAS DE FINALIZAÇÃO ⌝\n\n`;
    tiposChute.forEach(t => {
        descricaoTecnicas += `⤷ ${t.emoji} **${t.label}**\n`;
        descricaoTecnicas += `   📈 Bônus: +${t.bonus} | ⚠️ Fatal: ≤${t.fatal} | ✖️ Mult: x${t.multiplicador}\n`;
        descricaoTecnicas += `   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao(
        "⚽", 
        "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗔 𝗧𝗘́𝗖𝗡𝗜𝗖𝗔 𝗗𝗘 𝗙𝗜𝗡𝗔𝗟𝗜𝗭𝗔𝗖̧𝗔̃𝗢", 
        `${message.author.username} se posiciona para finalizar! Sua finalização total é **+${bonusChute}** (incluindo bônus de posição, nacionalidade, talento e armas).`,
        informativos, 
        "Escolha a técnica de chute nos botões abaixo."
    ) + descricaoTecnicas;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username} • Finalização`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 PASSO 1/3 — TIPO DE CHUTE')
        .setDescription(texto)
        .setFooter({ text: '⏳ 30 segundos para escolher | c!chute' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: '❌ Apenas o jogador que iniciou o chute pode escolher!', flags: 64 });
        }
        collector.stop();
        const tipo = tiposChute.find(t => t.nome === i.customId.replace('tipo_', ''));
        console.log(`  🎯 Técnica escolhida: ${tipo.emoji} ${tipo.label}`);
        await mostrarForcasChute(i, tipo, jogador, dados);
    });
    
    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await msg.edit({ content: '⏰ Tempo esgotado! Use `c!chute` novamente.', embeds: [], components: [] }).catch(() => {});
        }
    });
}

// ═══════════════════════════════════════════════════════
// 💪 TELA 2: ESCOLHER FORÇA DO CHUTE
// ═══════════════════════════════════════════════════════
async function mostrarForcasChute(interaction, tipoInfo, jogador, dados) {
    const row = new ActionRowBuilder();
    forcasChute.forEach(f => {
        let style = ButtonStyle.Secondary;
        if (f.nome === "🟡 Médio") style = ButtonStyle.Primary;
        if (f.nome === "🔴 Forte") style = ButtonStyle.Danger;
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`forca_${f.nome.replace(/ /g, '_')}`)
                .setLabel(f.nome)
                .setStyle(style)
        );
    });

    let descricaoForcas = `\nㅤㅤ⌞ 💪 INTENSIDADE DO CHUTE ⌝\n\n`;
    forcasChute.forEach(f => {
        descricaoForcas += `⤷ **${f.nome}**\n`;
        descricaoForcas += `   📈 Bônus: +${f.bonus} | ✖️ Mult: x${f.multiplicador} | ⚠️ Fatal: ≤${f.fatal}\n`;
        descricaoForcas += `   📝 ${f.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao(
        "⚖️", 
        "𝗗𝗘𝗙𝗜𝗡𝗔 𝗔 𝗣𝗢𝗧𝗘̂𝗡𝗖𝗜𝗔 𝗗𝗢 𝗖𝗛𝗨𝗧𝗘", 
        `${interaction.user.username} define a intensidade da finalização! Técnica escolhida: **${tipoInfo.emoji} ${tipoInfo.label}**`,
        [
            { emoji: "⚽", label: "Técnica", valor: `${tipoInfo.emoji} ${tipoInfo.label}` },
            { emoji: "💪", label: "Potência", valor: "Escolha abaixo" }
        ], 
        "Escolha a força do chute nos botões."
    ) + descricaoForcas;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `⚽ ${interaction.user.username} • Potência`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ PASSO 2/3 — FORÇA DO CHUTE')
        .setDescription(texto)
        .setFooter({ text: '⏳ 30 segundos | Técnica: ' + tipoInfo.label });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Apenas o jogador que iniciou o chute!', flags: 64 });
        }
        collector.stop();
        const forca = forcasChute.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        console.log(`  💪 Força escolhida: ${forca.nome}`);
        
        // Buscar habilidades nos cargos do Discord
        const habilidades = buscarHabilidadesPorCargos(jogador._membro);
        
        if (habilidades.length === 0) {
            console.log('  ⚡ Nenhuma habilidade encontrada, executando chute direto');
            await i.update({ embeds: [executarChute(i, tipoInfo, forca, jogador, dados, null)], components: [] });
        } else {
            console.log(`  ✨ ${habilidades.length} habilidade(s) encontrada(s), mostrando seleção`);
            await mostrarHabilidadesChute(i, tipoInfo, forca, jogador, dados, habilidades);
        }
    });
    
    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.editReply({ content: '⏰ Tempo esgotado!', embeds: [], components: [] }).catch(() => {});
        }
    });
}

// ═══════════════════════════════════════════════════════
// ✨ TELA 3: ESCOLHER HABILIDADE (OPCIONAL)
// ═══════════════════════════════════════════════════════
async function mostrarHabilidadesChute(interaction, tipoInfo, forca, jogador, dados, habilidades) {
    const row = new ActionRowBuilder();
    
    // Botão "Nenhuma"
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('hab_nenhuma')
            .setLabel("🚫 Nenhuma Habilidade")
            .setStyle(ButtonStyle.Secondary)
    );
    
    // Botões das habilidades (máximo 4)
    habilidades.slice(0, 4).forEach(h => {
        let style = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") style = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") style = ButtonStyle.Success;
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`hab_${h.key}`)
                .setLabel(`${h.emoji} ${h.nome}`)
                .setStyle(style)
        );
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} **${hab.nome}** ${hab.estrelas}\n`;
        habsTexto += `   📝 ${hab.efeito}\n`;
        if (hab.bonus) {
            const b = hab.bonus;
            if (b.finalizacao) habsTexto += `   🦵 Finalização +${b.finalizacao}\n`;
            if (b.velocidade) habsTexto += `   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.fisico) habsTexto += `   💪 Físico +${b.fisico}\n`;
            if (b.dominio) habsTexto += `   ⚽ Domínio +${b.dominio}\n`;
            if (b.drible) habsTexto += `   ✨ Drible +${b.drible}\n`;
            if (b.passe) habsTexto += `   ☄️ Passe +${b.passe}\n`;
        }
        if (hab.fatal) habsTexto += `   ⚠️ Fatal personalizado: ≤${hab.fatal}\n`;
        if (hab.rerollChute) habsTexto += `   🔄 Permite rerrolar erro fatal\n`;
        habsTexto += `   📥 Usos: ${hab.usos}\n\n`;
    });
    habsTexto += `⤷ 🚫 **Nenhuma Habilidade**\n   Executar o chute sem bônus adicional de habilidades especiais.\n`;

    const texto = criarMoldePreparacao(
        "✨", 
        "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦 𝗗𝗘 𝗙𝗜𝗡𝗔𝗟𝗜𝗭𝗔𝗖̧𝗔̃𝗢", 
        `${interaction.user.username}, você possui habilidades que podem potencializar sua finalização! Escolha uma para ativar ou prossiga sem nenhuma.`,
        [
            { emoji: "⚽", label: "Técnica", valor: `${tipoInfo.emoji} ${tipoInfo.label}` },
            { emoji: "💪", label: "Força", valor: forca.nome }
        ], 
        "Clique em uma habilidade para ativá-la."
    ) + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username} • Habilidades`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ PASSO 3/3 — SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: '⏳ 30 segundos | Habilidades detectadas nos cargos do Discord' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Apenas você pode escolher!', flags: 64 });
        }
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        let msgConfirm = '';
        
        if (habKey !== 'nenhuma') {
            console.log(`  ✨ Habilidade escolhida: ${habKey}`);
            const res = usarHabilidadeSegura(jogador, habKey);
            if (res.sucesso) {
                habUsada = habKey;
                msgConfirm = res.mensagem;
            } else {
                return i.reply({ content: res.mensagem, flags: 64 });
            }
        } else {
            console.log('  🚫 Nenhuma habilidade selecionada');
        }
        
        await i.update({ embeds: [executarChute(i, tipoInfo, forca, jogador, dados, habUsada)], components: [] });
        if (msgConfirm) await i.followUp({ content: msgConfirm, flags: 64 });
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    });
    
    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.editReply({ content: '⏰ Tempo esgotado!', embeds: [], components: [] }).catch(() => {});
        }
    });
}

// ═══════════════════════════════════════════════════════
// 💥 EXECUTAR O CHUTE
// ═══════════════════════════════════════════════════════
function executarChute(interaction, tipoInfo, forca, jogador, dados, habilidadeKey) {
    console.log(`\n💥 [EXECUTAR CHUTE] ${jogador.nome}`);
    console.log(`  Técnica: ${tipoInfo.label} | Força: ${forca.nome}`);
    
    let bonusChute = jogador._statusTotal?.finalizacao || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatal = Math.max(tipoInfo.fatal, forca.fatal);
    let podeRerrolar = false;
    let gifHabilidade = null;
    let nomeHabilidade = null;
    let habBonus = 0;
    
    // Aplicar bônus da habilidade se selecionada
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            gifHabilidade = habInfo.gif;
            habBonus = habInfo.bonus?.finalizacao || 0;
            if (habInfo.rerollChute) podeRerrolar = true;
            if (habInfo.fatal) chanceFatal = habInfo.fatal;
            
            const aplicado = aplicarBonusHabilidade(jogador, habilidadeKey, { 
                bonusChute, multiplicador, chanceFatal 
            });
            bonusChute = aplicado.bonusChute || bonusChute;
            multiplicador = aplicado.multiplicador || multiplicador;
            chanceFatal = aplicado.chanceFatal || chanceFatal;
            
            console.log(`  Habilidade: ${habInfo.nome} | Bonus: +${habBonus} | Fatal: ≤${chanceFatal}`);
        }
    }
    
    // Rolar o dado
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusChute + bonusTipo + forca.bonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    console.log(`  🎲 Dado: ${dado} | Total base: ${total} | Fatal: ${erroFatal ? 'SIM' : 'NÃO'}`);
    
    // Rerrolar se permitido
    if (podeRerrolar && erroFatal) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        total = Math.floor((novoDado + bonusChute + bonusTipo + forca.bonus) * multiplicador);
        if (total < 1) total = 1;
        erroFatal = novoDado <= chanceFatal;
        rerrolou = true;
        console.log(`  🔄 Rerrol: ${novoDado} | Novo total: ${total} | Fatal: ${erroFatal ? 'SIM' : 'NÃO'}`);
    }
    
    const bonusTotal = bonusTipo + forca.bonus + habBonus;
    const totalFinal = total + habBonus;
    
    console.log(`  💥 Poder Final: ${totalFinal} | Bônus Total: +${bonusTotal} | Multiplicador: x${multiplicador}`);
    
    // Atualizar estatísticas
    if (jogador.estatisticas) {
        jogador.estatisticas.finalizacoes = (jogador.estatisticas.finalizacoes || 0) + 1;
    }
    
    // ═══════════════ ERRO FATAL ═══════════════
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem do Dado", valor: `${rerrolou ? `${dadoOriginal} → ${rerrolou ? 'rerrol' : ''}` : dadoOriginal} (FATAL ≤${chanceFatal})` },
            { emoji: "🦵", label: "Finalização Total", valor: `+${bonusChute}` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo + forca.penalidade}` },
            { emoji: "💥", label: "Poder Final", valor: `${totalFinal} (ANULADO)` }
        ];
        
        const texto = criarMoldeResultado(
            "💥", 
            "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟 𝗡𝗔 𝗙𝗜𝗡𝗔𝗟𝗜𝗭𝗔𝗖̧𝗔̃𝗢", 
            `${interaction.user.username} tentou uma finalização **${tipoInfo.label}** com força **${forca.nome}**${nomeHabilidade ? ` usando **${nomeHabilidade}**` : ''} e errou completamente!`,
            dadosArray, 
            "💨 A bola foi direto para fora de campo! Tiro de meta para o adversário."
        );
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO FATAL • ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('💥 FINALIZAÇÃO FRACASSADA')
            .setDescription(texto)
            .setImage(gifs.erro_fatal || gifs.chute_normal)
            .setFooter({ text: '⚽ Blue Lock • Acontece até com os melhores!' })
            .setTimestamp();
    }
    
    // ═══════════════ CHUTE REALIZADO ═══════════════
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem do Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
        { emoji: "🦵", label: "Finalização Total", valor: `+${bonusChute} (base + bônus)` },
        { emoji: "🎯", label: "Bônus Técnica", valor: `+${bonusTotal} (técnica + força + hab)` },
        { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
        { emoji: "💥", label: "PODER FINAL", valor: `${totalFinal}` }
    ];
    if (habBonus > 0) dadosArray.splice(4, 0, { emoji: "✨", label: "Bônus da Habilidade", valor: `+${habBonus}` });
    
    // Registrar chute para o defensor
    defenderModule.registrarChute({
        poder: totalFinal,
        atacante: interaction.user.username,
        tipo: tipoInfo.label,
        setor: "Ataque"
    });
    
    console.log(`  ✅ Chute registrado! Poder: ${totalFinal} | Defensor deve usar c!defender\n`);
    
    const texto = criarMoldeResultado(
        "⚽", 
        "𝗖𝗛𝗨𝗧𝗘 𝗘𝗫𝗘𝗖𝗨𝗧𝗔𝗗𝗢 𝗖𝗢𝗠 𝗦𝗨𝗖𝗘𝗦𝗦𝗢", 
        `${interaction.user.username} encontrou o momento perfeito e disparou uma finalização **${tipoInfo.label}** com força **${forca.nome}**${nomeHabilidade ? ` potencializada por **${nomeHabilidade}**` : ''}!`,
        dadosArray, 
        `🔥 A bola atravessa o campo em alta velocidade com poder de **${totalFinal} pontos**!\n🧤 O goleiro adversário deve usar \`c!defender\` para tentar evitar o gol!`
    );
    
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setAuthor({ name: `🔥 ${interaction.user.username} • Chute Realizado`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚽ FINALIZAÇÃO EXECUTADA')
        .setDescription(texto)
        .setImage(gifHabilidade || gifs[tipoInfo.gifKey] || gifs.chute_normal)
        .setFooter({ text: '⚽ Blue Lock • Aguardando defesa do goleiro...' })
        .setTimestamp();
}