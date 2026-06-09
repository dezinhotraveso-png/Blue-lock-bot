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
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
        if (hab.bonus.passe) texto += `> │   ☄️ Passe +${hab.bonus.passe}\n`;
        if (hab.bonus.finalizacao) texto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

const tiposDrible = [
    { nome: "✨ Drible Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Drible básico e seguro.", emoji: "✨" },
    { nome: "⚡ Drible Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Drible rápido na velocidade.", emoji: "⚡" },
    { nome: "🎭 Drible Fantasia", bonus: 8, penalidade: -5, fatal: 10, desc: "Drible com firula.", emoji: "🎭" },
    { nome: "🔄 Drible Elástico", bonus: 6, penalidade: -3, fatal: 7, desc: "Drible elástico.", emoji: "🔄" },
    { nome: "💨 Arrancada", bonus: 4, penalidade: -1, fatal: 5, desc: "Explosão de velocidade.", emoji: "💨" }
];

module.exports = {
    name: 'driblar',
    description: 'Tenta driblar um adversário com habilidades',
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (partida.posse !== message.author.id) return message.reply(`❌ Você não está com a posse da bola!`);

        const adversario = message.mentions.users.first();
        if (!adversario) return message.reply('❌ Marque o adversário! Use: `c!driblar @adversario`');

        const jogadorAtual = partida.jogadores[message.author.id];
        const jogadorAdversario = partida.jogadores[adversario.id];
        if (!jogadorAtual || !jogadorAdversario) return message.reply('❌ Um dos jogadores não está registrado!');
        if (jogadorAtual.setor !== jogadorAdversario.setor) return message.reply(`❌ Você precisa estar no mesmo setor que ${adversario.username}!`);

        await mostrarTiposDrible(message, adversario, jogadorAtual.setor, partida, dados);

        async function mostrarTiposDrible(msgOriginal, adversario, setor, partida, dados) {
            const tiposRow = new ActionRowBuilder();
            tiposDrible.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "⚡ Drible Rápido") estilo = ButtonStyle.Success;
                if (tipo.nome === "🎭 Drible Fantasia") estilo = ButtonStyle.Danger;
                if (tipo.nome === "🔄 Drible Elástico") estilo = ButtonStyle.Secondary;
                
                tiposRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tipo_${tipo.nome.replace(/ /g, '_')}`)
                        .setLabel(tipo.nome)
                        .setStyle(estilo)
                );
            });

            const informativos = [
                { emoji: "📍", label: "Setor", valor: `${setor}` },
                { emoji: "✨", label: "Drible Base", valor: `+${dados.jogadores?.[msgOriginal.author.id]?.status?.drible || 0}` },
                { emoji: "🛡️", label: "Desarme Defensor", valor: `+${dados.jogadores?.[adversario.id]?.status?.desarme || 0}` }
            ];
            
            const resultado = `Escolha seu estilo de drible nos botões abaixo!`;
            const texto = criarMolde("🎯", "SELEÇÃO DE DRIBLE", `${msgOriginal.author.username} vai tentar driblar ${adversario.username}!`, informativos, resultado, "#2E86C1");

            const embedSelecao = new EmbedBuilder()
                .setColor('#2E86C1')
                .setAuthor({ name: `⚽ ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('🎯 ESTILO DE DRIBLE')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Tipos', value: tiposDrible.map(t => `**${t.emoji} ${t.nome}**\n└ *${t.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está com a posse pode driblar!', flags: 64 });
                const tipoNome = i.customId.replace('tipo_', '').replace(/_/g, ' ');
                const tipoInfo = tiposDrible.find(t => t.nome === tipoNome);
                collector.stop();
                
                // Verifica habilidades de drible
                const jogador = dados.jogadores[message.author.id];
                const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'drible');
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarDrible(i, tipoInfo, adversario, setor, partida, dados, null);
                } else {
                    await mostrarHabilidadesDrible(i, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis);
                }
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarHabilidadesDrible(interaction, tipoInfo, adversario, setor, partida, dados, habilidadesDisponiveis) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Drible__***\n> │\n`;
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
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este drible!*\n\n` +
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
                await executarDrible(i, tipoInfo, adversario, setor, partida, dados, habilidadeUsada);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarDrible(interaction, tipoInfo, adversario, setor, partida, dados, habilidadeKey) {
            let bonusDrible = dados.jogadores?.[interaction.user.id]?.status?.drible || 0;
            let bonusDesarme = dados.jogadores?.[adversario.id]?.status?.desarme || 0;
            let bonusTipo = tipoInfo.bonus;
            let penalidadeTipo = tipoInfo.penalidade;
            let chanceFatalFinal = tipoInfo.fatal;
            let podeRerrolar = false;
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;

            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs.driblar);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id], 
                    habilidadeKey, 
                    { bonusDrible, chanceFatal: chanceFatalFinal }
                );
                
                bonusDrible = bonusAplicado.bonusDrible || bonusDrible;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
                podeRerrolar = bonusAplicado.podeRerrolarDrible || false;
            }

            const dadoAtacante = Math.floor(Math.random() * 20) + 1;
            const dadoDefensor = Math.floor(Math.random() * 20) + 1;
            
            // Soma APENAS bônus positivos
            let totalAtacante = dadoAtacante + bonusDrible + bonusTipo;
            let totalDefensor = dadoDefensor + bonusDesarme;

            let erroFatal = dadoAtacante <= chanceFatalFinal;
            let rerrolou = false;
            const dadoOriginal = dadoAtacante;
            
            if (habilidadeKey === 'freestyle' && erroFatal && podeRerrolar) {
                const novoDado = Math.floor(Math.random() * 20) + 1;
                const novoTotal = novoDado + bonusDrible + bonusTipo;
                
                erroFatal = novoDado <= chanceFatalFinal;
                totalAtacante = novoTotal;
                rerrolou = true;
            }
            
            let embed = null;

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
                    { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} perdeu a bola sozinho! ${adversario.username} recupera a posse!`;
                const texto = criarMolde("💥", "ERRO FATAL NO DRIBLE", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e perdeu o equilíbrio!`, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ERRO FATAL!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                partida.posse = adversario.id;
            } 
            else if (totalAtacante > totalDefensor) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusDrible + bonusTipo}` },
                    { emoji: "🎯", label: "Poder do Drible", valor: `${totalAtacante}` },
                    { emoji: "🛡️", label: "Poder do Defensor", valor: `${totalDefensor}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} venceu o duelo e ganha prioridade contra ${adversario.username}!`;
                const texto = criarMolde("✨", "DRIBLE BEM-SUCEDIDO", `${interaction.user.username} usou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e passou por ${adversario.username}!`, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) embed.setImage(gifHabilidade);
                else embed.setImage(gifs.driblar);

                if (!partida.prioridades) partida.prioridades = {};
                partida.prioridades[interaction.user.id] = { contra: adversario.id, turnos: 1 };
            } 
            else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
                    { emoji: "🏅", label: "Bônus", valor: `+${bonusDrible + bonusTipo}` },
                    { emoji: "🎯", label: "Poder do Drible", valor: `${totalAtacante}` },
                    { emoji: "🛡️", label: "Poder do Defensor", valor: `${totalDefensor}` }
                ];
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${adversario.username} roubou a bola e agora está com a posse!`;
                const texto = criarMolde("🛡️", "DESARMADO", `${interaction.user.username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}, mas ${adversario.username} desarmou!`, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `🛡️ ${adversario.username}`, iconURL: adversario.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.driblar)
                    .setTimestamp();

                partida.posse = adversario.id;
            }

            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};