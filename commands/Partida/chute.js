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
        if (hab.bonus.finalizacao) texto += `> │   🦵 Finalização +${hab.bonus.finalizacao}\n`;
        if (hab.bonus.drible) texto += `> │   ✨ Drible +${hab.bonus.drible}\n`;
        if (hab.bonus.velocidade) texto += `> │   ⚡ Velocidade +${hab.bonus.velocidade}\n`;
        if (hab.bonus.dominio) texto += `> │   ⚽ Domínio +${hab.bonus.dominio}\n`;
        if (hab.bonus.fisico) texto += `> │   💪 Físico +${hab.bonus.fisico}\n`;
    }
    if (hab.efeito) texto += `> │   📝 ${hab.efeito}\n`;
    return texto;
}

// Debuffs por distância - C1 a C18
const debuffsPorDistancia = {
    "gol_extremo": -35, 
    "gol_muito_longe": -25, 
    "gol_longe": -15,
    "gol_medio": -8, 
    "gol_perto": -3, 
    "gol_area": 0
};

// Distância para Time Casa (Gol está em C1-C5)
const distanciaGolTimeCasa = {
    "C1": "gol_area", "C2": "gol_area", "C3": "gol_area", "C4": "gol_area", "C5": "gol_area",
    "C6": "gol_perto", "C7": "gol_perto", "C8": "gol_perto", "C9": "gol_perto", "C10": "gol_perto",
    "C11": "gol_medio", "C12": "gol_medio", "C13": "gol_medio", "C14": "gol_medio", "C15": "gol_medio",
    "C16": "gol_longe", "C17": "gol_longe", "C18": "gol_longe"
};

// Distância para Time Fora (Gol está em C14-C18)
const distanciaGolTimeFora = {
    "C1": "gol_longe", "C2": "gol_longe", "C3": "gol_longe",
    "C4": "gol_medio", "C5": "gol_medio", "C6": "gol_medio", "C7": "gol_medio", "C8": "gol_medio",
    "C9": "gol_perto", "C10": "gol_perto", "C11": "gol_perto", "C12": "gol_perto", "C13": "gol_perto",
    "C14": "gol_area", "C15": "gol_area", "C16": "gol_area", "C17": "gol_area", "C18": "gol_area"
};

// Setores C1 a C18
const setoresCampo = {
    "C1": "Goleiro", "C2": "Pequena Área Esq", "C3": "Pequena Área Central", 
    "C4": "Pequena Área Dir", "C5": "Linha de Fundo Esq", "C6": "Linha de Fundo Central",
    "C7": "Linha de Fundo Dir", "C8": "Entrada da Área Esq", "C9": "Entrada da Área Central",
    "C10": "Entrada da Área Dir", "C11": "Meia-Lua Esq", "C12": "Meia-Lua Central",
    "C13": "Meia-Lua Dir", "C14": "Lateral Esq", "C15": "Lateral Central",
    "C16": "Lateral Dir", "C17": "Campo Defensivo", "C18": "Campo Ataque"
};

