const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gifs = require('../../utils/gifs.js');
const { listarHabilidadesPorTipo, usarHabilidade, aplicarBonusHabilidade, listarTodasHabilidades } = require('../../utils/habilidades.js');
const { isAdmin } = require('../../utils/permissions.js');

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

function getHabilidadesJogador(dados, jogadorId) {
    if (!dados.jogadores || !dados.jogadores[jogadorId]) return {};
    return dados.jogadores[jogadorId].habilidades || {};
}

const forcasCobranca = [
    { nome: "🟢 Leve", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Cobrança segura." },
    { nome: "🟡 Média", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Cobrança equilibrada." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Cobrança potente." }
];

module.exports = {
    name: 'bolaparada',
    description: 'Gerencia faltas, pênaltis e escanteios',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');

        const subComando = args[0]?.toLowerCase();
        const alvo = message.mentions.users.first();

        // CAVAR FALTA
        if (subComando === 'cavar') {
            if (!alvo) return message.reply('❌ Use: `c!bolaparada cavar @adversario`');

            const jogador = partida.jogadores[message.author.id];
            const adversario = partida.jogadores[alvo.id];
            if (!jogador || !adversario) return message.reply('❌ Ambos precisam estar na partida!');
            if (jogador.setor !== adversario.setor) return message.reply(`❌ Você precisa estar no mesmo setor!`);

            const dado = Math.floor(Math.random() * 20) + 1;
            const forcaJogador = dados.jogadores?.[message.author.id]?.status?.fisico || 0;
            const forcaAdversario = dados.jogadores?.[alvo.id]?.status?.fisico || 0;
            
            const totalJogador = dado + forcaJogador;
            const totalAdversario = Math.floor(Math.random() * 20) + 1 + forcaAdversario;
            const diferenca = totalAdversario - totalJogador;
            
            let embed = null;

            if (dado === 1) {
                const descricao = `${message.author.username} tentou cavar uma falta, mas caiu sozinho!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL!)` }
                ];
                const resultado = `O juiz mandou seguir! Bola recuperada por ${alvo.username}!`;
                const texto = criarMolde("💥", "ERRO FATAL", descricao, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();
            } 
            else if (diferenca >= 15) {
                if (!partida.faltas) partida.faltas = {};
                if (!partida.faltas[alvo.id]) partida.faltas[alvo.id] = { quantidade: 0, cartoes: [] };
                partida.faltas[alvo.id].quantidade++;
                
                let cartaoMsg = '';
                if (partida.faltas[alvo.id].quantidade >= 2) {
                    partida.faltas[alvo.id].cartoes.push('🟨');
                    cartaoMsg = `\n🟨 Cartão Amarelo para ${alvo.username}!`;
                    
                    if (partida.faltas[alvo.id].cartoes.length >= 2) {
                        cartaoMsg += `\n🟥 Cartão Vermelho! ${alvo.username} foi EXPULSO!`;
                        delete partida.jogadores[alvo.id];
                    }
                }
                
                const descricao = `${message.author.username} conseguiu cavar uma falta de ${alvo.username}!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dado} + ${forcaJogador} = ${totalJogador}` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `? + ${forcaAdversario} = ${totalAdversario}` },
                    { emoji: "📊", label: "Diferença", valor: `${diferenca} (≥15 necessário)` }
                ];
                const resultado = `Falta marcada! Use c!bolaparada cobrar para bater!${cartaoMsg}`;
                const texto = criarMolde("🎭", "FALTA CAVADA", descricao, informativos, resultado, "#FFD700");

                embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.bola_parada)
                    .setTimestamp();
                
                partida.aguardandoFalta = true;
                partida.faltaPendente = {
                    sofredor: message.author.id,
                    faltoso: alvo.id,
                    setor: jogador.setor,
                    timeAtacante: jogador.time
                };
            } 
            else {
                const descricao = `${message.author.username} tentou cavar uma falta, mas não conseguiu!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dado} + ${forcaJogador} = ${totalJogador}` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `? + ${forcaAdversario} = ${totalAdversario}` },
                    { emoji: "📊", label: "Diferença", valor: `${diferenca} (≥15 necessário)` }
                ];
                const resultado = `${alvo.username} se recupera e mantém a posse!`;
                const texto = criarMolde("❌", "FALHA AO CAVAR", descricao, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `❌ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();
            }

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            return message.reply({ embeds: [embed] });
        }

        // COBRAR
        if (subComando === 'cobrar') {
            if (!partida.aguardandoFalta && !partida.aguardandoPenalti && !partida.aguardandoEscanteio) {
                return message.reply('❌ Não há bola parada aguardando cobrança!');
            }

            const tipo = partida.aguardandoPenalti ? 'pênalti' : (partida.aguardandoEscanteio ? 'escanteio' : 'falta');
            const ePenalti = tipo === 'pênalti';
            const eEscanteio = tipo === 'escanteio';
            
            if (partida.faltaPendente?.sofredor !== message.author.id && !eEscanteio && !ePenalti) {
                return message.reply(`❌ Apenas quem sofreu a ${tipo} pode cobrar!`);
            }

            const tiposCobranca = [
                { nome: "⚡ CHUTE DIRETO", valor: "direto", desc: "Chuta diretamente ao gol", icon: "⚡", dificuldade: 30 },
                { nome: "🎯 ANGLADO", valor: "angulado", desc: "Tenta colocar no ângulo", icon: "🎯", dificuldade: 38 },
                { nome: "🔄 PASSAR", valor: "passar", desc: "Passa para um companheiro", icon: "🔄", dificuldade: 20 }
            ];
            
            if (eEscanteio) {
                tiposCobranca.length = 0;
                tiposCobranca.push(
                    { nome: "⚡ CRUZAR FORTE", valor: "cruzamento_forte", desc: "Manda bola forte na área", icon: "⚡", dificuldade: 25 },
                    { nome: "🎯 CRUZAMENTO COLOCADO", valor: "cruzamento_colocado", desc: "Coloca na cabeça do atacante", icon: "🎯", dificuldade: 30 },
                    { nome: "🔄 PASSE CURTO", valor: "passe_curto", desc: "Passe rasteiro para companheiro", icon: "🔄", dificuldade: 15 }
                );
            }

            const row = new ActionRowBuilder();
            tiposCobranca.forEach(tipoC => {
                let estilo = ButtonStyle.Primary;
                if (tipoC.valor === "passar" || tipoC.valor === "passe_curto") estilo = ButtonStyle.Success;
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipoC.valor}`)
                        .setLabel(tipoC.nome)
                        .setStyle(estilo)
                        .setEmoji(tipoC.icon)
                );
            });

            const texto = 
                `˚ ˳ ﹙🥅﹚***__COBRANÇA DE ${tipo.toUpperCase()}__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} vai cobrar o ${tipo}!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${partida.faltaPendente?.setor || tipo.toUpperCase()}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Tipo__** —  \`${tipo.toUpperCase()}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha o tipo de cobrança nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `🥅 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('⚽ COBRANÇA DE BOLA PARADA')
                .setDescription(texto)
                .setImage(gifs.bola_parada)
                .addFields(
                    { name: '🎯 Opções', value: tiposCobranca.map(t => `**${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await message.reply({ embeds: [embed], components: [row] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: '❌ Você não pode escolher!', flags: 64 });
                
                const tipoEscolhido = i.customId.replace('tipo_', '');
                
                const forcaRow = new ActionRowBuilder();
                forcasCobranca.forEach(forca => {
                    forcaRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`forca_${forca.nome.replace(/ /g, '_')}`)
                            .setLabel(forca.nome)
                            .setStyle(ButtonStyle.Secondary)
                    );
                });

                const textoForca = 
                    `˚ ˳ ﹙⚖️﹚***__INTENSIDADE DA COBRANÇA__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} está definindo a potência da cobrança!*\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Tipo__** —  \`${tiposCobranca.find(t => t.valor === tipoEscolhido)?.nome || tipoEscolhido}\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a força da cobrança nos botões abaixo!***__\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

                const embedForca = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTitle('⚖️ DEFINIÇÃO DE POTÊNCIA')
                    .setDescription(textoForca)
                    .setImage(gifs.bola_parada)
                    .addFields(
                        { name: '💪 Forças', value: forcasCobranca.map(f => `**${f.nome}**\n└ Bônus: +${f.bonus} | Penalidade: ${f.penalidade}`).join('\n\n'), inline: false }
                    )
                    .setFooter({ text: 'Tempo limite: 30 segundos' });

                await i.update({ embeds: [embedForca], components: [forcaRow] });

                const msgForca = await i.fetchReply();
                const forcaCollector = msgForca.createMessageComponentCollector({ time: 30000 });

                forcaCollector.on('collect', async i2 => {
                    if (i2.user.id !== message.author.id) return i2.reply({ content: '❌ Apenas você pode escolher!', flags: 64 });

                    const forcaValor = i2.customId.replace('forca_', '').replace(/_/g, ' ');
                    const forca = forcasCobranca.find(f => f.nome === forcaValor);
                    
                    // Verifica se tem habilidades de chute equipadas
                    const habilidadesJogador = getHabilidadesJogador(dados, message.author.id);
                    
                    // Se tiver habilidades de chute, mostra tela de seleção
                    if (Object.keys(habilidadesJogador).length > 0) {
                        const habsChute = [];
                        const todasHabs = listarTodasHabilidades();
                        
                        for (const [key, habData] of Object.entries(habilidadesJogador)) {
                            const habInfo = todasHabs[key];
                            if (habInfo && habInfo.tipo === 'chute' && habData.usosRestantes > 0) {
                                habsChute.push({ ...habInfo, key, usosRestantes: habData.usosRestantes });
                            }
                        }
                        
                        if (habsChute.length > 0) {
                            const habRow = new ActionRowBuilder();
                            habRow.addComponents(
                                new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary)
                            );
                            
                            habsChute.forEach(hab => {
                                let estilo = ButtonStyle.Primary;
                                if (hab.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
                                else if (hab.estrelas === "★★★★") estilo = ButtonStyle.Success;
                                
                                habRow.addComponents(
                                    new ButtonBuilder().setCustomId(`hab_${hab.key}`).setLabel(`${hab.emoji} ${hab.nome}`).setStyle(estilo)
                                );
                            });
                            
                            let habsTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Chute__***\n> │\n`;
                            habsChute.forEach(hab => {
                                habsTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
                                if (hab.bonus) {
                                    if (hab.bonus.finalizacao) habsTexto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
                                    if (hab.bonus.velocidade) habsTexto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
                                    if (hab.bonus.dominio) habsTexto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
                                }
                                habsTexto += `> │\n`;
                            });
                            habsTexto += `> │ **🚫 Nenhuma Habilidade**\n`;
                            habsTexto += `> ╰───────────⁀ ✨ ⁀───────────╯`;
                            
                            const embedHab = new EmbedBuilder()
                                .setColor('#9B59B6')
                                .setAuthor({ name: `✨ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                                .setTitle('✨ SELECIONE UMA HABILIDADE')
                                .setDescription(
                                    `˚ ˳ ﹙✨﹚***__HABILIDADES__***\n\n` +
                                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                                    `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *Escolha uma habilidade para a cobrança!*\n\n` +
                                    `${habsTexto}\n\n` +
                                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Clique na habilidade para usá-la!***__\n\n` +
                                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                                )
                                .setImage(gifs.bola_parada)
                                .setFooter({ text: 'Clique em uma habilidade' });
                            
                            await i2.update({ embeds: [embedHab], components: [habRow] });
                            
                            const msgHab = await i2.fetchReply();
                            const habCollector = msgHab.createMessageComponentCollector({ time: 30000 });
                            
                            habCollector.on('collect', async i3 => {
                                if (i3.user.id !== message.author.id) return i3.reply({ content: '❌ Apenas você!', flags: 64 });
                                
                                const habKey = i3.customId.replace('hab_', '');
                                let habilidadeUsada = null;
                                
                                if (habKey !== 'nenhuma') {
                                    const res = usarHabilidade(dados.jogadores[message.author.id], habKey);
                                    if (res.sucesso) habilidadeUsada = habKey;
                                }
                                
                                habCollector.stop();
                                
                                const embedResultado = executarCobranca(
                                    message.author.username,
                                    message.author.id,
                                    tipoEscolhido,
                                    forca,
                                    tiposCobranca,
                                    tipo,
                                    dados,
                                    partida,
                                    gifs,
                                    message,
                                    habilidadeUsada
                                );
                                
                                await i3.update({ embeds: [embedResultado], components: [] });
                                forcaCollector.stop();
                            });
                            
                            return;
                        }
                    }
                    
                    // Se não tem habilidades, executa direto
                    const embedResultado = executarCobranca(
                        message.author.username,
                        message.author.id,
                        tipoEscolhido,
                        forca,
                        tiposCobranca,
                        tipo,
                        dados,
                        partida,
                        gifs,
                        message,
                        null
                    );
                    
                    await i2.update({ embeds: [embedResultado], components: [] });
                    forcaCollector.stop();
                });
            });
            return;
        }

        // HELP
        const textoHelp = 
            `˚ ˳ ﹙⚽﹚***__BOLA PARADA - COMANDOS__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *Gerencie faltas, pênaltis e escanteios!*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Comandos__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__Cavar Falta__** —  \`c!bolaparada cavar @jogador\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🥅 ⦘**  **__Cobrar__** —  \`c!bolaparada cobrar\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🟨 ⦘**  **__Ver Cartões__** —  \`c!bolaparada cartoes\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__Marcar Pênalti__** —  \`c!bolaparada penalti <casa/fora>\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📐 ⦘**  **__Marcar Escanteio__** —  \`c!bolaparada escanteio <casa/fora>\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Habilidades de chute funcionam nas cobranças!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        const embedHelp = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: `⚽ BOLA PARADA - ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('📋 COMANDOS BOLA PARADA')
            .setDescription(textoHelp)
            .setImage(gifs.bola_parada)
            .setFooter({ text: '⚽ Blue Lock', iconURL: message.guild.iconURL() })
            .setTimestamp();

        return message.reply({ embeds: [embedHelp] });
    }
};

