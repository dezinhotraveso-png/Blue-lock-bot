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

const tiposDominio = [
    { nome: "🔒 Domínio Seguro", bonus: 0, penalidade: 0, fatal: 3, desc: "Domínio básico e seguro." },
    { nome: "⚡ Domínio Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Domínio rápido para sair jogando." },
    { nome: "🎭 Domínio Fantasia", bonus: 8, penalidade: -4, fatal: 9, desc: "Domínio com estilo. Lindo de ver." },
    { nome: "🛡️ Domínio Protegido", bonus: 3, penalidade: 0, fatal: 4, desc: "Protege a bola com o corpo." },
    { nome: "🦵 Domínio com Peito", bonus: 4, penalidade: -1, fatal: 5, desc: "Usa o peito para matar a bola." }
];

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

function formatarBonusHabilidade(hab) {
    let texto = '';
    if (hab.bonus) {
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

module.exports = {
    name: 'dominar',
    description: '⚽ Tenta dominar a bola após um passe',
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.aguardandoDominio) return message.reply('❌ Não há passe aguardando domínio!');
        if (!partida.jogadores || !partida.jogadores[message.author.id]) {
            return message.reply('❌ Você não está na partida!');
        }

        const bolaSetor = partida.bolaSetor;
        const jogador = partida.jogadores[message.author.id];
        
        if (jogador.setor !== bolaSetor) {
            return message.reply(`❌ Você não está no setor da bola! A bola está em ${bolaSetor}`);
        }
        
        if (partida.aguardandoPasse && partida.aguardandoPasse.para !== message.author.id) {
            return message.reply(`❌ O passe não foi para você!`);
        }

        await mostrarTiposDominio(message, bolaSetor, partida, dados);
    }
};

