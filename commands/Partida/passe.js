const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarHabilidadesPorTipo, usarHabilidade, aplicarBonusHabilidade, listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// Setores do campo (simplificado)
const setoresCampo = {
    "Goleiro": { nome: "🧤 Goleiro", posicao: 1 },
    "Defesa": { nome: "🛡️ Defesa", posicao: 2 },
    "Meio-Campo": { nome: "⚡ Meio-Campo", posicao: 3 },
    "Ataque": { nome: "⚽ Ataque", posicao: 4 }
};

const setoresOrdem = ["Goleiro", "Defesa", "Meio-Campo", "Ataque"];

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

function formatarBonusHabilidade(hab) {
    let texto = '';
    if (hab.bonus) {
        if (hab.bonus.passe) texto += `> │   ☄️ Passe +${hab.bonus.passe}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

// Tipos de passe
const tiposPasse = [
    { nome: "⚡ Passe Rápido", bonus: 0, penalidade: 0, fatal: 3, desc: "Passe rápido e rasteiro. Simples e eficaz.", emoji: "⚡", dificuldadeMin: 8 },
    { nome: "🎯 Passe Colocado", bonus: 4, penalidade: 0, fatal: 4, desc: "Passe milimétrico no pé do companheiro.", emoji: "🎯", dificuldadeMin: 10 },
    { nome: "🦶 Passe Trivela", bonus: 6, penalidade: -2, fatal: 6, desc: "Passe com efeito de trivela. Curva incrível!", emoji: "🦶", dificuldadeMin: 12 },
    { nome: "🧠 Passe de Calcanhar", bonus: 8, penalidade: -4, fatal: 8, desc: "Passe de calcanhar. Inteligente e imprevisível.", emoji: "🧠", dificuldadeMin: 14 },
    { nome: "🔄 Passe de Primeira", bonus: 5, penalidade: -2, fatal: 5, desc: "Passe sem dominar. Rápido, mas requer precisão.", emoji: "🔄", dificuldadeMin: 11 }
];

// Forças do passe
const forcasPasse = [
    { nome: "🟢 Curto", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Passe curto, seguro e de fácil recepção." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Passe de média distância. Equilibrado." },
    { nome: "🔴 Longo", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Passe longo. Difícil de acertar, mas quebra linhas." }
];

module.exports = {
    name: 'passe',
    description: '☄️ Tenta passar a bola para um companheiro',
    aliases: ['passar', 'pass'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        // Verificações
        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.jogadores || !partida.jogadores[message.author.id]) {
            return message.reply('❌ Você não está na partida!');
        }

        const jogador = partida.jogadores[message.author.id];
        
        // Verificar se tem a posse
        if (partida.posse !== message.author.id) {
            return message.reply('❌ Você não tem a posse da bola!');
        }

        // Verificar se está em setor que permite passe (não pode do gol)
        if (jogador.setor === "Goleiro") {
            return message.reply('❌ Você está no gol! Primeiro saia jogando com `!dominar` ou `!chute`');
        }

        const bolaSetor = partida.bolaSetor;
        if (jogador.setor !== bolaSetor) {
            return message.reply(`❌ Você não está no setor da bola! A bola está em ${bolaSetor}`);
        }

        // Encontrar companheiro para passar
        const alvoNome = args.join(' ');
        let alvoId = null;
        let alvo = null;
        
        if (message.mentions.users.first()) {
            alvoId = message.mentions.users.first().id;
            alvo = partida.jogadores[alvoId];
        } else if (alvoNome) {
            for (const [id, j] of Object.entries(partida.jogadores)) {
                if (j.nome?.toLowerCase().includes(alvoNome.toLowerCase()) && id !== message.author.id && j.time === jogador.time) {
                    alvoId = id;
                    alvo = j;
                    break;
                }
            }
        }
        
        if (!alvo) {
            return message.reply('❌ Mencione ou digite o nome do companheiro para receber o passe!');
        }
        
        // Verificar se é do mesmo time
        if (alvo.time !== jogador.time) {
            return message.reply('❌ Você só pode passar a bola para companheiros do seu time!');
        }

        const setorOrigem = jogador.setor;
        const setorDestino = alvo.setor;
        
        // Calcular dificuldade do passe baseado na distância dos setores
        const distancia = Math.abs(setoresCampo[setorOrigem].posicao - setoresCampo[setorDestino].posicao);
        let dificuldadeBase = 5 + (distancia * 3);
        
        // Bônus/penalidade por setor
        let setorBonus = 0;
        let setorDesc = "";
        if (setorOrigem === "Ataque") {
            setorBonus = 5;
            setorDesc = "Bônus de +5 por estar no ataque!";
        } else if (setorOrigem === "Defesa") {
            setorBonus = -3;
            setorDesc = "Penalidade de -3 por estar na defesa!";
        }
        
        await mostrarTiposPasse(message, jogador, alvo, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, setorDesc, partida, dados);
    }
};

async function mostrarTiposPasse(message, jogador, alvo, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, setorDesc, partida, dados) {
    const tiposRow = new ActionRowBuilder();
    tiposPasse.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "🎯 Passe Colocado") estilo = ButtonStyle.Success;
        if (t.nome === "🦶 Passe Trivela") estilo = ButtonStyle.Danger;
        if (t.nome === "🧠 Passe de Calcanhar") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const bonusPasse = jogador.status?.passe || 0;
    
    const informativos = [
        { emoji: "📍", label: "Sua Posição", valor: `${setorOrigem}` },
        { emoji: "🎯", label: "Alvo", valor: `${alvo.nome} (${setorDestino})` },
        { emoji: "📏", label: "Distância", valor: `${distancia} setor(es)` },
        { emoji: "☄️", label: "Passe Base", valor: `+${bonusPasse}` },
        { emoji: "🎯", label: "Dificuldade", valor: `${dificuldadeBase}` },
        { emoji: "📍", label: "Bônus Setor", valor: `${setorBonus >= 0 ? `+${setorBonus}` : `${setorBonus}`} (${setorDesc})` }
    ];
    
    const descricaoTipos = tiposPasse.map(t => `> **${t.nome}** — \`Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Dif.Mín: ${t.dificuldadeMin}\`\n> *${t.desc}*`).join('\n\n');
    
    const texto = 
        `˚ ˳ ﹙☄️﹚***__SELEÇÃO DE PASSE__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} vai tentar passar a bola para ${alvo.nome}!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        informativos.map(i => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${i.emoji} ⦘**  **__${i.label}__** —  \`${i.valor}\`\n`).join('') +
        `\n> ˚ ˳ ﹙⚡﹚***__Tipos de Passe Disponíveis__***\n\n` +
        `${descricaoTipos}\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha o tipo de passe nos botões abaixo! Após, defina a força.***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `☄️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 SELEÇÃO DE PASSE')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: '❌ Apenas você pode escolher!', flags: 64 });
        }
        collector.stop();
        const tipo = tiposPasse.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        await mostrarForcasPasse(i, jogador, alvo, tipo, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados);
    });
}

