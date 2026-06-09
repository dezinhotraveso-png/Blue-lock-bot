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
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
        if (hab.bonus.interceptacao) texto += `> │   🎯 Interceptação +${hab.bonus.interceptacao}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        if (hab.bonus.finalizacao) texto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposDominio = [
    { nome: "🔒 Domínio Seguro", bonus: 0, penalidade: 0, fatal: 3, desc: "Domínio básico e seguro.", emoji: "🔒" },
    { nome: "⚡ Domínio Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Domínio rápido para sair jogando.", emoji: "⚡" },
    { nome: "🎭 Domínio Fantasia", bonus: 8, penalidade: -4, fatal: 9, desc: "Domínio com estilo. Lindo de ver.", emoji: "🎭" },
    { nome: "🛡️ Domínio Protegido", bonus: 3, penalidade: 0, fatal: 4, desc: "Protege a bola com o corpo.", emoji: "🛡️" },
    { nome: "🦵 Domínio com Peito", bonus: 4, penalidade: -1, fatal: 5, desc: "Usa o peito para matar a bola.", emoji: "🦵" }
];

module.exports = {
    name: 'dominar',
    description: 'Tenta dominar a bola após um passe',
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.aguardandoDominio) return message.reply('❌ Não há passe aguardando domínio!');
        if (!partida.jogadores[message.author.id]) return message.reply('❌ Você não está na partida!');

        const bolaSetor = partida.bolaSetor;
        const jogadorAtual = partida.jogadores[message.author.id];
        if (jogadorAtual.setor !== bolaSetor) return message.reply(`❌ Você não está no setor da bola! A bola está em ${bolaSetor}`);
        if (partida.ultimoPasse && partida.ultimoPasse.para !== message.author.id) return message.reply(`❌ O passe não foi para você!`);

        await mostrarTiposDominio(message, bolaSetor, partida, dados);

        async function mostrarTiposDominio(msgOriginal, bolaSetor, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposDominio.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "⚡ Domínio Rápido") estilo = ButtonStyle.Success;
                if (tipo.nome === "🎭 Domínio Fantasia") estilo = ButtonStyle.Danger;
                if (tipo.nome === "🛡️ Domínio Protegido") estilo = ButtonStyle.Secondary;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                        .setLabel(tipo.nome)
                        .setStyle(estilo)
                );
            });

            const texto = 
                `˚ ˳ ﹙🎯﹚***__SELEÇÃO DE DOMÍNIO__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} vai tentar dominar a bola!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${bolaSetor}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Domínio Base__** —  \`+${dados.jogadores?.[msgOriginal.author.id]?.status?.dominio || 0}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de domínio nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `⚽ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 ESTILO DE DOMÍNIO')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Tipos', value: tiposDominio.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas o receptor do passe pode dominar!', flags: 64 });
                const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
                const tipoInfo = tiposDominio.find(t => t.nome === tipoNome);
                collector.stop();
                
                // Verifica habilidades de domínio
                const jogador = dados.jogadores[interaction.user.id];
                const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'dominio');
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarDominio(i, tipoInfo, bolaSetor, partida, dados, null);
                } else {
                    await mostrarHabilidadesDominio(i, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesDominio(interaction, tipoInfo, bolaSetor, partida, dados, habilidadesDisponiveis) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Domínio__***\n> │\n`;
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
            
            // Soma APENAS bônus positivos
            let total = dado + bonusDominio + bonusTipo;
            if (total < 1) total = 1;

            let erroFatal = dado <= chanceFatalFinal;
            let embed = null;

            const outrosJogadores = [];
            for (const [id, j] of Object.entries(partida.jogadores || {})) {
                if (id !== interaction.user.id && j.setor === bolaSetor) outrosJogadores.push(id);
            }

            if (outrosJogadores.length > 0 && !erroFatal) {
                const resultados = [{ id: interaction.user.id, total, nome: interaction.user.username }];
                for (const id of outrosJogadores) {
                    const outroStats = dados.jogadores?.[id] || { status: { dominio: 0 } };
                    const outroDado = Math.floor(Math.random() * 20) + 1;
                    const outroBonus = outroStats.status?.dominio || 0;
                    const outroTotal = outroDado + outroBonus;
                    resultados.push({ id, total: outroTotal, nome: partida.jogadores[id]?.nome || "Jogador" });
                }
                resultados.sort((a, b) => b.total - a.total);

                if (resultados[0].total === resultados[1]?.total) {
                    const informativos = [
                        { emoji: "🎲", label: "Dado", valor: `${dado}` },
                        { emoji: "🏅", label: "Bônus", valor: `+${bonusDominio + bonusTipo}` },
                        { emoji: "🎯", label: "Poder Total", valor: `${total}` },
                        { emoji: "⚔️", label: "Disputa", valor: resultados.map(r => `${r.nome} (${r.total})`).join(' vs ') }
                    ];
                    if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                    
                    const resultado = `Nova disputa necessária! A bola continua viva!`;
                    const texto = criarMolde("⚖️", "EMPATE NO DOMÍNIO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas houve empate!`, informativos, resultado, "#FFA500");

                    embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setAuthor({ name: `⚖️ EMPATE!`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(texto)
                        .setTimestamp();
                    
                    if (gifHabilidade) embed.setImage(gifHabilidade);
                    else embed.setImage(gifs.dominar);
                    
                    partida.aguardandoDominio = true;
                    partida.bolaSetor = bolaSetor;
                    partida.ultimoPasse = partida.ultimoPasse;
                } 
                else if (resultados[0].id === interaction.user.id) {
                    const informativos = [
                        { emoji: "🎲", label: "Dado", valor: `${dado}` },
                        { emoji: "🏅", label: "Bônus", valor: `+${bonusDominio + bonusTipo}` },
                        { emoji: "🎯", label: "Poder Total", valor: `${total}` },
                        { emoji: "⚔️", label: "Disputa", valor: resultados.map(r => `${r.nome} (${r.total})`).join(' vs ') }
                    ];
                    if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                    
                    const resultado = `${interaction.user.username} venceu a disputa e dominou a bola!`;
                    const texto = criarMolde("✅", "DOMÍNIO VENCIDO", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e venceu!`, informativos, resultado, "#00FF00");

                    embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(texto)
                        .setTimestamp();
                    
                    if (gifHabilidade) embed.setImage(gifHabilidade);
                    else embed.setImage(gifs.dominar);
                    
                    partida.posse = interaction.user.id;
                    partida.posseNome = interaction.user.username;
                } 
                else {
                    const vencedor = resultados[0];
                    const informativos = [
                        { emoji: "🎲", label: "Dado", valor: `${dado}` },
                        { emoji: "🏅", label: "Bônus", valor: `+${bonusDominio + bonusTipo}` },
                        { emoji: "🎯", label: "Poder Total", valor: `${total}` },
                        { emoji: "⚔️", label: "Disputa", valor: resultados.map(r => `${r.nome} (${r.total})`).join(' vs ') }
                    ];
                    if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                    
                    const resultado = `${vencedor.nome} venceu a disputa e tomou a bola!`;
                    const texto = criarMolde("❌", "DISPUTA DE DOMÍNIO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas perdeu!`, informativos, resultado, "#FF0000");

                    embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(texto)
                        .setTimestamp();
                    
                    if (gifHabilidade) embed.setImage(gifHabilidade);
                    else embed.setImage(gifs.dominar);
                    
                    partida.posse = vencedor.id;
                    partida.posseNome = vencedor.nome;
                }
            } 
            else if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
                    { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `A bola escapou e foi para fora! Tiro de meta!`;
                const texto = criarMolde("💥", "ERRO FATAL NO DOMÍNIO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e falhou!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();
                
                partida.posse = null;
                partida.aguardandoPontapeAposGol = true;
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dado}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusDominio + bonusTipo}` },
                    { emoji: "🎯", label: "Poder Total", valor: `${total}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} dominou a bola e agora tem a posse!`;
                const texto = criarMolde("✅", "DOMÍNIO PERFEITO", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} com sucesso!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.dominar);
                
                partida.posse = interaction.user.id;
                partida.posseNome = interaction.user.username;
            }

            partida.aguardandoDominio = false;
            partida.bolaSetor = null;
            partida.ultimoPasse = null;
            partida.minuto += 0.5;
            
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};