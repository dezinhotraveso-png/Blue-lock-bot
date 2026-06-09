const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gifs = require('../../utils/gifs.js');
const { listarHabilidadesPorTipo, usarHabilidade, aplicarBonusHabilidade, listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

function criarMolde(icone, titulo, descricao, informativos, resultado, cor = '#FFD700') {
    let texto = `˚ ˳ ﹙${icone}﹚***__${titulo}__***\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
    texto += `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${descricao}*\n\n`;
    
    if (informativos && informativos.length > 0) {
        texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        texto += `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n`;
        
        informativos.forEach(info => {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${info.emoji} ⦘**  **__${info.label}__** —  \`${info.valor}\`\n`;
        });
    }
    
    texto += `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***${resultado}***__\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
    
    return texto;
}

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

function formatarBonusHabilidade(hab) {
    let texto = '';
    if (hab.bonus) {
        if (hab.bonus.interceptacao) texto += `> │   🎯 Interceptação +${hab.bonus.interceptacao}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        if (hab.bonus.desarme) texto += `> │   🛡️ Desarme +${hab.bonus.desarme}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposInterceptacao = [
    { nome: "🛡️ Interceptação Segura", bonus: 0, penalidade: 0, fatal: 3, desc: "Tenta cortar a linha do passe/chute.", emoji: "🛡️" },
    { nome: "⚡ Interceptação Rápida", bonus: 5, penalidade: -2, fatal: 6, desc: "Acelera para cortar o passe/chute.", emoji: "⚡" },
    { nome: "🎭 Interceptação Fantasia", bonus: 8, penalidade: -4, fatal: 9, desc: "Corta com estilo e classe.", emoji: "🎭" },
    { nome: "💪 Interceptação Física", bonus: 4, penalidade: -1, fatal: 5, desc: "Usa o corpo para interceptar.", emoji: "💪" },
    { nome: "🎯 Leitura de Passe", bonus: 6, penalidade: 0, fatal: 4, desc: "Antecipa a trajetória da bola.", emoji: "🎯" }
];

module.exports = {
    name: 'interceptar',
    description: '🛡️ Tenta interceptar um passe ou chute!',
    aliases: ['cortar', 'bloquear'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        // Verificações iniciais
        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.jogadores || !partida.jogadores[message.author.id]) {
            return message.reply('❌ Você não está na partida!');
        }

        const bolaSetor = partida.bolaSetor;
        if (!bolaSetor) return message.reply('❌ Não há bola em jogo!');
        
        const jogador = partida.jogadores[message.author.id];
        if (jogador.setor !== bolaSetor) {
            return message.reply(`❌ Você não está no setor da bola! A bola está em ${bolaSetor}`);
        }

        // VERIFICA SE HÁ ALGO PARA INTERCEPTAR (PASSE OU CHUTE)
        let alvoInterceptacao = null;
        let tipoAlvo = null;
        
        if (partida.aguardandoPasse) {
            alvoInterceptacao = partida.aguardandoPasse;
            tipoAlvo = "passe";
            
            // Não pode interceptar o próprio passe
            if (alvoInterceptacao.de === message.author.id) {
                return message.reply(`❌ Você não pode interceptar seu próprio passe!`);
            }
        } 
        else if (partida.aguardandoChute) {
            alvoInterceptacao = partida.aguardandoChute;
            tipoAlvo = "chute";
            
            // Não pode interceptar o próprio chute
            if (alvoInterceptacao.atacanteId === message.author.id) {
                return message.reply(`❌ Você não pode interceptar seu próprio chute!`);
            }
        }
        else {
            return message.reply('❌ Não há passe ou chute para interceptar no momento!');
        }

        await mostrarTiposInterceptacao(message, bolaSetor, partida, dados, alvoInterceptacao, tipoAlvo);
    }
};

async function mostrarTiposInterceptacao(msgOriginal, bolaSetor, partida, dados, alvo, tipoAlvo) {
    const tiposRow = new ActionRowBuilder();
    tiposInterceptacao.forEach(tipo => {
        let estilo = ButtonStyle.Primary;
        if (tipo.nome === "⚡ Interceptação Rápida") estilo = ButtonStyle.Success;
        if (tipo.nome === "🎭 Interceptação Fantasia") estilo = ButtonStyle.Danger;
        if (tipo.nome === "🛡️ Interceptação Segura") estilo = ButtonStyle.Secondary;
        
        tiposRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                .setLabel(tipo.nome)
                .setStyle(estilo)
        );
    });

    const bonusInterceptacao = dados.jogadores?.[msgOriginal.author.id]?.status?.interceptacao || 0;
    
    // Pega o poder do alvo (passe ou chute)
    let poderAlvo = 0;
    let nomeAlvo = "";
    let tipoExibicao = tipoAlvo === "passe" ? "PASSE" : "CHUTE";
    
    if (tipoAlvo === "passe") {
        const passadorStats = dados.jogadores?.[alvo.de] || { status: { passe: 0 } };
        poderAlvo = 10 + (passadorStats.status?.passe || 0);
        nomeAlvo = partida.jogadores[alvo.de]?.nome || "Jogador";
    } else {
        poderAlvo = alvo.poder;
        nomeAlvo = alvo.atacanteNome;
    }
    
    const texto = 
        `˚ ˳ ﹙🎯﹚***__INTERCEPTAÇÃO__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} vai tentar interceptar o ${tipoExibicao.toLowerCase()}!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${bolaSetor}\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Interceptação Base__** —  \`+${bonusInterceptacao}\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder do ${tipoExibicao}__** —  \`${poderAlvo}\` (${nomeAlvo})\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de interceptação!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embedSelecao = new EmbedBuilder()
        .setColor('#E67E22')
        .setAuthor({ name: `🎯 ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
        .setTitle(`🎯 INTERCEPTAR ${tipoExibicao}`)
        .setDescription(texto)
        .addFields(
            { name: '⚡ Tipos', value: tiposInterceptacao.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
        )
        .setFooter({ text: 'Tempo limite: 30 segundos' });

    const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== msgOriginal.author.id) {
            return i.reply({ content: '❌ Apenas você pode escolher o estilo de interceptação!', flags: 64 });
        }
        
        const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
        const tipoInfo = tiposInterceptacao.find(t => t.nome === tipoNome);
        collector.stop();
        
        const jogador = dados.jogadores?.[msgOriginal.author.id];
        if (!jogador) {
            await i.reply({ content: '❌ Erro: Jogador não encontrado!', flags: 64 });
            return;
        }
        
        const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'interceptacao');
        
        if (habilidadesDisponiveis.length === 0) {
            await executarInterceptacao(i, tipoInfo, bolaSetor, partida, dados, null, alvo, tipoAlvo);
        } else {
            await mostrarHabilidadesInterceptacao(i, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis, alvo, tipoAlvo);
        }
    });
    
    collector.on('end', () => { 
        msg.edit({ components: [] }).catch(() => {}); 
    });
}