async function mostrarTiposDominio(message, bolaSetor, partida, dados) {
    const tiposRow = new ActionRowBuilder();
    tiposDominio.forEach(tipo => {
        let estilo = ButtonStyle.Primary;
        if (tipo.nome === "⚡ Domínio Rápido") estilo = ButtonStyle.Success;
        if (tipo.nome === "🎭 Domínio Fantasia") estilo = ButtonStyle.Danger;
        if (tipo.nome === "🔒 Domínio Seguro") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`).setLabel(tipo.nome).setStyle(estilo));
    });

    const bonusDominio = dados.jogadores?.[message.author.id]?.status?.dominio || 0;
    const setorNome = setoresCampo[bolaSetor]?.nome || bolaSetor;
    
    const texto = 
        `˚ ˳ ﹙⚽﹚***__SELEÇÃO DE DOMÍNIO__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} vai tentar dominar a bola!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${bolaSetor} (${setorNome})\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Domínio Base__** —  \`+${bonusDominio}\`\n\n` +
        `> ˚ ˳ ﹙⚡﹚***__Estilos de Domínio__***\n\n` +
        tiposDominio.map(t => `> **${t.nome}** — \`Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\`\n> *${t.desc}*`).join('\n\n') +
        `\n\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de domínio nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 ESTILO DE DOMÍNIO')
        .setDescription(texto)
        .setFooter({ text: 'Tempo limite: 30 segundos' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas o receptor do passe pode dominar!', flags: 64 });
        
        const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
        const tipoInfo = tiposDominio.find(t => t.nome === tipoNome);
        collector.stop();
        
        const jogador = dados.jogadores?.[message.author.id];
        const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'dominio');
        
        if (habilidadesDisponiveis.length === 0) {
            await executarDominio(i, tipoInfo, bolaSetor, partida, dados, null);
        } else {
            await mostrarHabilidadesDominio(i, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis);
        }
    });
}

async function mostrarHabilidadesDominio(interaction, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis) {
    const habilidadesRow = new ActionRowBuilder();
    habilidadesRow.addComponents(new ButtonBuilder().setCustomId(`hab_nenhuma`).setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    
    habilidadesDisponiveis.slice(0, 4).forEach(hab => {
        let estilo = ButtonStyle.Primary;
        if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
        habilidadesRow.addComponents(new ButtonBuilder().setCustomId(`hab_${hab.key}`).setLabel(`${hab.emoji} ${hab.nome}`).setStyle(estilo));
    });
    
    let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Domínio__***\n> │\n`;
    habilidadesDisponiveis.forEach(hab => {
        habilidadesTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
        habilidadesTexto += formatarBonusHabilidade(hab);
        habilidadesTexto += `> │\n`;
    });
    habilidadesTexto += `> │ **🚫 Nenhuma Habilidade**\n> │   Executar sem usar habilidade especial\n> ╰───────────⁀✨⁀───────────╯`;
    
    const texto = 
        `˚ ˳ ﹙✨﹚***__HABILIDADES ESPECIAIS__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este domínio!*\n\n` +
        `${habilidadesTexto}\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Clique na habilidade para usá-la!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
    
    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade para ativar' });
    
    await interaction.update({ embeds: [embed], components: [habilidadesRow] });
    
    const msgAtual = await interaction.fetchReply();
    const collector = msgAtual.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        
        const habKey = i.customId.replace('hab_', '');
        let habilidadeUsada = null;
        let mensagemConfirmacao = '';
        
        if (habKey !== 'nenhuma') {
            const resultado = usarHabilidade(dados.jogadores[i.user.id], habKey);
            if (resultado.sucesso) {
                habilidadeUsada = habKey;
                mensagemConfirmacao = resultado.mensagem;
            } else {
                await i.reply({ content: resultado.mensagem, flags: 64 });
                return;
            }
        }
        
        collector.stop();
        await executarDominio(i, tipoInfo, bolaSetor, partida, dados, habilidadeUsada);
        
        if (mensagemConfirmacao) {
            await i.followUp({ content: mensagemConfirmacao, flags: 64 });
        }
    });
}

async function executarDominio(interaction, tipoInfo, bolaSetor, partida, dados, habilidadeKey) {
    let bonusDominio = dados.jogadores?.[interaction.user.id]?.status?.dominio || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.dominar);
        
        const bonusAplicado = aplicarBonusHabilidade(
            dados.jogadores[interaction.user.id],
            habilidadeKey,
            { bonusDominio, chanceFatal: chanceFatalFinal }
        );
        
        bonusDominio = bonusAplicado.bonusDominio || bonusDominio;
        chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 20) + 1;
    let total = dado + bonusDominio + bonusTipo;
    if (total < 1) total = 1;

    let erroFatal = dado <= chanceFatalFinal;
    let embed = null;

    const passeInfo = partida.aguardandoPasse;
    const poderPasse = passeInfo?.poder || 15;
    
    if (erroFatal) {
        const texto = 
            `˚ ˳ ﹙💥﹚***__ERRO FATAL!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e falhou!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado} (FATAL! ≤${chanceFatalFinal})\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💢 ⦘**  **__Penalidade__** —  \`${penalidadeTipo}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`A bola escapou e foi para fora! Tiro de meta.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
            
        partida.posse = null;
        partida.aguardandoPontapeAposGol = true;
        
    } else if (total >= poderPasse) {
        const texto = 
            `˚ ˳ ﹙✅﹚***__DOMÍNIO PERFEITO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} dominou a bola com maestria!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏅 ⦘**  **__Bônus__** —  \`+${bonusDominio + bonusTipo}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`${interaction.user.username} agora tem a posse da bola!\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs.dominar);
        
        partida.posse = interaction.user.id;
        partida.posseNome = interaction.user.username;
        
    } else {
        const texto = 
            `˚ ˳ ﹙🔄﹚***__DISPUTA DE DOMÍNIO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} tentou dominar, mas a bola ficou viva!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏅 ⦘**  **__Bônus__** —  \`+${bonusDominio + bonusTipo}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__Poder Passe__** —  \`${poderPasse}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`Qualquer jogador no setor pode tentar pegar a bola!\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `🔄 DISPUTA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs.dominar);
        
        partida.posse = null;
        partida.aguardandoDominio = true;
    }

    partida.aguardandoPasse = null;
    partida.aguardandoDominio = false;
    partida.minuto = (partida.minuto || 0) + 0.5;
    
    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    await interaction.update({ embeds: [embed], components: [] });
}