async function mostrarForcasPasse(interaction, jogador, alvo, tipoInfo, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados) {
    const forcaRow = new ActionRowBuilder();
    forcasPasse.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const bonusPasse = jogador.status?.passe || 0;
    
    const informativos = [
        { emoji: "⚡", label: "Tipo Escolhido", valor: `${tipoInfo.nome}` },
        { emoji: "🎯", label: "Dificuldade Base", valor: `${dificuldadeBase}` },
        { emoji: "☄️", label: "Seu Passe", valor: `+${bonusPasse}` }
    ];
    
    const descricaoForcas = forcasPasse.map(f => `> **${f.nome}** — \`Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\`\n> *${f.desc}*`).join('\n\n');
    
    const texto = 
        `˚ ˳ ﹙⚖️﹚***__DEFINIÇÃO DE FORÇA__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} define a potência do passe!*\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
        informativos.map(i => `> **𓂂𝅙ֺ𝅙ִ ⦗ ${i.emoji} ⦘**  **__${i.label}__** —  \`${i.valor}\`\n`).join('') +
        `\n> ˚ ˳ ﹙💪﹚***__Forças Disponíveis__***\n\n` +
        `${descricaoForcas}\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a força do passe nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `☄️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ DEFINIÇÃO DE POTÊNCIA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Restrito a você!', flags: 64 });
        }
        collector.stop();
        const forca = forcasPasse.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogador, 'passe');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarPasse(i, jogador, alvo, tipoInfo, forca, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados, null)], components: [] });
        } else {
            await mostrarHabilidadesPasse(i, jogador, alvo, tipoInfo, forca, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados, habilidades);
        }
    });
}

async function mostrarHabilidadesPasse(interaction, jogador, alvo, tipoInfo, forca, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(hab => {
        let estilo = ButtonStyle.Primary;
        if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${hab.key}`).setLabel(`${hab.emoji} ${hab.nome}`).setStyle(estilo));
    });

    let habsTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Passe__***\n> │\n`;
    habilidades.forEach(hab => {
        habsTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
        habsTexto += formatarBonusHabilidade(hab);
        habsTexto += `> │\n`;
    });
    habsTexto += `> │ **🚫 Nenhuma Habilidade**\n> │   Executar sem usar habilidade especial\n> ╰───────────⁀✨⁀───────────╯`;

    const texto = 
        `˚ ˳ ﹙✨﹚***__HABILIDADES ESPECIAIS__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este passe!*\n\n` +
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
        await executarPasse(i, jogador, alvo, tipoInfo, forca, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados, habilidadeUsada);
        
        if (mensagemConfirmacao) {
            await i.followUp({ content: mensagemConfirmacao, flags: 64 });
        }
    });
}

