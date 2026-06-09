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
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const forcasCruzamento = [
    { nome: "🟢 Cruzamento Curto", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Cruzamento curto e seguro." },
    { nome: "🟡 Cruzamento Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Cruzamento equilibrado." },
    { nome: "🔴 Cruzamento Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Bomba na área." }
];

const tiposCruzamento = [
    { nome: "rasante", emoji: "⚡", label: "CRUZAMENTO RASANTE", desc: "Bola rasteira na área.", bonus: 5, penalidade: 0, fatal: 4 },
    { nome: "alto", emoji: "🦶", label: "CRUZAMENTO ALTO", desc: "Bola levantada na área.", bonus: 8, penalidade: -2, fatal: 6 },
    { nome: "puxado", emoji: "🎯", label: "CRUZAMENTO PUXADO", desc: "Bola com efeito.", bonus: 10, penalidade: -4, fatal: 8 }
];

module.exports = {
    name: 'cruzamento',
    description: 'Levanta a bola na área para um companheiro',
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
        if (!receptor) return message.reply('❌ Marque o jogador! Use: `c!cruzamento @jogador`');

        const jogadorAtual = partida.jogadores[message.author.id];
        const jogadorReceptor = partida.jogadores[receptor.id];
        if (!jogadorAtual || !jogadorReceptor) return message.reply('❌ Um dos jogadores não está registrado!');

        const setorOrigem = jogadorAtual.setor;
        const setorDestino = jogadorReceptor.setor;

        const setoresCruzamento = ['C4', 'C5', 'C6', 'C13', 'C14', 'C15'];
        const setoresArea = ['C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

        if (!setoresCruzamento.includes(setorOrigem) || !setoresArea.includes(setorDestino)) {
            return message.reply(`❌ Cruzamento só pode ser feito dos setores laterais (C4-C6, C13-C15) para a área (C7-C12)!`);
        }

        await mostrarTiposCruzamento(message, receptor, setorOrigem, setorDestino, partida, dados);

        async function mostrarTiposCruzamento(msgOriginal, receptor, setorOrigem, setorDestino, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposCruzamento.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "rasante") estilo = ButtonStyle.Success;
                if (tipo.nome === "puxado") estilo = ButtonStyle.Danger;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome}`)
                        .setLabel(`${tipo.emoji} ${tipo.label}`)
                        .setStyle(estilo)
                );
            });

            const texto = 
                `˚ ˳ ﹙🎯﹚***__SELEÇÃO DE CRUZAMENTO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} vai levantar a bola para ${receptor.username}!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Origem__** —  \`${setorOrigem}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Destino__** —  \`${setorDestino}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__Passe Base__** —  \`+${dados.jogadores?.[msgOriginal.author.id]?.status?.passe || 0}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu tipo de cruzamento nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `⚽ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 TIPO DE CRUZAMENTO')
                .setDescription(texto)
                .setImage(gifs.cruzamento)
                .addFields(
                    { name: '⚡ Tipos', value: tiposCruzamento.map(t => `**${t.emoji} ${t.label}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está com a posse pode cruzar!', flags: 64 });
                const tipoSelecionado = i.customId.replace('tipo_', '');
                const tipoInfo = tiposCruzamento.find(t => t.nome === tipoSelecionado);
                collector.stop();
                await mostrarForcasCruzamento(i, tipoInfo, receptor, setorOrigem, setorDestino, partida, dados);
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarForcasCruzamento(interaction, tipoInfo, receptor, setorOrigem, setorDestino, partida, dados) {
            const forcaRow = new ActionRowBuilder();
            forcasCruzamento.forEach(forca => {
                forcaRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`forca_${forca.nome.replace(/ /g, '_')}`)
                        .setLabel(forca.nome)
                        .setStyle(ButtonStyle.Secondary)
                );
            });

            const texto = 
                `˚ ˳ ﹙⚖️﹚***__INTENSIDADE DO CRUZAMENTO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username} está definindo a potência do cruzamento!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Tipo__** —  \`${tipoInfo.label}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha a força do cruzamento nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedForca = new EmbedBuilder()
                .setColor('#F1C40F')
                .setAuthor({ name: `⚽ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('⚖️ INTENSIDADE DO CRUZAMENTO')
                .setDescription(texto)
                .addFields(
                    { name: '💪 Forças', value: forcasCruzamento.map(f => `**${f.nome}**\n└ Bônus: +${f.bonus} | Multiplicador: x${f.multiplicador} | Fatal: ≤${f.fatal}`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            await interaction.update({ embeds: [embedForca], components: [forcaRow] });
            
            const msgAtual = await interaction.fetchReply();
            const collector = msgAtual.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito a quem está cruzando!', flags: 64 });
                const forcaNome = i.customId.replace('forca_', '').replace(/_/g, ' ');
                const forca = forcasCruzamento.find(f => f.nome === forcaNome);
                collector.stop();
                
                // Verifica habilidades de passe
                const jogador = dados.jogadores[interaction.user.id];
                const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'passe');
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarCruzamento(i, tipoInfo, forca, receptor, setorOrigem, setorDestino, partida, dados, null);
                } else {
                    await mostrarHabilidadesCruzamento(i, tipoInfo, forca, receptor, setorOrigem, setorDestino, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msgAtual.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesCruzamento(interaction, tipoInfo, forca, receptor, setorOrigem, setorDestino, partida, dados, habilidadesDisponiveis) {
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
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este cruzamento!*\n\n` +
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
                await executarCruzamento(i, tipoInfo, forca, receptor, setorOrigem, setorDestino, partida, dados, habilidadeUsada);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarCruzamento(interaction, tipoInfo, forca, receptor, setorOrigem, setorDestino, partida, dados, habilidadeKey) {
            let bonusPasse = dados.jogadores?.[interaction.user.id]?.status?.passe || 0;
            let bonusTipo = tipoInfo.bonus;
            let penalidadeTipo = tipoInfo.penalidade;
            let multiplicador = forca.multiplicador;
            let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
            
            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.cruzamento);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id],
                    habilidadeKey,
                    { bonusPasse, multiplicador, chanceFatal: chanceFatalFinal }
                );
                
                bonusPasse = bonusAplicado.bonusPasse || bonusPasse;
                multiplicador = bonusAplicado.multiplicador || multiplicador;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
            }
            
            const dado = Math.floor(Math.random() * 40) + 1;
            
            // Soma APENAS bônus positivos
            let somaBase = (dado + bonusPasse + bonusTipo + forca.bonus);
            let total = Math.floor(somaBase * multiplicador);
            if (total < 1) total = 1;

            let erroFatal = dado <= chanceFatalFinal;
            let embed = null;

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
                    { emoji: "💢", label: "Penalidades", valor: `${penalidadeTipo + forca.penalidade}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `O cruzamento foi totalmente desperdiçado! Tiro de meta!`;
                const texto = criarMolde("💥", "ERRO FATAL NO CRUZAMENTO", `${interaction.user.username} tentou cruzar, mas mandou a bola para fora!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                partida.posse = null;
                partida.aguardandoPontapeAposGol = true;
            } 
            else if (total >= 35) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo + forca.bonus}` },
                    { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `Cruzamento perfeito! ${receptor.username} deve usar c!dominar!`;
                const texto = criarMolde("🎯", "CRUZAMENTO PERFEITO", `${interaction.user.username} executou um ${tipoInfo.label} ${forca.nome} perfeito!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `🎯 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.cruzamento);

                partida.ultimoPasse = { de: interaction.user.id, para: receptor.id, setorOrigem, setorDestino, total, tipo: `${tipoInfo.label} ${forca.nome}` };
                partida.aguardandoDominio = true;
                partida.bolaSetor = setorDestino;
                partida.posse = null;
            } 
            else if (total >= 25) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo + forca.bonus}` },
                    { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `Cruzamento na medida! ${receptor.username} deve dominar a bola!`;
                const texto = criarMolde("⚠️", "CRUZAMENTO NA MEDIDA", `${interaction.user.username} executou um ${tipoInfo.label} ${forca.nome}!`, informativos, resultado, "#FFA500");

                embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setAuthor({ name: `⚠️ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.cruzamento);

                partida.ultimoPasse = { de: interaction.user.id, para: receptor.id, setorOrigem, setorDestino, total, tipo: `${tipoInfo.label} ${forca.nome}` };
                partida.aguardandoDominio = true;
                partida.bolaSetor = setorDestino;
                partida.posse = null;
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusPasse + bonusTipo + forca.bonus}` },
                    { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `A bola foi para fora! Tiro de meta!`;
                const texto = criarMolde("❌", "CRUZAMENTO IMPRECISO", `${interaction.user.username} tentou um ${tipoInfo.label} ${forca.nome}, mas foi impreciso!`, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                partida.posse = null;
                partida.aguardandoPontapeAposGol = true;
            }

            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};