const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades, aplicarBonusHabilidade } = require('../../utils/habilidades.js');
const { calcularStatusTotal } = require('../../utils/statusCalculator.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ═══════════════════════════════════════════════════════
// 🎨 MOLDE DE PREPARAÇÃO
// ═══════════════════════════════════════════════════════
function criarMoldePreparacao(icone, titulo, descricao, informativos, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 INFORMAÇÕES DA DEFESA ⌝\n\n`;
    informativos.forEach(info => texto += `⤷ ${info.emoji} ${info.label} · \`${info.valor}\`\n`);
    texto += `\n◞⚡ ${resultado}\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

// ═══════════════════════════════════════════════════════
// 🎨 MOLDE DE RESULTADO
// ═══════════════════════════════════════════════════════
function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 DETALHES DA DEFESA ⌝\n\n`;
    dadosArray.forEach(dado => texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`);
    texto += `\n◞⚡ ${resultado}\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

// ═══════════════════════════════════════════════════════
// 🧤 ESTILOS DE DEFESA
// ═══════════════════════════════════════════════════════
const estilosDefesa = [
    { 
        nome: "🧤 Defesa Normal", bonus: 0, penalidade: 0, fatal: 3, multiplicador: 1.0,
        desc: "Defesa padrão, sem bônus especiais. O goleiro mantém posição neutra, equilibrando segurança e alcance. Ideal para chutes previsíveis."
    },
    { 
        nome: "⚡ Defesa Rápida", bonus: 5, penalidade: -2, fatal: 6, multiplicador: 1.1,
        desc: "Reação rápida com impulsão explosiva. Excelente contra chutes colocados e cavadinhas, mas sacrifica um pouco da firmeza nas mãos."
    },
    { 
        nome: "💪 Defesa Forte", bonus: 8, penalidade: -5, fatal: 9, multiplicador: 1.2,
        desc: "Força bruta e punhos cerrados. Muito eficaz contra chutes potentes e de longa distância, mas a agilidade é comprometida."
    },
    { 
        nome: "🎭 Espalmada", bonus: 3, penalidade: 0, fatal: 4, multiplicador: 1.0,
        desc: "Espalma a bola para escanteio. Técnica segura que evita rebotes, mas não permite segurar a posse de bola."
    },
    { 
        nome: "🦵 Defesa com Pé", bonus: 4, penalidade: -1, fatal: 5, multiplicador: 1.0,
        desc: "Defesa usando os pés. Extremamente eficaz contra chutes rasteiros e finalizações de curta distância."
    }
];

// ═══════════════════════════════════════════════════════
// 💪 FORÇAS DE DEFESA
// ═══════════════════════════════════════════════════════
const forcasDefesa = [
    { 
        nome: "🟢 Defesa Leve", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2,
        desc: "Defesa suave e controlada. Prioriza a segurança e o posicionamento. Pouco efetiva contra chutes muito fortes."
    },
    { 
        nome: "🟡 Defesa Média", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5,
        desc: "Defesa equilibrada entre segurança e eficácia. A melhor relação custo-benefício para a maioria das situações."
    },
    { 
        nome: "🔴 Defesa Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8,
        desc: "Defesa com máxima intensidade e extensão corporal. Capaz de alcançar bolas impossíveis, mas arriscada e desgastante."
    }
];

// ═══════════════════════════════════════════════════════
// 📦 ARMAZENAR ÚLTIMO CHUTE
// ═══════════════════════════════════════════════════════
let ultimoChute = null;

function registrarChute(d) { 
    ultimoChute = { 
        poder: d.poder, atacante: d.atacante, tipo: d.tipo, 
        setor: d.setor || "Ataque", timestamp: Date.now() 
    }; 
    console.log(`📥 Chute registrado: ${d.atacante} → Poder ${d.poder} | Tipo: ${d.tipo}`);
}

function limparChutesAntigos() { 
    if (ultimoChute && Date.now() - ultimoChute.timestamp > 300000) {
        console.log('🗑️ Chute antigo removido (mais de 5 minutos)');
        ultimoChute = null; 
    }
}

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
            estatisticas: { defesas: 0, golsSofridos: 0, partidas: 0 }
        };
    }
    if (!dados.jogadores[userId].status) dados.jogadores[userId].status = { ...STATUS_PADRAO };
    if (!dados.jogadores[userId].habilidades) dados.jogadores[userId].habilidades = {};
    if (!dados.jogadores[userId].estatisticas) dados.jogadores[userId].estatisticas = { defesas: 0, golsSofridos: 0, partidas: 0 };
    
    if (dados.jogadores[userId].status.defenseGk !== undefined) {
        dados.jogadores[userId].status.defesaGk = dados.jogadores[userId].status.defenseGk;
        delete dados.jogadores[userId].status.defenseGk;
    }
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
        console.log('⚠️ Membro não encontrado para buscar habilidades de defesa');
        return encontradas;
    }
    
    console.log(`\n🔍 [DEFESA] Buscando habilidades nos cargos de ${membro.user.username}...`);
    
    membro.roles.cache.forEach(cargo => {
        const nomeCargo = cargo.name.toLowerCase();
        
        for (const [key, hab] of Object.entries(todasHabilidades)) {
            if (nomeCargo.includes(hab.nome.toLowerCase())) {
                if (!encontradas.find(h => h.key === key)) {
                    console.log(`  ✅ Encontrada: ${hab.emoji} ${hab.nome} (${hab.estrelas}) - Tipo: ${hab.tipo}`);
                    encontradas.push({
                        key, nome: hab.nome, emoji: hab.emoji || '✨',
                        estrelas: hab.estrelas || '★★★', efeito: hab.efeito || hab.desc || '',
                        bonus: hab.bonus || {}, tipo: hab.tipo || '',
                        gif: hab.gif || null, rerollDefesa: hab.rerollDefesa || false,
                        fatal: hab.fatal || null, usos: hab.usos || 1
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
    
    if (!jogador.habilidades[habKey]) {
        jogador.habilidades[habKey] = {
            nome: habInfo.nome,
            usosRestantes: habInfo.usos || 1,
            tipo: habInfo.tipo || 'defesa'
        };
        console.log(`✅ Habilidade "${habInfo.nome}" criada automaticamente para ${jogador.nome} com ${habInfo.usos || 1} uso(s)`);
    }
    
    if (jogador.habilidades[habKey].usosRestantes <= 0) {
        return { sucesso: false, mensagem: `❌ Usos esgotados para **${habInfo.emoji} ${habInfo.nome}**! Aguarde a próxima partida.` };
    }
    
    jogador.habilidades[habKey].usosRestantes--;
    const restantes = jogador.habilidades[habKey].usosRestantes;
    
    let detalhesBonus = '';
    if (habInfo.bonus) {
        const b = habInfo.bonus;
        if (b.defesaGk) detalhesBonus += `\n   🧤 Defesa GK +${b.defesaGk}`;
        if (b.velocidade) detalhesBonus += `\n   ⚡ Velocidade +${b.velocidade}`;
        if (b.fisico) detalhesBonus += `\n   💪 Físico +${b.fisico}`;
        if (b.interceptacao) detalhesBonus += `\n   🎯 Interceptação +${b.interceptacao}`;
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
    name: 'defender',
    description: '🧤 Tenta defender um chute adversário com diferentes estilos e intensidades',
    aliases: ['defesa', 'save'],
    registrarChute,
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        const jogador = getJogador(dados, message.author.id, message.author.username);
        limparChutesAntigos();
        
        if (!ultimoChute) {
            return message.reply('❌ **Nenhum chute para defender!**\nAguarde um atacante usar `c!chute` primeiro.');
        }
        
        const membro = await message.guild.members.fetch(message.author.id).catch(() => null);
        jogador._statusTotal = calcularStatusTotal(jogador, membro, listarTodasHabilidades());
        jogador._membro = membro;
        
        console.log(`\n🧤 [DEFESA] ${jogador.nome} vai defender chute de ${ultimoChute.atacante}`);
        console.log(`📊 Status Total: Defesa GK +${jogador._statusTotal.defesaGk}`);
        console.log(`🎯 Chute adversário: Poder ${ultimoChute.poder} | Tipo: ${ultimoChute.tipo}`);
        
        await mostrarEstilosDefesa(message, jogador, dados);
    }
};

// ═══════════════════════════════════════════════════════
// 🧤 TELA 1: ESCOLHER ESTILO DE DEFESA
// ═══════════════════════════════════════════════════════
async function mostrarEstilosDefesa(message, jogador, dados) {
    const row = new ActionRowBuilder();
    estilosDefesa.forEach(e => {
        let style = ButtonStyle.Primary;
        if (e.nome.includes("Rápida")) style = ButtonStyle.Success;
        if (e.nome.includes("Forte")) style = ButtonStyle.Danger;
        if (e.nome.includes("Espalmada")) style = ButtonStyle.Secondary;
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`estilo_${e.nome.replace(/ /g, '_')}`)
                .setLabel(e.nome)
                .setStyle(style)
        );
    });

    const bonus = jogador._statusTotal?.defesaGk || 0;
    
    const informativos = [
        { emoji: "👤", label: "Goleiro", valor: jogador.nome || message.author.username },
        { emoji: "🎯", label: "Poder do Chute", valor: `${ultimoChute.poder}` },
        { emoji: "⚽", label: "Técnica do Chute", valor: ultimoChute.tipo },
        { emoji: "👤", label: "Atacante", valor: ultimoChute.atacante },
        { emoji: "🧤", label: "Defesa Total", valor: `+${bonus}` },
        { emoji: "🛡️", label: "Estilo", valor: "Escolha abaixo" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ 🧤 ESTILOS DE DEFESA ⌝\n\n`;
    estilosDefesa.forEach(e => {
        descricaoEstilos += `⤷ **${e.nome}**\n`;
        descricaoEstilos += `   📈 Bônus: +${e.bonus} | ⚠️ Fatal: ≤${e.fatal} | ✖️ Mult: x${e.multiplicador}\n`;
        descricaoEstilos += `   📝 ${e.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao(
        "🧤", 
        "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗘𝗦𝗧𝗜𝗟𝗢 𝗗𝗘 𝗗𝗘𝗙𝗘𝗦𝗔", 
        `${message.author.username} se prepara para defender o chute de **${ultimoChute.atacante}**! Sua defesa total é **+${bonus}** (incluindo bônus de posição, nacionalidade, talento e armas).`,
        informativos, 
        "Escolha o estilo de defesa nos botões abaixo."
    ) + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setAuthor({ name: `🧤 ${message.author.username} • Defesa`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🧤 PASSO 1/3 — ESTILO DE DEFESA')
        .setDescription(texto)
        .setFooter({ text: '⏳ 30 segundos para escolher | c!defender' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: '❌ Apenas o goleiro pode escolher o estilo de defesa!', flags: 64 });
        }
        collector.stop();
        const estilo = estilosDefesa.find(e => e.nome === i.customId.replace('estilo_', '').replace(/_/g, ' '));
        console.log(`  🧤 Estilo escolhido: ${estilo.nome}`);
        await mostrarForcasDefesa(i, estilo, jogador, dados);
    });
    
    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await msg.edit({ content: '⏰ Tempo esgotado! Use `c!defender` novamente.', embeds: [], components: [] }).catch(() => {});
        }
    });
}

// ═══════════════════════════════════════════════════════
// 💪 TELA 2: ESCOLHER FORÇA DA DEFESA
// ═══════════════════════════════════════════════════════
async function mostrarForcasDefesa(interaction, estilo, jogador, dados) {
    const row = new ActionRowBuilder();
    forcasDefesa.forEach(f => {
        let style = ButtonStyle.Secondary;
        if (f.nome.includes("Média")) style = ButtonStyle.Primary;
        if (f.nome.includes("Forte")) style = ButtonStyle.Danger;
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`forca_${f.nome.replace(/ /g, '_')}`)
                .setLabel(f.nome)
                .setStyle(style)
        );
    });

    let descricaoForcas = `\nㅤㅤ⌞ 💪 INTENSIDADE DA DEFESA ⌝\n\n`;
    forcasDefesa.forEach(f => {
        descricaoForcas += `⤷ **${f.nome}**\n`;
        descricaoForcas += `   📈 Bônus: +${f.bonus} | ✖️ Mult: x${f.multiplicador} | ⚠️ Fatal: ≤${f.fatal}\n`;
        descricaoForcas += `   📝 ${f.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao(
        "⚖️", 
        "𝗗𝗘𝗙𝗜𝗡𝗔 𝗔 𝗜𝗡𝗧𝗘𝗡𝗦𝗜𝗗𝗔𝗗𝗘 𝗗𝗔 𝗗𝗘𝗙𝗘𝗦𝗔", 
        `${interaction.user.username} define a intensidade da defesa! Estilo escolhido: **${estilo.nome}**`,
        [
            { emoji: "🧤", label: "Estilo", valor: estilo.nome },
            { emoji: "💪", label: "Intensidade", valor: "Escolha abaixo" }
        ], 
        "Escolha a força da defesa nos botões."
    ) + descricaoForcas;

    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setAuthor({ name: `🧤 ${interaction.user.username} • Intensidade`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ PASSO 2/3 — FORÇA DA DEFESA')
        .setDescription(texto)
        .setFooter({ text: '⏳ 30 segundos | Estilo: ' + estilo.nome });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Apenas o goleiro pode escolher!', flags: 64 });
        }
        collector.stop();
        const forca = forcasDefesa.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        console.log(`  💪 Força escolhida: ${forca.nome}`);
        
        const habilidades = buscarHabilidadesPorCargos(jogador._membro);
        
        if (habilidades.length === 0) {
            console.log('  ⚡ Nenhuma habilidade, executando defesa direta');
            await i.update({ embeds: [executarDefesa(i, estilo, forca, jogador, dados, null)], components: [] });
            ultimoChute = null;
        } else {
            console.log(`  ✨ ${habilidades.length} habilidade(s), mostrando seleção`);
            await mostrarHabilidadesDefesa(i, estilo, forca, jogador, dados, habilidades);
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
async function mostrarHabilidadesDefesa(interaction, estilo, forca, jogador, dados, habilidades) {
    const row = new ActionRowBuilder();
    
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('hab_nenhuma')
            .setLabel("🚫 Nenhuma Habilidade")
            .setStyle(ButtonStyle.Secondary)
    );
    
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

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DEFENSIVAS ⌝\n\n`;
    habilidades.forEach(h => {
        habsTexto += `⤷ ${h.emoji} **${h.nome}** ${h.estrelas}\n`;
        habsTexto += `   📝 ${h.efeito}\n`;
        if (h.bonus) {
            const b = h.bonus;
            if (b.defesaGk) habsTexto += `   🧤 Defesa GK +${b.defesaGk}\n`;
            if (b.velocidade) habsTexto += `   ⚡ Velocidade +${b.velocidade}\n`;
            if (b.fisico) habsTexto += `   💪 Físico +${b.fisico}\n`;
            if (b.interceptacao) habsTexto += `   🎯 Interceptação +${b.interceptacao}\n`;
        }
        if (h.fatal) habsTexto += `   ⚠️ Fatal: ≤${h.fatal}\n`;
        if (h.rerollDefesa) habsTexto += `   🔄 Permite rerrolar erro fatal\n`;
        habsTexto += `   📥 Usos: ${h.usos}\n\n`;
    });
    habsTexto += `⤷ 🚫 **Nenhuma Habilidade**\n   Executar a defesa sem bônus adicional de habilidades.\n`;

    const texto = criarMoldePreparacao(
        "✨", 
        "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦 𝗗𝗘 𝗗𝗘𝗙𝗘𝗦𝗔", 
        `${interaction.user.username}, você possui habilidades defensivas! Escolha uma para ativar ou prossiga sem nenhuma.`,
        [
            { emoji: "🧤", label: "Estilo", valor: estilo.nome },
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
        let habUsada = null, msgConfirm = '';
        
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
        
        await i.update({ embeds: [executarDefesa(i, estilo, forca, jogador, dados, habUsada)], components: [] });
        ultimoChute = null;
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
// 🛡️ EXECUTAR A DEFESA
// ═══════════════════════════════════════════════════════
function executarDefesa(interaction, estilo, forca, jogador, dados, habilidadeKey) {
    console.log(`\n🛡️ [EXECUTAR DEFESA] ${jogador.nome}`);
    console.log(`  Estilo: ${estilo.nome} | Força: ${forca.nome}`);
    console.log(`  Chute adversário: Poder ${ultimoChute.poder}`);
    
    let bonusDefesa = jogador._statusTotal?.defesaGk || 0;
    const dificuldade = ultimoChute.poder;
    let chanceFatal = Math.max(estilo.fatal, forca.fatal);
    let mult = estilo.multiplicador * forca.multiplicador;
    let rerrolar = false, gifHab = null, nomeHab = null, habBonus = 0;
    
    if (habilidadeKey) {
        const hab = listarTodasHabilidades()[habilidadeKey];
        if (hab) {
            nomeHab = hab.nome;
            gifHab = hab.gif;
            habBonus = hab.bonus?.defesaGk || 0;
            if (hab.rerollDefesa) rerrolar = true;
            if (hab.fatal) chanceFatal = hab.fatal;
            
            const apl = aplicarBonusHabilidade(jogador, habilidadeKey, { 
                bonusDefesa, multiplicador: mult, chanceFatal 
            });
            bonusDefesa = apl.bonusDefesa || bonusDefesa;
            mult = apl.multiplicador || mult;
            chanceFatal = apl.chanceFatal || chanceFatal;
            
            console.log(`  Habilidade: ${hab.nome} | Bonus: +${habBonus} | Fatal: ≤${chanceFatal}`);
        }
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusDefesa + estilo.bonus + forca.bonus) * mult);
    if (total < 1) total = 1;
    let fatal = dado <= chanceFatal, rerrolou = false;
    const dadoOrig = dado;
    
    console.log(`  🎲 Dado: ${dado} | Total: ${total} | Fatal: ${fatal ? 'SIM' : 'NÃO'}`);
    
    if (rerrolar && fatal) {
        const nd = Math.floor(Math.random() * 40) + 1;
        total = Math.floor((nd + bonusDefesa + estilo.bonus + forca.bonus) * mult);
        if (total < 1) total = 1;
        fatal = nd <= chanceFatal;
        rerrolou = true;
        console.log(`  🔄 Rerrol: ${nd} | Novo total: ${total} | Fatal: ${fatal ? 'SIM' : 'NÃO'}`);
    }
    
    const bonusTotal = estilo.bonus + forca.bonus + habBonus;
    const totalFinal = total + habBonus;
    const diff = totalFinal - dificuldade;
    
    console.log(`  🛡️ Defesa Final: ${totalFinal} | Chute: ${dificuldade} | Diff: ${diff >= 0 ? '+' : ''}${diff}`);
    
    if (jogador.estatisticas) {
        if (fatal || totalFinal < dificuldade) {
            jogador.estatisticas.golsSofridos = (jogador.estatisticas.golsSofridos || 0) + 1;
        } else {
            jogador.estatisticas.defesas = (jogador.estatisticas.defesas || 0) + 1;
        }
    }
    
    // ═══════════════ FRANGUEIRA FATAL ═══════════════
    if (fatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHab || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem do Dado", valor: `${rerrolou ? `${dadoOrig} → rerrol` : dadoOrig} (FATAL ≤${chanceFatal})` },
            { emoji: "🧤", label: "Defesa Total", valor: `+${bonusDefesa}` },
            { emoji: "💥", label: "Defesa Final", valor: `${totalFinal} (ANULADA)` },
            { emoji: "🎯", label: "Força do Chute", valor: `${dificuldade}` }
        ];
        
        const texto = criarMoldeResultado(
            "💥", 
            "𝗙𝗥𝗔𝗡𝗚𝗨𝗘𝗜𝗥𝗔 𝗙𝗔𝗧𝗔𝗟", 
            `${interaction.user.username} tentou defender com **${estilo.nome}** ${forca.nome}${nomeHab ? ` usando **${nomeHab}**` : ''} e falhou completamente!`,
            dadosArray, 
            "⚽ GOL INCONTESTÁVEL! A bola entrou sem chances de defesa!"
        );
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FRANGUEIRA • ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('💥 DEFESA FRACASSADA')
            .setDescription(texto)
            .setImage(gifs.erro_fatal || gifs.defesa)
            .setFooter({ text: '⚽ Blue Lock • Até os melhores goleiros falham!' })
            .setTimestamp();
    }
    
    // ═══════════════ DEFESA REALIZADA ═══════════════
    const defendeu = totalFinal >= dificuldade;
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHab || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem do Dado", valor: `${rerrolou ? `${dadoOrig} → rerrol` : dadoOrig}` },
        { emoji: "🧤", label: "Defesa Total", valor: `+${bonusDefesa} (base + bônus)` },
        { emoji: "🎯", label: "Bônus Estilo/Força", valor: `+${bonusTotal}` },
        { emoji: "✖️", label: "Multiplicador", valor: `x${mult}` },
        { emoji: "📈", label: "DEFESA FINAL", valor: `${totalFinal}` },
        { emoji: "🎯", label: "Força do Chute", valor: `${dificuldade}` },
        { emoji: "📊", label: "Diferença", valor: `${diff >= 0 ? '+' : ''}${diff}` }
    ];
    if (habBonus > 0) dadosArray.splice(5, 0, { emoji: "✨", label: "Bônus da Habilidade", valor: `+${habBonus}` });
    
    const resultado = defendeu 
        ? `🧤 Defesa perfeita! O goleiro defendeu com **${diff} pontos** de sobra! A bola foi segura com firmeza!` 
        : `⚽ O chute foi forte demais! A bola entra no gol por **${Math.abs(diff)} pontos** de diferença!`;
    
    console.log(`  ${defendeu ? '✅ DEFENDEU!' : '❌ GOL SOFRIDO!'}\n`);
    
    const texto = criarMoldeResultado(
        defendeu ? "🧤" : "⚽", 
        defendeu ? "𝗗𝗘𝗙𝗘𝗦𝗔 𝗥𝗘𝗔𝗟𝗜𝗭𝗔𝗗𝗔 𝗖𝗢𝗠 𝗦𝗨𝗖𝗘𝗦𝗦𝗢" : "𝗚𝗢𝗟 𝗦𝗢𝗙𝗥𝗜𝗗𝗢", 
        `${interaction.user.username} ${defendeu ? 'fez uma defesa incrível e evitou o gol!' : 'não conseguiu alcançar a bola e sofreu o gol!'}`,
        dadosArray, 
        resultado
    );
    
    return new EmbedBuilder()
        .setColor(defendeu ? '#2ECC71' : '#E74C3C')
        .setAuthor({ 
            name: `${defendeu ? '🧤' : '⚽'} ${interaction.user.username} • ${defendeu ? 'Defesa!' : 'Gol!'}`, 
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTitle(defendeu ? '🧤 DEFESA REALIZADA' : '⚽ GOL SOFRIDO')
        .setDescription(texto)
        .setImage(gifHab || (defendeu ? gifs.defesa : gifs.chute_normal))
        .setFooter({ text: `⚽ Blue Lock • ${defendeu ? 'Grande defesa!' : 'O atacante levou a melhor!'}` })
        .setTimestamp();
}