async function executarPasse(interaction, jogador, alvo, tipoInfo, forca, setorOrigem, setorDestino, distancia, dificuldadeBase, setorBonus, partida, dados, habilidadeKey) {
    let bonusPasse = jogador.status?.passe || 0;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let dificuldadeMin = tipoInfo.dificuldadeMin + dificuldadeBase;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.passe || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const bonusAplicado = aplicarBonusHabilidade(jogador, habilidadeKey, { bonusPasse, multiplicador, chanceFatal: chanceFatalFinal });
        bonusPasse = bonusAplicado.bonusPasse || bonusPasse;
        multiplicador = bonusAplicado.multiplicador || multiplicador;
        chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusPasse + bonusTipo + forca.bonus + habBonus + setorBonus) * multiplicador);
    if (total < 1) total = 1;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo + forca.bonus + habBonus + setorBonus;
    
    let embed;
    
    if (erroFatal) {
        // Erro fatal no passe
        const texto = 
            `˚ ˳ ﹙💥﹚***__ERRO FATAL!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} tentou ${tipoInfo.nome} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e isolou a bola!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado} (FATAL! ≤${chanceFatalFinal})\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💢 ⦘**  **__Penalidade__** —  \`${penalidadeTipo + forca.penalidade}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`A bola foi direto para fora! Tiro de meta para o adversário.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
            
        partida.posse = null;
        partida.aguardandoPontapeAposGol = true;
        
    } else if (total >= dificuldadeMin) {
        // Passe bem-sucedido
        const texto = 
            `˚ ˳ ﹙✅﹚***__PASSE PERFEITO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} encontrou ${alvo.nome} com precisão!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__Passe Base__** —  \`+${bonusPasse}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Bônus__** —  \`+${bonusTotal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✖️ ⦘**  **__Multiplicador__** —  \`x${multiplicador}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total} (mínimo: ${dificuldadeMin})\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`${alvo.nome} recebe a bola! Use c!dominar para tentar dominar.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${interaction.user.username} → ${alvo.nome}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
            
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs.passe_normal);
        
        // Transfere a posse e ativa domínio
        partida.posse = null;
        partida.posseNome = null;
        partida.aguardandoPasse = {
            de: interaction.user.id,
            para: alvoId,
            timestamp: Date.now(),
            poder: total
        };
        partida.aguardandoDominio = true;
        partida.bolaSetor = setorDestino;
        
        // Atualiza estatísticas
        if (!dados.jogadores) dados.jogadores = {};
        if (!dados.jogadores[interaction.user.id]) dados.jogadores[interaction.user.id] = {};
        if (!dados.jogadores[interaction.user.id].estatisticas) dados.jogadores[interaction.user.id].estatisticas = {};
        dados.jogadores[interaction.user.id].estatisticas.passes = (dados.jogadores[interaction.user.id].estatisticas.passes || 0) + 1;
        
    } else {
        // Passe perigoso
        const texto = 
            `˚ ˳ ﹙⚠️﹚***__PASSE PERIGOSO!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} fez um passe difícil!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
            (nomeHabilidade ? `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Habilidade__** —  \`${nomeHabilidade}\`\n` : '') +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dado__** —  \`${dado}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__Passe Base__** —  \`+${bonusPasse}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Bônus__** —  \`+${bonusTotal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✖️ ⦘**  **__Multiplicador__** —  \`x${multiplicador}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Poder Final__** —  \`${total} (mínimo: ${dificuldadeMin})\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Resultado__** —  \`${alvo.nome} precisa se esforçar para dominar! Use c!dominar.\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
        embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `⚠️ ${interaction.user.username} → ${alvo.nome}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setTimestamp();
            
        if (gifHabilidade) embed.setImage(gifHabilidade);
        else embed.setImage(gifs.passe_normal);
        
        // Transfere a posse com penalidade
        partida.posse = null;
        partida.posseNome = null;
        partida.aguardandoPasse = {
            de: interaction.user.id,
            para: alvoId,
            timestamp: Date.now(),
            poder: total,
            penalidade: true
        };
        partida.aguardandoDominio = true;
        partida.bolaSetor = setorDestino;
    }
    
    partida.minuto = (partida.minuto || 0) + 0.5;
    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    
    await interaction.update({ embeds: [embed], components: [] });
}