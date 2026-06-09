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
        if (hab.bonus.passe) texto += `> │   ☄️ Passe +${hab.bonus.passe}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
        if (hab.bonus.finalizacao) texto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposPasse = [
    { nome: "⚡ Passe Rápido", bonus: 0, penalidade: 0, fatal: 3, desc: "Passe rápido e rasteiro.", emoji: "⚡", dificuldadeMin: 10 },
    { nome: "🎯 Passe Colocado", bonus: 4, penalidade: 0, fatal: 4, desc: "Passe milimétrico no pé.", emoji: "🎯", dificuldadeMin: 12 },
    { nome: "🦶 Passe Trivela", bonus: 6, penalidade: -2, fatal: 6, desc: "Passe com efeito.", emoji: "🦶", dificuldadeMin: 14 },
    { nome: "🧠 Passe de Calcanhar", bonus: 8, penalidade: -4, fatal: 8, desc: "Passe de calcanhar.", emoji: "🧠", dificuldadeMin: 16 },
    { nome: "🔄 Passe de Primeira", bonus: 5, penalidade: -2, fatal: 5, desc: "Passe sem dominar.", emoji: "🔄", dificuldadeMin: 13 }
];

module.exports = {
    name: 'passe',
    description: 'Realiza um passe para um companheiro com habilidades',
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (partida.posse !== message.author.id) return message.reply(`❌ Você não está com a posse da bola!`);
        if (partida.aguardandoPontapeAposGol) return message.reply('⚽ GOL ACABOU DE SER MARCADO! Use `c!pontape` para recomeçar!');

        const receptor = message.mentions.users.first();
        if (!receptor) return message.reply('❌ Marque o jogador! Use: `c!passe @jogador`');
        if (receptor.id === message.author.id) return message.reply('❌ Você não pode passar para si mesmo!');
        if (!partida.jogadores[receptor.id]) return message.reply(`❌ ${receptor.username} não está na partida!`);

        const jogadorAtual = partida.jogadores[message.author.id];
        const jogadorReceptor = partida.jogadores[receptor.id];

        const setorOrigem = jogadorAtual.setor;
        const setorDestino = jogadorReceptor.setor;

        const numOrigem = parseInt(setorOrigem.replace('C', ''));
        const numDestino = parseInt(setorDestino.replace('C', ''));
        const distancia = Math.abs(numOrigem - numDestino);

        if (distancia > 3) return message.reply(`❌ Passe muito longo! (${distancia} setores). Máximo é 3.`);

        await mostrarTiposPasse(message, receptor, setorOrigem, setorDestino, distancia, partida, dados);

        async function mostrarTiposPasse(msgOriginal, receptor, setorOrigem, setorDestino, distancia, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposPasse.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "🎯 Passe Colocado") estilo = ButtonStyle.Success;
                if (tipo.nome === "🦶 Passe Trivela") estilo = ButtonStyle.Danger;
                if (tipo.nome === "🧠 Passe de Calcanhar") estilo = ButtonStyle.Secondary;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                        .setLabel(tipo.nome)
                        .setStyle(estilo)
                );
            });

            const informativos = [
                { emoji: "📍", label: "Origem", valor: `${setorOrigem}` },
                { emoji: "🎯", label: "Destino", valor: `${setorDestino}` },
                { emoji: "📏", label: "Distância", valor: `${distancia} setor(es)` },
                { emoji: "☄️", label: "Passe Base", valor: `+${dados.jogadores?.[msgOriginal.author.id]?.status?.passe || 0}` }
            ];
            
            const resultado = `Escolha seu tipo de passe nos botões abaixo!`;
            const texto = criarMolde("🎯", "SELEÇÃO DE PASSE", `${msgOriginal.author.username} vai passar para ${receptor.username}!`, informativos, resultado, "#2E86C1");

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `⚽ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 ESTILO DE PASSE')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Tipos', value: tiposPasse.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está com a posse pode passar!', flags: 64 });
                const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
                const tipoInfo = tiposPasse.find(t => t.nome === tipoNome);
                collector.stop();
                
                // Verifica habilidades de passe
                const jogador = dados.jogadores[message.author.id];
                const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'passe');
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarPasse(i, tipoInfo, receptor, setorOrigem, setorDestino, distancia, partida, dados, null);
                } else {
                    await mostrarHabilidadesPasse(i, tipoInfo, receptor, setorOrigem, setorDestino, distancia, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesPasse(interaction, tipoInfo, receptor, setorOrigem, setorDestino, distancia, partida, dados, habilidadesDisponiveis) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Passe__***\n> │\n`;
            habilidadesDisponiveis.forEach(hab => {
                habilidadesTexto += `> │ **${hab.emoji} ${hab.nome}** ${hab.estrelas}\n`;
                habilidadesTexto += formatarBonusHabilidade(hab);
                habilidadesTexto += `> │\n`;
            });
            habilidadesTexto += `> │ **🚫 Nenhuma Habilidade**\n`;
            habilidadesTexto += `> │   Executar sem usar habilidade especial\n`;
            habilidadesTexto += `> ╰───────────⁀ ✨ ⁀───────────╯`;
            
            const texto = 
                `˚ ˳ ﹙✨﹚***__HABILIDADES ESPECIAIS__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este passe!*\n\n` +
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
                    const resultado = usarHabilidade(dados.jogadores[interaction.user.id], habKey);
                    if (resultado.sucesso) {
                        habilidadeUsada = habKey;
                        mensagemConfirmacao = resultado.mensagem;
                    } else {
                        await i.reply({ content: resultado.mensagem, flags: 64 });
                        return;
                    }
                }
                
                collector.stop();
                await executarPasse(i, tipoInfo, receptor, setorOrigem, setorDestino, distancia, partida, dados, habilidadeUsada);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarPasse(interaction, tipoInfo, receptor, setorOrigem, setorDestino, distancia, partida, dados, habilidadeKey) {
            let bonusPasse = dados.jogadores?.[interaction.user.id]?.status?.passe || 0;
            let bonusTipo = tipoInfo.bonus;
            let penalidadeTipo = tipoInfo.penalidade;
            let chanceFatalFinal = tipoInfo.fatal;
            let dificuldadeMin = tipoInfo.dificuldadeMin;
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
            
            let penalidadeDistancia = Math.max(0, (distancia - 1) * 2);
            
            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.passe_normal);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id], 
                    habilidadeKey, 
                    { bonusPasse, chanceFatal: chanceFatalFinal }
                );
                
                bonusPasse = bonusAplicado.bonusPasse || bonusPasse;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
            }
            
            const dado = Math.floor(Math.random() * 20) + 1;
            // Soma APENAS bônus positivos
            let total = dado + bonusPasse + bonusTipo - penalidadeDistancia;
            if (total < 1) total = 1;

            let erroFatal = dado <= chanceFatalFinal;
            let interceptado = false;
            let embed = null;

            if (!erroFatal) {
                for (const [id, j] of Object.entries(partida.jogadores || {})) {
                    if (id !== interaction.user.id && id !== receptor.id && j.setor === setorOrigem) {
                        const interceptadorStats = dados.jogadores?.[id] || { status: { interceptacao: 0 } };
                        const bonusIntercept = interceptadorStats.status?.interceptacao || 0;
                        const dadoIntercept = Math.floor(Math.random() * 20) + 1;
                        const totalIntercept = dadoIntercept + bonusIntercept;
                        if (totalIntercept > total) {
                            interceptado = true;
                            break;
                        }
                    }
                }
            }

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
                    { emoji: "💢", label: "Penalidades", valor: `${penalidadeTipo - penalidadeDistancia}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `A bola foi para fora! Tiro de meta!`;
                const texto = criarMolde("💥", "ERRO FATAL NO PASSE", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e isolou!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                partida.posse = null;
                partida.aguardandoPontapeAposGol = true;
                partida.ultimoPasse = null;
            } 
            else if (interceptado) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo}` },
                    { emoji: "📉", label: "Penalidade Distância", valor: `-${penalidadeDistancia}` },
                    { emoji: "📊", label: "Poder do Passe", valor: `${total}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `Um defensor roubou a bola!`;
                const texto = criarMolde("🛡️", "PASSE INTERCEPTADO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas foi interceptado!`, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `🛡️ INTERCEPTAÇÃO!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.passe_normal)
                    .setTimestamp();

                partida.posse = null;
                partida.ultimoPasse = null;
            } 
            else if (total >= dificuldadeMin) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo}` },
                    { emoji: "📉", label: "Penalidade Distância", valor: `-${penalidadeDistancia}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total} (≥${dificuldadeMin})` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `Passe perfeito! ${receptor.username} precisa dominar!`;
                const texto = criarMolde("✅", "PASSE PERFEITO", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e encontrou ${receptor.username}!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.passe_normal);

                partida.ultimoPasse = { de: interaction.user.id, para: receptor.id, setorOrigem, setorDestino, total, tipo: tipoInfo.nome };
                partida.aguardandoDominio = true;
                partida.bolaSetor = setorDestino;
                partida.posse = null;
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo}` },
                    { emoji: "📉", label: "Penalidade Distância", valor: `-${penalidadeDistancia}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total} (≥${dificuldadeMin})` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `Passe perigoso! ${receptor.username} precisa se esforçar!`;
                const texto = criarMolde("⚠️", "PASSE PERIGOSO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas foi difícil!`, informativos, resultado, "#FFA500");

                embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setAuthor({ name: `⚠️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.passe_normal);

                partida.ultimoPasse = { de: interaction.user.id, para: receptor.id, setorOrigem, setorDestino, total, tipo: tipoInfo.nome };
                partida.aguardandoDominio = true;
                partida.bolaSetor = setorDestino;
                partida.posse = null;
            }

            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};