async function mostrarHabilidadesInterceptacao(interaction, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis, alvo, tipoAlvo) {
    const habilidadesRow = new ActionRowBuilder();
    
    habilidadesRow.addComponents(
        new ButtonBuilder().setCustomId(`hab_nenhuma`).setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary)
    );
    
    habilidadesDisponiveis.slice(0, 4).forEach(hab => {
        let estilo = ButtonStyle.Primary;
        if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
        
        habilidadesRow.addComponents(
            new ButtonBuilder().setCustomId(`hab_${hab.key}`).setLabel(`${hab.emoji} ${hab.nome}`).setStyle(estilo)
        );
    });
    
    let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Interceptação__***\n> │\n`;
    habilidadesDisponiveis.forEach(hab => {
        habilidadesTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
        habilidadesTexto += formatarBonusHabilidade(hab);
        habilidadesTexto += `> │\n`;
    });
    habilidadesTexto += `> │ **🚫 Nenhuma Habilidade**\n`;
    habilidadesTexto += `> │   Executar sem usar habilidade especial\n`;
    habilidadesTexto += `> ╰───────────⁀ ✨ ⁀───────────╯`;
    
    const tipoExibicao = tipoAlvo === "passe" ? "PASSE" : "CHUTE";
    
    const texto = 
        `˚ ˳ ﹙✨﹚***__HABILIDADES ESPECIAIS__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para interceptar este ${tipoExibicao.toLowerCase()}!*\n\n` +
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
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Apenas você!', flags: 64 });
        }
        
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
        await executarInterceptacao(i, tipoInfo, bolaSetor, partida, dados, habilidadeUsada, alvo, tipoAlvo);
        
        if (mensagemConfirmacao) {
            await i.followUp({ content: mensagemConfirmacao, flags: 64 });
        }
    });
    
    collector.on('end', () => {
        msgAtual.edit({ components: [] }).catch(() => {});
    });
}

async function executarInterceptacao(interaction, tipoInfo, bolaSetor, partida, dados, habilidadeKey, alvo, tipoAlvo) {
    let bonusInterceptacao = dados.jogadores?.[interaction.user.id]?.status?.interceptacao || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.interceptar || gifs.defender);
        
        const bonusAplicado = aplicarBonusHabilidade(
            dados.jogadores[interaction.user.id],
            habilidadeKey,
            { bonusInterceptacao, chanceFatal: chanceFatalFinal }
        );
        
        bonusInterceptacao = bonusAplicado.bonusInterceptacao || bonusInterceptacao;
        chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 20) + 1;
    
    let total = dado + bonusInterceptacao + bonusTipo;
    if (total < 1) total = 1;

    let erroFatal = dado <= chanceFatalFinal;
    let embed = null;
    let sucesso = false;

    // Pega o poder do alvo (passe ou chute)
    let poderAlvo = 0;
    let nomeAtacante = "";
    let tipoExibicao = tipoAlvo === "passe" ? "passe" : "chute";
    
    if (tipoAlvo === "passe") {
        const passadorStats = dados.jogadores?.[alvo.de] || { status: { passe: 0 } };
        poderAlvo = 10 + (passadorStats.status?.passe || 0);
        nomeAtacante = partida.jogadores[alvo.de]?.nome || "Jogador";
    } else {
        poderAlvo = alvo.poder;
        nomeAtacante = alvo.atacanteNome;
    }
    
    const diferenca = total - poderAlvo;
    
    if (erroFatal) {
        // Erro fatal na interceptação
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` },
            { emoji: "🎯", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} falhou feio na interceptação! O ${tipoExibicao} continua!`;
        const texto = criarMolde("💥", "ERRO FATAL", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e falhou miseravelmente!`, informativos, resultado, "#DC143C");

        embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
        
        sucesso = false;
    } 
    else if (total >= poderAlvo && diferenca >= 8) {
        // INTERCEPTAÇÃO FORTE - Domina a bola
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusInterceptacao + bonusTipo}` },
            { emoji: "🎯", label: "Poder Total", valor: `${total}` },
            { emoji: "⚡", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (INTERCEPTAÇÃO FORTE)` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} interceptou e DOMINOU a bola com maestria! Agora tem a posse!`;
        const texto = criarMolde("✅", "INTERCEPTAÇÃO PERFEITA", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e dominou a bola!`, informativos, resultado, "#00FF00");

        embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else if (gifs.interceptar) embed.setImage(gifs.interceptar);
        else embed.setImage(gifs.defender);
        
        partida.posse = interaction.user.id;
        partida.posseNome = interaction.user.username;
        sucesso = true;
    }
    else if (total >= poderAlvo && diferenca >= 3) {
        // INTERCEPTAÇÃO MÉDIA - Desvia a bola
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusInterceptacao + bonusTipo}` },
            { emoji: "🎯", label: "Poder Total", valor: `${total}` },
            { emoji: "⚡", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (DESVIO)` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} desviou a bola! Ela fica viva no setor!`;
        const texto = criarMolde("🟡", "INTERCEPTAÇÃO COM DESVIO", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e desviou a bola!`, informativos, resultado, "#FFA500");

        embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `🟡 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else if (gifs.interceptar) embed.setImage(gifs.interceptar);
        else embed.setImage(gifs.defender);
        
        // Bola fica viva - mantém posse neutra
        partida.posse = null;
        partida.posseNome = null;
        sucesso = true;
    }
    else if (total >= poderAlvo) {
        // INTERCEPTAÇÃO FRACA - Apenas toca
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusInterceptacao + bonusTipo}` },
            { emoji: "🎯", label: "Poder Total", valor: `${total}` },
            { emoji: "⚡", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (APENAS TOCOU)` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} tocou na bola, mas não dominou! O goleiro pode defender!`;
        const texto = criarMolde("🟢", "TOCOU NA BOLA", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e tocou na bola!`, informativos, resultado, "#87CEEB");

        embed = new EmbedBuilder()
            .setColor('#87CEEB')
            .setAuthor({ name: `🟢 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else if (gifs.interceptar) embed.setImage(gifs.interceptar);
        else embed.setImage(gifs.defender);
        
        sucesso = false;
        // Aguarda defesa do goleiro
        if (tipoAlvo === "chute") {
            partida.aguardandoDefesa = true;
        }
    }
    else if (diferenca >= -3) {
        // FALHOU POR POUCO
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusInterceptacao + bonusTipo}` },
            { emoji: "🎯", label: "Poder Total", valor: `${total}` },
            { emoji: "⚡", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `${diferenca} (FALHOU POR POUCO)` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} quase interceptou! O ${tipoExibicao} passou raspando!`;
        const texto = criarMolde("❌", "QUASE INTERCEPTOU", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas passou raspando!`, informativos, resultado, "#FF6347");

        embed = new EmbedBuilder()
            .setColor('#FF6347')
            .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else if (gifs.interceptar) embed.setImage(gifs.interceptar);
        else embed.setImage(gifs.defender);
        
        sucesso = false;
    }
    else {
        // FALHOU COMPLETAMENTE
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusInterceptacao + bonusTipo}` },
            { emoji: "🎯", label: "Poder Total", valor: `${total}` },
            { emoji: "⚡", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `${diferenca} (FALHOU COMPLETO)` }
        ];
        if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `${interaction.user.username} tentou interceptar, mas ${tipoAlvo === "passe" ? "o passe chegou ao destino!" : "o chute passou direto!"}`;
        const texto = criarMolde("❌", "INTERCEPTAÇÃO FALHOU", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas não conseguiu!`, informativos, resultado, "#FF0000");

        embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
        
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else if (gifs.interceptar) embed.setImage(gifs.interceptar);
        else embed.setImage(gifs.defender);
        
        sucesso = false;
    }

    // Atualiza o estado da partida
    if (sucesso && total >= poderAlvo && diferenca >= 8) {
        // Interceptou e dominou - anula o alvo
        if (tipoAlvo === "passe") {
            partida.aguardandoPasse = null;
        } else {
            partida.aguardandoChute = null;
        }
        partida.aguardandoDominio = true;
        partida.bolaSetor = bolaSetor;
        partida.ultimoPasse = {
            de: null,
            para: interaction.user.id,
            timestamp: Date.now()
        };
    } else if (sucesso && total >= poderAlvo && diferenca >= 3) {
        // Desviou a bola - bola fica viva
        if (tipoAlvo === "passe") {
            partida.aguardandoPasse = null;
        } else {
            partida.aguardandoChute = null;
        }
        partida.bolaSetor = bolaSetor;
        partida.posse = null;
        partida.posseNome = null;
    } else if (tipoAlvo === "passe") {
        // Mantém o passe original
        partida.aguardandoDominio = true;
        partida.bolaSetor = bolaSetor;
    }
    
    partida.minuto = (partida.minuto || 0) + 0.3;
    
    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    await interaction.update({ embeds: [embed], components: [] });
}