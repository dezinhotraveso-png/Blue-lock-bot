const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

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

function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    dadosArray.forEach(dado => {
        texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`;
    });
    texto += `\n◞⚡ ${resultado}\n\n`;
    texto += `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

const tiposDesarme = [
    { nome: "🛡️ Desarme Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Tentativa básica.", emoji: "🛡️" },
    { nome: "⚡ Desarme Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Desarme rápido.", emoji: "⚡" },
    { nome: "💪 Desarme Físico", bonus: 7, penalidade: -3, fatal: 8, desc: "Usa força.", emoji: "💪" },
    { nome: "🎭 Desarme de Classe", bonus: 4, penalidade: -1, fatal: 5, desc: "Desarme limpo.", emoji: "🎭" },
    { nome: "🦵 Carrinho", bonus: 6, penalidade: -4, fatal: 10, desc: "Carrinho.", emoji: "🦵" }
];

function getJogador(dados, userId, username) {
    if (!dados.jogadores) dados.jogadores = {};
    if (!dados.jogadores[userId]) {
        dados.jogadores[userId] = {
            id: userId,
            nome: username,
            status: { desarme: 0, fisico: 0 },
            estatisticas: { desarmes: 0 }
        };
    }
    return dados.jogadores[userId];
}

module.exports = {
    name: 'desarmar',
    description: '🛡️ Tenta desarmar um adversário',
    aliases: ['roubar', 'tackle'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        const jogador = getJogador(dados, message.author.id, message.author.username);
        
        const alvo = message.mentions.users.first();
        if (!alvo) return message.reply('❌ Mencione o jogador para desarmar!');
        
        await mostrarTiposDesarme(message, jogador, alvo, dados);
    }
};

async function mostrarTiposDesarme(message, jogador, alvo, dados) {
    const row = new ActionRowBuilder();
    tiposDesarme.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Desarme Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🦵 Carrinho") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const bonusDesarme = jogador.status?.desarme || 0;
    const bonusFisico = jogador.status?.fisico || 0;
    const bonusDrible = 5;
    
    const informativos = [
        { emoji: "🛡️", label: "Desarme", valor: `+${bonusDesarme}` },
        { emoji: "💪", label: "Físico", valor: `+${bonusFisico}` },
        { emoji: "✨", label: "Drible do Alvo", valor: `+${bonusDrible}` },
        { emoji: "🎯", label: "Alvo", valor: `${alvo.username}` },
        { emoji: "⚔️", label: "Estilo", valor: "Escolha a técnica" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ ⚔️ ESTILOS DE DESARME ⌝\n\n`;
    tiposDesarme.forEach(t => {
        descricaoEstilos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("🛡️", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗗𝗘𝗦𝗔𝗥𝗠𝗘", `${message.author.username} vai tentar desarmar ${alvo.username}!`, informativos, "Escolha a técnica nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setAuthor({ name: `🛡️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🛡️ ESTILO DE DESARME')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposDesarme.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogador, 'desarme');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDesarme(i, tipo, jogador, alvo, null)], components: [] });
        } else {
            await mostrarHabilidadesDesarme(i, tipo, jogador, alvo, habilidades);
        }
    });
}

async function mostrarHabilidadesDesarme(interaction, tipoInfo, jogador, alvo, habilidades) {
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
        if (hab.bonus?.desarme) habsTexto += `   🛡️ +${hab.bonus.desarme} Desarme\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o desarme!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

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
        await i.update({ embeds: [executarDesarme(i, tipoInfo, jogador, alvo, habUsada)], components: [] });
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    });
}

function executarDesarme(interaction, tipoInfo, jogador, alvo, habilidadeKey) {
    let bonusDesarme = (jogador.status?.desarme || 0) + tipoInfo.bonus;
    let bonusFisico = jogador.status?.fisico || 0;
    let bonusDrible = 5;
    let chanceFatalFinal = tipoInfo.fatal;
    let habBonus = 0;
    let nomeHabilidade = null;
    let gifHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            gifHabilidade = habInfo.gif;
            habBonus = habInfo.bonus?.desarme || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dadoAtacante = Math.floor(Math.random() * 40) + 1;
    const dadoDefensor = Math.floor(Math.random() * 40) + 1;
    let totalAtacante = dadoAtacante + bonusDesarme + bonusFisico;
    let totalDefensor = dadoDefensor + bonusDrible;
    let erroFatal = dadoAtacante <= chanceFatalFinal;
    const totalAtacanteComHab = totalAtacante + habBonus;
    const bonusTotal = tipoInfo.bonus;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dadoAtacante} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${tipoInfo.penalidade}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e cometeu falta!`, dadosArray, "FALTA! O adversário mantém a posse!");
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALTA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    const sucesso = totalAtacanteComHab > totalDefensor;
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${dadoAtacante}` },
        { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "🛡️", label: "Poder Desarme", valor: `${totalAtacanteComHab}` },
        { emoji: "✨", label: "Poder Drible", valor: `${totalDefensor}` }
    ];
    if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    const texto = criarMoldeResultado(sucesso ? "✅" : "❌", sucesso ? "𝗗𝗘𝗦𝗔𝗥𝗠𝗘 𝗣𝗘𝗥𝗙𝗘𝗜𝗧𝗢" : "𝗗𝗘𝗦𝗔𝗥𝗠𝗘 𝗙𝗔𝗟𝗛𝗢𝗨", `${interaction.user.username} ${sucesso ? 'roubou a bola com maestria!' : 'tentou desarmar ${alvo.username}!'}`, dadosArray, sucesso ? "Você recuperou a posse da bola!" : "O adversário mantém a posse!");
    
    return new EmbedBuilder()
        .setColor(sucesso ? '#00FF00' : '#FF0000')
        .setAuthor({ name: sucesso ? `✅ ${interaction.user.username}` : `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs.desarmar)
        .setTimestamp();
}