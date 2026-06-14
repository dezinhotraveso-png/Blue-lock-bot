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

function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado, tempoAcao = null, comandoDefesa = null, comandoInterceptar = null) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    dadosArray.forEach(dado => {
        texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`;
    });
    texto += `\n◞⚡ ${resultado}\n`;
    if (tempoAcao) texto += `\n⏳ ${tempoAcao}\n`;
    if (comandoDefesa) texto += `\n🧤 Defesa · \`${comandoDefesa}\``;
    if (comandoInterceptar) texto += `\n🚧 Interceptação · \`${comandoInterceptar}\``;
    texto += `\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    return texto;
}

const tiposDrible = [
    { nome: "✨ Drible Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Drible básico.", emoji: "✨" },
    { nome: "⚡ Drible Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Drible rápido.", emoji: "⚡" },
    { nome: "🎭 Drible Fantasia", bonus: 8, penalidade: -5, fatal: 10, desc: "Drible com estilo.", emoji: "🎭" },
    { nome: "🔄 Drible Elástico", bonus: 6, penalidade: -3, fatal: 7, desc: "Drible elástico.", emoji: "🔄" },
    { nome: "💨 Arrancada", bonus: 4, penalidade: -1, fatal: 5, desc: "Explosão de velocidade.", emoji: "💨" }
];

function getJogador(dados, userId, username) {
    if (!dados.jogadores) dados.jogadores = {};
    if (!dados.jogadores[userId]) {
        dados.jogadores[userId] = {
            id: userId,
            nome: username,
            status: { drible: 0, velocidade: 0 },
            estatisticas: { dribles: 0 }
        };
    }
    return dados.jogadores[userId];
}

module.exports = {
    name: 'driblar',
    description: '✨ Tenta driblar um defensor',
    aliases: ['drible'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        const jogador = getJogador(dados, message.author.id, message.author.username);
        await mostrarTiposDrible(message, jogador, dados);
    }
};

async function mostrarTiposDrible(message, jogador, dados) {
    const row = new ActionRowBuilder();
    tiposDrible.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Drible Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🎭 Drible Fantasia") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const bonusDrible = jogador.status?.drible || 0;
    const bonusVelocidade = jogador.status?.velocidade || 0;
    const bonusDesarme = 5;
    
    const informativos = [
        { emoji: "✨", label: "Drible", valor: `+${bonusDrible}` },
        { emoji: "⚡", label: "Velocidade", valor: `+${bonusVelocidade}` },
        { emoji: "🛡️", label: "Defensor", valor: `+${bonusDesarme}` },
        { emoji: "🎯", label: "Estilo", valor: "Escolha o movimento" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ ✨ ESTILOS DE DRIBLE ⌝\n\n`;
    tiposDrible.forEach(t => {
        descricaoEstilos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("✨", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗗𝗥𝗜𝗕𝗟𝗘", `${message.author.username} vai tentar passar pelo defensor!`, informativos, "Escolha o estilo nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `✨ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 ESTILO DE DRIBLE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const tipo = tiposDrible.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogador, 'drible');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDrible(i, tipo, jogador, null)], components: [] });
        } else {
            await mostrarHabilidadesDrible(i, tipo, jogador, habilidades);
        }
    });
}

async function mostrarHabilidadesDrible(interaction, tipoInfo, jogador, habilidades) {
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
        if (hab.bonus?.drible) habsTexto += `   ✨ +${hab.bonus.drible} Drible\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o drible!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

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
        await i.update({ embeds: [executarDrible(i, tipoInfo, jogador, habUsada)], components: [] });
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    });
}

function executarDrible(interaction, tipoInfo, jogador, habilidadeKey) {
    let bonusDrible = (jogador.status?.drible || 0) + tipoInfo.bonus;
    let bonusVelocidade = jogador.status?.velocidade || 0;
    let bonusDesarme = 5;
    let chanceFatalFinal = tipoInfo.fatal;
    let habBonus = 0;
    let nomeHabilidade = null;
    let gifHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            nomeHabilidade = habInfo.nome;
            gifHabilidade = habInfo.gif;
            habBonus = habInfo.bonus?.drible || 0;
            if (habInfo.fatal) chanceFatalFinal = habInfo.fatal;
        }
    }
    
    const dadoAtacante = Math.floor(Math.random() * 40) + 1;
    const dadoDefensor = Math.floor(Math.random() * 40) + 1;
    let totalAtacante = dadoAtacante + bonusDrible + bonusVelocidade;
    let totalDefensor = dadoDefensor + bonusDesarme;
    let erroFatal = dadoAtacante <= chanceFatalFinal;
    const totalAtacanteComHab = totalAtacante + habBonus;
    const bonusTotal = tipoInfo.bonus;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dadoAtacante} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${tipoInfo.penalidade}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e perdeu o equilíbrio!`, dadosArray, "O defensor recupera a posse!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALHA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    const venceu = totalAtacanteComHab > totalDefensor;
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${dadoAtacante}` },
        { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "🎯", label: "Poder Drible", valor: `${totalAtacanteComHab}` },
        { emoji: "🛡️", label: "Poder Defensor", valor: `${totalDefensor}` }
    ];
    if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    const texto = criarMoldeResultado(venceu ? "✨" : "🛡️", venceu ? "𝗗𝗥𝗜𝗕𝗟𝗘 𝗕𝗘𝗠-𝗦𝗨𝗖𝗘𝗗𝗜𝗗𝗢" : "𝗗𝗘𝗦𝗔𝗥𝗠𝗔𝗗𝗢", `${interaction.user.username} ${venceu ? 'passou pelo defensor com categoria!' : 'tentou passar, mas foi desarmado!'}`, dadosArray, venceu ? "Você venceu o duelo e avança com a bola!" : "O defensor recupera a posse!", null, null, null);
    
    return new EmbedBuilder()
        .setColor(venceu ? '#00FF00' : '#FF0000')
        .setAuthor({ name: venceu ? `✨ ${interaction.user.username}` : `🛡️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs.driblar)
        .setTimestamp();
}