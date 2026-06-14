const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// 🎨 MOLDE DE PREPARAÇÃO
function criarMoldePreparacao(icone, titulo, descricao, informativos, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    
    informativos.forEach(info => {
        texto += `⤷ ${info.emoji} ${info.label} · \`${info.valor}\`\n`;
    });
    
    texto += `\n◞⚡ ${resultado}\n\n`;
    texto += `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    
    return texto;
}

// 🎨 MOLDE DE RESULTADO
function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado, tempoAcao = null, comandoDefesa = null, comandoInterceptar = null) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    
    dadosArray.forEach(dado => {
        texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`;
    });
    
    texto += `\n◞⚡ ${resultado}\n`;
    
    if (tempoAcao) {
        texto += `\n⏳ ${tempoAcao}\n`;
    }
    
    if (comandoDefesa) {
        texto += `\n🧤 Defesa · \`${comandoDefesa}\``;
    }
    
    if (comandoInterceptar) {
        texto += `\n🚧 Interceptação · \`${comandoInterceptar}\``;
    }
    
    texto += `\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    
    return texto;
}

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

function getJogador(dados, userId, username) {
    if (!dados.jogadores) dados.jogadores = {};
    if (!dados.jogadores[userId]) {
        dados.jogadores[userId] = {
            id: userId,
            nome: username,
            status: { passe: 0, velocidade: 0, dominio: 0 },
            estatisticas: { passes: 0, assistencias: 0 }
        };
    }
    return dados.jogadores[userId];
}

module.exports = {
    name: 'passe',
    description: '☄️ Tenta passar a bola',
    aliases: ['passar', 'pass'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        const jogador = getJogador(dados, message.author.id, message.author.username);
        
        const alvo = message.mentions.users.first();
        if (!alvo) return message.reply('❌ Mencione o jogador para receber o passe!');
        
        await mostrarTiposPasse(message, jogador, alvo, dados);
    }
};

async function mostrarTiposPasse(message, jogador, alvo, dados) {
    const tiposRow = new ActionRowBuilder();
    tiposPasse.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "🎯 Passe Colocado") estilo = ButtonStyle.Success;
        if (t.nome === "🦶 Passe Trivela") estilo = ButtonStyle.Danger;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const bonusPasse = jogador.status?.passe || 0;
    
    const informativos = [
        { emoji: "☄️", label: "Passe Base", valor: `+${bonusPasse}` },
        { emoji: "🎯", label: "Alvo", valor: `${alvo.username}` },
        { emoji: "🎯", label: "Tipo", valor: "Escolha o estilo do passe" }
    ];
    
    let descricaoTipos = `\nㅤㅤ⌞ ☄️ TIPOS DE PASSE ⌝\n\n`;
    tiposPasse.forEach(t => {
        descricaoTipos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Dif.Mín: ${t.dificuldadeMin}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("☄️", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗣𝗔𝗦𝗦𝗘", `${message.author.username} vai passar a bola para ${alvo.username}!`, informativos, "Escolha o tipo nos botões abaixo.") + descricaoTipos;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `☄️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 TIPO DE PASSE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposPasse.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        await mostrarForcasPasse(i, tipo, jogador, alvo, dados);
    });
}

async function mostrarForcasPasse(interaction, tipoInfo, jogador, alvo, dados) {
    const forcaRow = new ActionRowBuilder();
    forcasPasse.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const informativos = [
        { emoji: "⚡", label: "Tipo", valor: `${tipoInfo.nome}` },
        { emoji: "💪", label: "Força", valor: "Escolha a potência" }
    ];
    
    let descricaoForcas = `\nㅤㅤ⌞ 💪 FORÇAS DISPONÍVEIS ⌝\n\n`;
    forcasPasse.forEach(f => {
        descricaoForcas += `⤷ ${f.nome}\n   Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\n   📝 ${f.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("⚖️", "𝗗𝗘𝗙𝗜𝗡𝗔 𝗔 𝗙𝗢𝗥𝗖̧𝗔", `${interaction.user.username} define a potência do passe!`, informativos, "Escolha a força nos botões abaixo.") + descricaoForcas;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `☄️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ POTÊNCIA DO PASSE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito!', flags: 64 });
        collector.stop();
        const forca = forcasPasse.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogador, 'passe');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarPasse(i, tipoInfo, forca, jogador, alvo, null)], components: [] });
        } else {
            await mostrarHabilidadesPasse(i, tipoInfo, forca, jogador, alvo, habilidades);
        }
    });
}

async function mostrarHabilidadesPasse(interaction, tipoInfo, forca, jogador, alvo, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.passe) habsTexto += `   ☄️ +${hab.bonus.passe} Passe\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o passe!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

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
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogador, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarPasse(i, tipoInfo, forca, jogador, alvo, habUsada)], components: [] });
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    });
}

function executarPasse(interaction, tipoInfo, forca, jogador, alvo, habilidadeKey) {
    let bonusPasse = jogador.status?.passe || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let dificuldadeMin = tipoInfo.dificuldadeMin;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.passe || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusPasse + bonusTipo + forca.bonus) * multiplicador);
    if (total < 1) total = 1;
    const totalComHabilidade = total + habBonus;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo + forca.bonus;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo + forca.penalidade}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${interaction.user.username} tentou ${tipoInfo.nome} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e isolou a bola!`, dadosArray, "A bola foi direto para fora!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    const sucesso = totalComHabilidade >= dificuldadeMin;
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
        { emoji: "☄️", label: "Passe Base", valor: `+${bonusPasse}` },
        { emoji: "🎯", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
        { emoji: "💥", label: "Poder Final", valor: `${totalComHabilidade} (mín: ${dificuldadeMin})` }
    ];
    if (habBonus > 0) dadosArray.splice(4, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    const texto = criarMoldeResultado(sucesso ? "✅" : "⚠️", sucesso ? "𝗣𝗔𝗦𝗦𝗘 𝗣𝗘𝗥𝗙𝗘𝗜𝗧𝗢" : "𝗣𝗔𝗦𝗦𝗘 𝗣𝗘𝗥𝗜𝗚𝗢𝗦𝗢", `${interaction.user.username} ${sucesso ? 'encontrou' : 'tentou passar para'} ${alvo.username}!`, dadosArray, sucesso ? "O passe chega limpo nos pés do receptor!" : "O companheiro precisa se esforçar para dominar!", null, null, null);
    
    return new EmbedBuilder()
        .setColor(sucesso ? '#2ECC71' : '#FFA500')
        .setAuthor({ name: sucesso ? `✅ ${interaction.user.username}` : `⚠️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs.passe_normal)
        .setTimestamp();
}