// Forças disponíveis
const forcas = [
    { nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Chute fraco. Seguro, mas facilmente defensável." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Chute médio. Equilibrado entre força e precisão." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Chute forte. Potente, mas impreciso." }
];

// Tipos de chute
const tiposChute = [
    { nome: "chute", emoji: "⚽", label: "CHUTE", fatal: 3, desc: "Finalização padrão.", gifKey: "chute_normal", bonus: 0, penalidade: 0 },
    { nome: "voleio", emoji: "🦶", label: "VOLEIO", fatal: 12, desc: "Chute de primeira.", gifKey: "voleio", bonus: 8, penalidade: -4 },
    { nome: "bicicleta", emoji: "🚲", label: "BICICLETA", fatal: 15, desc: "Chute acrobático.", gifKey: "bicicleta", bonus: 12, penalidade: -8 },
    { nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", fatal: 6, desc: "Toque sutil.", gifKey: "cavadinha", bonus: 4, penalidade: 2 }
];

module.exports = {
    name: 'chute',
    description: '💫 Finaliza ao gol com diferentes tipos de chute e habilidades',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ Não há partida ativa!');
        if (!partida.jogadores[message.author.id]) return message.reply('❌ Você não está na partida!');
        if (partida.posse !== message.author.id) return message.reply(`❌ Você não está com a posse da bola!`);
        if (partida.aguardandoPontapeAposGol) return message.reply('⚽ O jogo está parado! Use `c!pontape` para recomeçar.');

        const jogador = partida.jogadores[message.author.id];
        const setorAtual = jogador.setor || "C11";
        const timeDoJogador = jogador.time;
        
        // Verificar distância do gol baseado no time
        let distancia = "gol_area";
        let golLocal = "";
        
        if (timeDoJogador === partida.timeCasa) {
            distancia = distanciaGolTimeCasa[setorAtual] || "gol_longe";
            golLocal = "C1-C5";
        } else {
            distancia = distanciaGolTimeFora[setorAtual] || "gol_longe";
            golLocal = "C14-C18";
        }
        const debuff = debuffsPorDistancia[distancia] || 0;

        // Verificar Golden Zone
        const jogadorData = dados.jogadores[message.author.id];
        const gz = jogadorData?.goldenZone;
        const estaNaGZ = gz?.desbloqueada && setorAtual === gz.setor;

        await mostrarTiposChute(message, setorAtual, debuff, golLocal, timeDoJogador, partida, dados, estaNaGZ, gz);

        async function mostrarTiposChute(msgOriginal, setorAtual, debuff, golLocal, timeDoJogador, partida, dados, estaNaGZ, gz) {
            const tiposRow = new ActionRowBuilder();
            tiposChute.forEach(tipo => {
                let estilo = ButtonStyle.Primary;
                if (tipo.nome === "voleio") estilo = ButtonStyle.Success;
                if (tipo.nome === "bicicleta") estilo = ButtonStyle.Danger;
                if (tipo.nome === "cavadinha") estilo = ButtonStyle.Secondary;
                
                tiposRow.addComponents(
                    new ButtonBuilder().setCustomId(`tipo_${tipo.nome}`).setLabel(`${tipo.emoji} ${tipo.label}`).setStyle(estilo)
                );
            });

            const informativos = [
                { emoji: "📍", label: "Setor Atual", valor: `${setorAtual} - ${setoresCampo[setorAtual] || setorAtual}` },
                { emoji: "🎯", label: "Gol Alvo", valor: `${golLocal}` },
                { emoji: "⚠️", label: "Debuff Distância", valor: `${debuff} pts` },
                { emoji: "🦵", label: "Finalização Base", valor: `+${dados.jogadores?.[msgOriginal.author.id]?.status?.finalizacao || 0}` }
            ];
            
            if (estaNaGZ) {
                informativos.unshift({ emoji: "🟡", label: "Golden Zone", valor: "Ativa (+5 no chute)" });
            }
            
            const resultado = `Escolha o tipo de chute e depois a força.`;
            const texto = criarMolde("🎯", "SELEÇÃO DE TÉCNICA", `${msgOriginal.author.username} se preparou para finalizar ao gol!`, informativos, resultado, "#2E86C1");

            const embedSelecao = new EmbedBuilder()
                .setColor(estaNaGZ ? '#FFD700' : '#2E86C1')
                .setAuthor({ name: `💫 ${msgOriginal.author.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle(estaNaGZ ? '🟡 CHUTE NA GOLDEN ZONE 🟡' : '💫 FINALIZAÇÃO')
                .setDescription(texto)
                .addFields(
                    { name: '⚡ Técnicas', value: tiposChute.map(t => `**${t.emoji} ${t.label}**\n└ *${t.desc}*\n> Bônus: +${t.bonus} | Margem Fatal: ${t.fatal}`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 60 segundos' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [tiposRow] });
            const collector = msg.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) return i.reply({ content: '❌ Apenas quem está com a posse pode chutar!', flags: 64 });
                const tipoSelecionado = i.customId.replace('tipo_', '');
                const tipoInfo = tiposChute.find(t => t.nome === tipoSelecionado);
                collector.stop();
                await mostrarForcasChute(i, tipoInfo, debuff, setorAtual, golLocal, timeDoJogador, partida, dados, estaNaGZ, gz);
            });
            collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
        }

        async function mostrarForcasChute(interaction, tipoInfo, debuff, setorAtual, golLocal, timeDoJogador, partida, dados, estaNaGZ, gz) {
            const forcaRow = new ActionRowBuilder();
            forcas.forEach(forca => {
                forcaRow.addComponents(
                    new ButtonBuilder().setCustomId(`forca_${forca.nome.replace(/ /g, '_')}`).setLabel(forca.nome).setStyle(ButtonStyle.Secondary)
                );
            });

            const informativos = [
                { emoji: "⚽", label: "Tipo Escolhido", valor: `${tipoInfo.label}` },
                { emoji: "📍", label: "Setor", valor: `${setorAtual} - ${setoresCampo[setorAtual] || setorAtual}` }
            ];
            
            const resultado = `A intensidade define o multiplicador e o risco de falha crítica.`;
            const texto = criarMolde("⚖️", "DEFINIÇÃO DE FORÇA", `${interaction.user.username} define a potência da finalização...`, informativos, resultado, "#F1C40F");

            const embedForca = new EmbedBuilder()
                .setColor('#F1C40F')
                .setAuthor({ name: `💫 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('⚖️ INTENSIDADE DA FINALIZAÇÃO')
                .setDescription(texto)
                .addFields(
                    { name: '💪 Forças', value: forcas.map(f => `**${f.nome}**\n└ Bônus: +${f.bonus} | Multiplicador: x${f.multiplicador} | Fatal: ≤${f.fatal}`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Escolha a força do chute' });

            await interaction.update({ embeds: [embedForca], components: [forcaRow] });
            
            const msgAtual = await interaction.fetchReply();
            const collector = msgAtual.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito a quem está chutando!', flags: 64 });
                const forcaNome = i.customId.replace('forca_', '').replace(/_/g, ' ');
                const forca = forcas.find(f => f.nome === forcaNome);
                collector.stop();
                
                const jogador = dados.jogadores[interaction.user.id];
                const habilidadesDisponiveis = listarHabilidadesPorTipo(jogador, 'chute');
                
                if (habilidadesDisponiveis.length === 0) {
                    await executarChute(i, tipoInfo, forca, debuff, setorAtual, timeDoJogador, partida, dados, null, estaNaGZ, gz);
                } else {
                    await mostrarHabilidadesChute(i, tipoInfo, forca, debuff, setorAtual, timeDoJogador, partida, dados, habilidadesDisponiveis, estaNaGZ, gz);
                }
            });
        }

        async function mostrarHabilidadesChute(interaction, tipoInfo, forca, debuff, setorAtual, timeDoJogador, partida, dados, habilidadesDisponiveis, estaNaGZ, gz) {
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
            
            let habilidadesTexto = `> ˚ ˳ ﹙✨﹚***__Habilidades de Chute__***\n> │\n`;
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
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${interaction.user.username}, escolha uma habilidade para este chute!*\n\n` +
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
                await executarChute(i, tipoInfo, forca, debuff, setorAtual, timeDoJogador, partida, dados, habilidadeUsada, estaNaGZ, gz);
                
                if (mensagemConfirmacao) {
                    await i.followUp({ content: mensagemConfirmacao, flags: 64 });
                }
            });
        }

        async function executarChute(interaction, tipoInfo, forca, debuff, setorAtual, timeDoJogador, partida, dados, habilidadeKey, estaNaGZ, gz) {
            let bonusChute = dados.jogadores?.[interaction.user.id]?.status?.finalizacao || 0;
            let bonusTipo = tipoInfo.bonus || 0;
            let penalidadeTipo = tipoInfo.penalidade || 0;
            let multiplicador = forca.multiplicador;
            let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
            let podeRerrolar = false;
            let gifHabilidade = null;
            const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
            
            // Bônus da Golden Zone
            let bonusGZ = estaNaGZ ? 5 : 0;
            let anulouErro = false;
            
            if (habilidadeKey) {
                const habInfo = listarTodasHabilidades()[habilidadeKey];
                if (habInfo) gifHabilidade = getGifHabilidade(habInfo, gifs[tipoInfo.gifKey]);
                
                const bonusAplicado = aplicarBonusHabilidade(
                    dados.jogadores[interaction.user.id], 
                    habilidadeKey, 
                    { bonusChute, multiplicador, chanceFatal: chanceFatalFinal }
                );
                
                bonusChute = bonusAplicado.bonusChute || bonusChute;
                multiplicador = bonusAplicado.multiplicador || multiplicador;
                chanceFatalFinal = bonusAplicado.chanceFatal || chanceFatalFinal;
                podeRerrolar = bonusAplicado.podeRerrolar || false;
            }
            
            const dado = Math.floor(Math.random() * 40) + 1;
            
            let somaBase = (dado + bonusChute + bonusTipo + forca.bonus + debuff + bonusGZ);
            let total = Math.floor(somaBase * multiplicador);
            if (total < 1) total = 1;

            let erroFatal = dado <= chanceFatalFinal;
            let rerrolou = false;
            const dadoOriginal = dado;
            
            // Anular erro fatal na Golden Zone
            if (estaNaGZ && erroFatal && gz?.anulacoesRestantes > 0) {
                gz.anulacoesRestantes--;
                erroFatal = false;
                anulouErro = true;
                
                // Salvar atualização da GZ
                dados.jogadores[interaction.user.id].goldenZone = gz;
            }
            
            // Second Chance habilidade
            if (habilidadeKey === 'secondChance' && erroFatal && podeRerrolar) {
                const novoDado = Math.floor(Math.random() * 40) + 1;
                const novaSomaBase = (novoDado + bonusChute + bonusTipo + forca.bonus + debuff + bonusGZ);
                let novoTotal = Math.floor(novaSomaBase * multiplicador);
                if (novoTotal < 1) novoTotal = 1;
                
                erroFatal = novoDado <= chanceFatalFinal;
                total = novoTotal;
                rerrolou = true;
            }
            
            let embed = null;

            if (erroFatal) {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
                    { emoji: "🔴", label: "Margem Fatal", valor: `≤ ${chanceFatalFinal}` },
                    { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo + forca.penalidade + debuff}` },
                    { emoji: "📍", label: "Setor", valor: `${setorAtual} - ${setoresCampo[setorAtual] || setorAtual}` }
                ];
                
                if (estaNaGZ && anulouErro) informativos.unshift({ emoji: "🟡", label: "Golden Zone", valor: "Erro anulado!" });
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `${interaction.user.username} errou feio! A bola vai para fora.`;
                const texto = criarMolde("💥", "ERRO FATAL!", `${interaction.user.username} tentou um ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''} e errou!`, informativos, resultado, "#E74C3C");

                embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setAuthor({ name: `💥 FALHA CRÍTICA!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(gifs.erro_fatal)
                    .setTimestamp();

                partida.posse = null;
                partida.aguardandoPontapeAposGol = true;

            } else {
                const informativos = [
                    { emoji: "🎲", label: "Dado", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
                    { emoji: "🏅", label: "Bônus Total", valor: `+${bonusChute + bonusTipo + forca.bonus + bonusGZ}` },
                    { emoji: "⚠️", label: "Debuff Distância", valor: `${debuff}` },
                    { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
                    { emoji: "🎯", label: "Poder Final", valor: `${total}` },
                    { emoji: "📍", label: "Setor", valor: `${setorAtual} - ${setoresCampo[setorAtual] || setorAtual}` }
                ];
                
                if (estaNaGZ) informativos.unshift({ emoji: "🟡", label: "Golden Zone", valor: `+5 (Ativa)` });
                if (anulouErro) informativos.unshift({ emoji: "🟡", label: "Golden Zone", valor: "Erro anulado!" });
                if (habilidadeKey) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: nomeHabilidade });
                
                const resultado = `O time adversário tem até 30s para defender! Use \`c!defender\``;
                const texto = criarMolde("⚽", "FINALIZAÇÃO EXECUTADA", `${interaction.user.username} executou um ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` com ${nomeHabilidade}` : ''}!`, informativos, resultado, "#2ECC71");

                embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setAuthor({ name: `🔥 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setTimestamp();
                
                if (gifHabilidade) {
                    embed.setImage(gifHabilidade);
                } else {
                    embed.setImage(gifs[tipoInfo.gifKey] || gifs.chute_normal);
                }

                partida.aguardandoChute = true;
                partida.chutePendente = {
                    jogadorId: interaction.user.id, 
                    jogadorNome: interaction.user.username,
                    dado: total, 
                    setor: setorAtual, 
                    tipo: `${tipoInfo.label} ${forca.nome}`,
                    habilidade: nomeHabilidade,
                    timeAtacante: timeDoJogador,
                    tempo: Date.now(),
                    debuff: debuff,
                    distancia: distancia,
                    goldenZone: estaNaGZ
                };
            }

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};