// Função auxiliar para executar a cobrança
function executarCobranca(username, userId, tipoEscolhido, forca, tiposCobranca, tipo, dados, partida, gifs, message, habilidadeKey) {
    let bonusFinalizacao = dados.jogadores?.[userId]?.status?.finalizacao || 0;
    let multiplicador = forca.multiplicador;
    let chanceFatal = forca.fatal;
    let gifHabilidade = null;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) {
            gifHabilidade = getGifHabilidade(habInfo);
        }
        
        const bonusAplicado = aplicarBonusHabilidade(
            { habilidades: dados.jogadores?.[userId]?.habilidades || {} },
            habilidadeKey,
            { bonusChute: bonusFinalizacao, multiplicador, chanceFatal }
        );
        
        bonusFinalizacao = bonusAplicado.bonusChute || bonusFinalizacao;
        multiplicador = bonusAplicado.multiplicador || multiplicador;
        chanceFatal = bonusAplicado.chanceFatal || chanceFatal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = 0;
    let foiGol = false;
    let embed = null;
    
    const erroFatal = dado <= chanceFatal;
    const tipoInfo = tiposCobranca.find(t => t.valor === tipoEscolhido);
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    
    if (erroFatal) {
        const descricao = `${username} tentou cobrar${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas errou feio!`;
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL! ≤${chanceFatal})` }
        ];
        if (nomeHabilidade) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `A bola foi direto para fora! ${tipo.toUpperCase()} desperdiçado!`;
        const texto = criarMolde("💥", "ERRO FATAL", descricao, informativos, resultado, "#DC143C");

        embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO!`, iconURL: message.author.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    } 
    else if (tipoEscolhido === 'passar' || tipoEscolhido === 'passe_curto') {
        total = Math.floor((dado + bonusFinalizacao + forca.bonus) * multiplicador);
        if (total < 1) total = 1;
        
        const descricao = `${username} cobrou e a bola sobrou limpa para o companheiro!`;
        const informativos = [
            { emoji: "🎲", label: "Dado", valor: `${dado}` },
            { emoji: "🏅", label: "Buff's", valor: `+${bonusFinalizacao + forca.bonus}` },
            { emoji: "🎯", label: "Poder do Passe", valor: `${total}` }
        ];
        if (nomeHabilidade) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
        
        const resultado = `O companheiro agora tem a posse da bola!`;
        const texto = criarMolde("🔄", "PASSE REALIZADO", descricao, informativos, resultado, "#00FF00");

        embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `🔄 ${username}`, iconURL: message.author.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.bola_parada)
            .setTimestamp();
    } 
    else {
        let dificuldade = tipoInfo.dificuldade;
        let multiplicadorAngulo = 1.0;
        
        if (tipoEscolhido === 'angulado') multiplicadorAngulo = 1.1;
        
        total = Math.floor((dado + bonusFinalizacao + forca.bonus) * multiplicador * multiplicadorAngulo);
        if (total < 1) total = 1;
        
        if (total >= dificuldade) {
            foiGol = true;
            const descricao = `${username} mandou a bola no fundo das redes!`;
            const informativos = [
                { emoji: "🎲", label: "Dado", valor: `${dado}` },
                { emoji: "🏅", label: "Buff's", valor: `+${bonusFinalizacao + forca.bonus}` },
                { emoji: "✖️", label: "Multiplicador", valor: `x${(multiplicador * multiplicadorAngulo).toFixed(1)}` },
                { emoji: "🎯", label: "Poder Final", valor: `${total} (≥${dificuldade})` }
            ];
            if (nomeHabilidade) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
            
            const resultado = `GOLAÇO! ${username} marcou um golaço de ${tipo}!`;
            const texto = criarMolde("⚽", "GOL DE BOLA PARADA", descricao, informativos, resultado, "#FFD700");

            embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `⚽ GOL!`, iconURL: message.author.displayAvatarURL() })
                .setDescription(texto)
                .setTimestamp();
            
            if (gifHabilidade) {
                embed.setImage(gifHabilidade);
            } else {
                embed.setImage(gifs.chute_normal);
            }
        } else {
            const descricao = `${username} cobrou, mas o goleiro defendeu!`;
            const informativos = [
                { emoji: "🎲", label: "Dado", valor: `${dado}` },
                { emoji: "🏅", label: "Buff's", valor: `+${bonusFinalizacao + forca.bonus}` },
                { emoji: "🎯", label: "Poder Final", valor: `${total} (≥${dificuldade})` }
            ];
            if (nomeHabilidade) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
            
            const resultado = `Grande defesa! O goleiro salvou o time!`;
            const texto = criarMolde("🧤", "DEFENDIDO", descricao, informativos, resultado, "#00BFFF");

            embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setAuthor({ name: `🧤 DEFESA!`, iconURL: message.author.displayAvatarURL() })
                .setDescription(texto)
                .setImage(gifs.bola_parada)
                .setTimestamp();
        }
    }
    
    if (foiGol) {
        if (partida.faltaPendente?.timeAtacante === partida.timeCasa) partida.golsCasa++;
        else partida.golsFora++;
        partida.posse = null;
        partida.aguardandoPontapeAposGol = true;
    }

    partida.aguardandoFalta = false;
    partida.aguardandoPenalti = false;
    partida.aguardandoEscanteio = false;
    partida.faltaPendente = null;

    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    return embed;
}