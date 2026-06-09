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
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        if (hab.bonus.interceptacao) texto += `> │   🎯 Interceptação +${hab.bonus.interceptacao}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposDisputa = [
    { nome: "🏃 Corrida Reta", bonus: 0, penalidade: 0, fatal: 3, desc: "Corrida em linha reta.", emoji: "🏃" },
    { nome: "⚡ Arrancada Explosiva", bonus: 5, penalidade: -2, fatal: 6, desc: "Explosão de velocidade.", emoji: "⚡" },
    { nome: "🔄 Mudança de Direção", bonus: 4, penalidade: -1, fatal: 5, desc: "Muda de direção.", emoji: "🔄" },
    { nome: "💨 Corrida de Velocidade", bonus: 3, penalidade: 0, fatal: 4, desc: "Velocidade pura.", emoji: "💨" },
    { nome: "🎭 Finta Corporal", bonus: 6, penalidade: -3, fatal: 7, desc: "Usa o corpo para enganar.", emoji: "🎭" }
];

module.exports = {
    name: 'velocidade',
    description: 'Disputa de velocidade para seguir um adversário com habilidades',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');

        const adversario = message.mentions.users.first();
        if (!adversario) return message.reply('❌ Marque o adversário! Use: `c!velocidade @adversario`');

        const setorJogador = partida.jogadores[message.author.id]?.setor || "C1";
        const setorAdversario = partida.jogadores[adversario.id]?.setor || "C1";

        if (setorJogador !== setorAdversario) {
            return message.reply(`❌ Você precisa estar no mesmo setor que ${adversario.username}!`);
        }

        if (partida.jogadores[message.author.id]?.turnosPreso > 0) {
            const texto = 
                `˚ ˳ ﹙🚫﹚***__DISPUTA BLOQUEADA__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${message.author.username} tentou disputar velocidade, mas está preso!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⏱️ ⦘**  **__Turnos Restantes__** —  \`${partida.jogadores[message.author.id].turnosPreso}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Você não pode disputar velocidade enquanto está preso!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setAuthor({ name: `⚡ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setDescription(texto)
                .setImage(gifs.erro_fatal)
                .setTimestamp();
                
            return message.reply({ embeds: [embed] });
        }

        await mostrarTiposDisputa(message, adversario, setorJogador, partida, dados);

        async function mostrarTiposDisputa(msgOriginal, adversario, setor, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposDisputa.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "⚡ Arrancada Explosiva") estilo = ButtonStyle.Success;
                if (tipo.nome === "🔄 Mudança de Direção") estilo = ButtonStyle.Secondary;
                if (tipo.nome === "🎭 Finta Corporal") estilo = ButtonStyle.Danger;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                        .setLabel(tipo.nome)
                        .setStyle(estilo)
                );
            });

            const texto = 
                `˚ ˳ ﹙🎯﹚***__SELEÇÃO DE DISPUTA__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} vai disputar velocidade com ${adversario.username}!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Informativos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${setor}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__Velocidade Base__** —  \`+${dados.jogadores?.[msgOriginal.author.id]?.status?.velocidade || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 💨 ⦘**  **__Velocidade Adversário__** —  \`+${dados.jogadores?.[adversario.id]?.status?.velocidade || 0}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de disputa nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `⚡ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 ESTILO DE DISPUTA')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Tipos', value: tiposDisputa.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está disputando pode escolher!', flags: 64 });
                const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
                const tipoInfo = tiposDisputa.find(t => t.nome === tipoNome);
                collector.stop();
                
                // Verifica habilidades de velocidade
                const jogador = dados.jogadores[message.author.id];
                const habilidadesVelocidade = listarHabilidadesPorTipo(jogador, 'velocidade');
                const habilidadesDrible = listarHabilidadesPorTipo(jogador, 'drible');
                const habilidadesDisponiveis = [...habilidadesVelocidade, ...habilidadesDrible];
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarDisputa(i, tipoInfo, adversario, setor, partida, dados, null);
                } else {
                    await mostrarHabilidadesDisputa(i, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesDisputa(interaction, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Velocidade__***\n> │\n`;
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
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para esta disputa!*\n\n` +
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
                await executarDisputa(i, tipoInfo, adversario, setor, partida, dados, habilidadeUsada);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarDisputa(interaction, tipoInfo, adversario, setor, partida, dados, habilidadeKey) {
            let bonusVelocidade = dados.jogadores?.[interaction.user.id]?.status?.velocidade || 0;
            const bonusAdversario = dados.jogadores?.[adversario.id]?.status?.velocidade || 0;
            
            let bonusTipo = tipoInfo.bonus;
            let penalidadeTipo = tipoInfo.penalidade;
            let chanceFatalFinal = tipoInfo.fatal;
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;

            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.velocidade_gif || gifs.movimentar);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id], 
                    habilidadeKey, 
                    { bonusVelocidade, chanceFatal: chanceFatalFinal }
                );
                
                bonusVelocidade = bonusAplicado.bonusVelocidade || bonusVelocidade;
                bonusVelocidade = bonusAplicado.bonusDrible ? bonusVelocidade + bonusAplicado.bonusDrible : bonusVelocidade;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
            }

            const dadoJogador = Math.floor(Math.random() * 20) + 1;
            const dadoAdversario = Math.floor(Math.random() * 20) + 1;
            
            // Soma APENAS bônus positivos
            const totalJogador = dadoJogador + bonusVelocidade + bonusTipo;
            const totalAdversario = dadoAdversario + bonusAdversario;

            let erroFatal = dadoJogador <= chanceFatalFinal;
            let embed = null;

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoJogador} (FATAL! ≤${chanceFatalFinal})` },
                    { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} perdeu completamente a disputa! Ficará preso por 2 turnos!`;
                const texto = criarMolde("💥", "ERRO FATAL NA DISPUTA", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas tropeçou!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                if (!partida.jogadores[interaction.user.id]) partida.jogadores[interaction.user.id] = {};
                partida.jogadores[interaction.user.id].turnosPreso = 2;
            } 
            else if (totalJogador > totalAdversario) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoJogador}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusVelocidade + bonusTipo}` },
                    { emoji: "🎯", label: "Poder do Jogador", valor: `${totalJogador}` },
                    { emoji: "💨", label: "Poder do Adversário", valor: `${totalAdversario}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} venceu a disputa e ganhou prioridade contra ${adversario.username}!`;
                const texto = criarMolde("✅", "VITÓRIA NA VELOCIDADE", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e venceu ${adversario.username}!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.velocidade_gif || gifs.movimentar);

                if (!partida.prioridades) partida.prioridades = {};
                partida.prioridades[interaction.user.id] = { contra: adversario.id, turnos: 1 };
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${dadoJogador}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusVelocidade + bonusTipo}` },
                    { emoji: "🎯", label: "Poder do Jogador", valor: `${totalJogador}` },
                    { emoji: "💨", label: "Poder do Adversário", valor: `${totalAdversario}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} perdeu a disputa! Ficará preso no setor por 2 turnos!`;
                const texto = criarMolde("❌", "DERROTA NA VELOCIDADE", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas ${adversario.username} foi mais rápido!`, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `❌ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.velocidade_gif || gifs.movimentar)
                    .setTimestamp();

                if (!partida.jogadores[interaction.user.id]) partida.jogadores[interaction.user.id] = {};
                partida.jogadores[interaction.user.id].turnosPreso = 2;
            }

            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};