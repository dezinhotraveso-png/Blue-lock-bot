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
        if (hab.bonus.desarme) texto += `> │   🛡️ Desarme +${hab.bonus.desarme}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        if (hab.bonus.interceptacao) texto += `> │   🎯 Interceptação +${hab.bonus.interceptacao}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposMarcacao = [
    { nome: "🛡️ Marcação Normal", bonus: 0, penalidade: 0, fatal: 3, desc: "Marcação básica.", emoji: "🛡️" },
    { nome: "⚡ Marcação Pressão", bonus: 6, penalidade: -2, fatal: 6, desc: "Pressão alta.", emoji: "⚡" },
    { nome: "💪 Marcação Física", bonus: 8, penalidade: -4, fatal: 8, desc: "Uso do corpo.", emoji: "💪" },
    { nome: "🧠 Marcação Inteligente", bonus: 4, penalidade: 0, fatal: 4, desc: "Leitura de jogo.", emoji: "🧠" },
    { nome: "🦵 Marcação Deslizante", bonus: 5, penalidade: -3, fatal: 7, desc: "Carrinho.", emoji: "🦵" }
];

module.exports = {
    name: 'marcar',
    description: 'Marca um jogador adversário com habilidades',
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');

        const adversario = message.mentions.users.first();
        if (!adversario) return message.reply('❌ Marque o adversário! Use: `c!marcar @adversario`');

        const jogador = partida.jogadores[message.author.id];
        const defensor = partida.jogadores[adversario.id];
        if (!jogador || !defensor) return message.reply('❌ Um dos jogadores não está registrado!');
        if (jogador.setor !== defensor.setor) return message.reply(`❌ Você precisa estar no mesmo setor que ${adversario.username}!`);

        if (partida.jogadores[adversario.id]?.marcadoPor) {
            const marcador = partida.jogadores[adversario.id].marcadoPor;
            if (marcador !== message.author.id) {
                return message.reply(`❌ ${adversario.username} já está sendo marcado por outro jogador!`);
            }
        }

        await mostrarTiposMarcacao(message, adversario, jogador.setor, partida, dados);

        async function mostrarTiposMarcacao(msgOriginal, adversario, setor, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposMarcacao.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "⚡ Marcação Pressão") estilo = ButtonStyle.Success;
                if (tipo.nome === "💪 Marcação Física") estilo = ButtonStyle.Danger;
                if (tipo.nome === "🧠 Marcação Inteligente") estilo = ButtonStyle.Secondary;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                        .setLabel(tipo.nome)
                        .setStyle(estilo)
                );
            });

            const texto = 
                `˚ ˳ ﹙🎯﹚***__SELEÇÃO DE MARCAÇÃO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} vai tentar marcar ${adversario.username}!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${setor}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Desarme Base__** —  \`+${dados.jogadores?.[msgOriginal.author.id]?.status?.desarme || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Drible do Alvo__** —  \`+${dados.jogadores?.[adversario.id]?.status?.drible || 0}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de marcação nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `🛡️ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 ESTILO DE MARCAÇÃO')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Tipos', value: tiposMarcacao.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está marcando pode escolher!', flags: 64 });
                const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
                const tipoInfo = tiposMarcacao.find(t => t.nome === tipoNome);
                collector.stop();
                
                // Verifica habilidades de desarme/marcação
                const jogadorMarcador = dados.jogadores[message.author.id];
                const habilidadesDesarme = listarHabilidadesPorTipo(jogadorMarcador, 'desarme');
                const habilidadesFisico = listarHabilidadesPorTipo(jogadorMarcador, 'fisico');
                const habilidadesDisponiveis = [...habilidadesDesarme, ...habilidadesFisico];
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarMarcacao(i, tipoInfo, adversario, setor, partida, dados, null);
                } else {
                    await mostrarHabilidadesMarcacao(i, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesMarcacao(interaction, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Marcação/Desarme__***\n> │\n`;
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
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para esta marcação!*\n\n` +
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
                await executarMarcacao(i, tipoInfo, adversario, setor, partida, dados, habilidadeUsada);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarMarcacao(interaction, tipoInfo, adversario, setor, partida, dados, habilidadeKey) {
            let bonusDesarme = dados.jogadores?.[interaction.user.id]?.status?.desarme || 0;
            const bonusDrible = dados.jogadores?.[adversario.id]?.status?.drible || 0;
            let bonusTipo = tipoInfo.bonus;
            let penalidadeTipo = tipoInfo.penalidade;
            let chanceFatalFinal = tipoInfo.fatal;
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;

            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.marcar);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id], 
                    habilidadeKey, 
                    { bonusDesarme, chanceFatal: chanceFatalFinal }
                );
                
                bonusDesarme = bonusAplicado.bonusDesarme || bonusDesarme;
                // Também verifica bônus de físico
                bonusDesarme = bonusAplicado.bonusFisico ? bonusDesarme + bonusAplicado.bonusFisico : bonusDesarme;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
            }

            const dadoMarcador = Math.floor(Math.random() * 20) + 1;
            const dadoAlvo = Math.floor(Math.random() * 20) + 1;
            
            // Soma APENAS bônus positivos
            const totalMarcador = dadoMarcador + bonusDesarme + bonusTipo;
            const totalAlvo = dadoAlvo + bonusDrible;

            let erroFatal = dadoMarcador <= chanceFatalFinal;
            let embed = null;

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoMarcador} (FATAL! ≤${chanceFatalFinal})` },
                    { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` },
                    { emoji: "✨", label: "Poder do Alvo", valor: `${totalAlvo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `O árbitro marca falta! ${adversario.username} vai cobrar!`;
                const texto = criarMolde("💥", "FALTA COMETIDA", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas cometeu falta!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 FALTA!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                if (!partida.faltas) partida.faltas = {};
                if (!partida.faltas[interaction.user.id]) partida.faltas[interaction.user.id] = { quantidade: 0, cartoes: [] };
                partida.faltas[interaction.user.id].quantidade++;
                
                partida.aguardandoFalta = true;
                partida.faltaPendente = {
                    sofredor: adversario.id,
                    faltoso: interaction.user.id,
                    setor: setor,
                    timeAtacante: partida.jogadores[adversario.id]?.time
                };
            } 
            else if (totalMarcador > totalAlvo) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoMarcador}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusDesarme + bonusTipo}` },
                    { emoji: "🎯", label: "Poder da Marcação", valor: `${totalMarcador}` },
                    { emoji: "✨", label: "Poder do Alvo", valor: `${totalAlvo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${adversario.username} ficará preso no setor por 3 turnos!`;
                const texto = criarMolde("✅", "MARCAÇÃO BEM-SUCEDIDA", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e marcou ${adversario.username}!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.marcar);

                if (!partida.jogadores[adversario.id]) partida.jogadores[adversario.id] = {};
                partida.jogadores[adversario.id].marcadoPor = interaction.user.id;
                partida.jogadores[adversario.id].turnosMarcado = 3;
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoMarcador}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusDesarme + bonusTipo}` },
                    { emoji: "🎯", label: "Poder da Marcação", valor: `${totalMarcador}` },
                    { emoji: "✨", label: "Poder do Alvo", valor: `${totalAlvo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${adversario.username} ganhou prioridade contra ${interaction.user.username} por 1 turno!`;
                const texto = criarMolde("❌", "MARCAÇÃO FALHOU", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas ${adversario.username} escapou!`, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.marcar)
                    .setTimestamp();

                if (!partida.prioridades) partida.prioridades = {};
                partida.prioridades[adversario.id] = { contra: interaction.user.id, turnos: 1 };
            }

            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};