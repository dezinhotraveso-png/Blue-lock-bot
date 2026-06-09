const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { duelo_1v1, erro_fatal } = require('../../utils/gifs.js');

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

const opcoesDuelo = [
    { nome: "💨 Velocidade", valor: "velocidade", bonusAtributo: "drible", bonusDefensor: "desarme", desc: "Usa sua agilidade e drible para passar pelo adversário.", emoji: "💨" },
    { nome: "💪 Força", valor: "forca", bonusAtributo: "fisico", bonusDefensor: "desarme", desc: "Usa sua força física para proteger a bola no pivô.", emoji: "💪" }
];

module.exports = {
    name: '1v1',
    description: '⚔️ Inicia um duelo 1v1 (drible vs desarme) contra um adversário no mesmo setor',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) return message.reply('❌ **Nenhuma partida ativa!** Use `c!entrar` para criar/entrar em uma partida.');

        const adversario = message.mentions.users.first();
        if (!adversario) return message.reply('❌ **Marque o adversário!** Use: `c!1v1 @adversario`');
        if (adversario.id === message.author.id) return message.reply('❌ **Você não pode duelar contra si mesmo!**');

        const jogadorAtual = partida.jogadores[message.author.id];
        const jogadorAdversario = partida.jogadores[adversario.id];
        
        if (!jogadorAtual) return message.reply('❌ **Você não está registrado na partida!** Use `c!entrar` primeiro.');
        if (!jogadorAdversario) return message.reply(`❌ **${adversario.username} não está registrado na partida!**`);
        if (jogadorAtual.setor !== jogadorAdversario.setor) return message.reply(`❌ **Setores diferentes!** Você está no setor \`${jogadorAtual.setor}\` e ${adversario.username} está no setor \`${jogadorAdversario.setor}\`. Ambos precisam estar no mesmo setor!`);
        if (partida.posse && partida.posse !== message.author.id) return message.reply('❌ **A bola não está com você!** Aguarde sua vez.');

        await mostrarOpcoesDuelo(message, adversario, jogadorAtual.setor, partida, dados);

        async function mostrarOpcoesDuelo(msgOriginal, adversario, setor, partida, dados) {
            const opcoesRow = new ActionRowBuilder();
            opcoesDuelo.forEach(opcao => {
                let estilo = ButtonStyle.Primary;
                if (opcao.valor === "forca") estilo = ButtonStyle.Success;
                
                opcoesRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`opcao_${opcao.valor}`)
                        .setLabel(opcao.nome)
                        .setStyle(estilo)
                        .setEmoji(opcao.emoji)
                );
            });

            const jogadorStats = dados.jogadores?.[msgOriginal.author.id]?.status || {};
            const defensorStats = dados.jogadores?.[adversario.id]?.status || {};

            const texto = 
                `˚ ˳ ﹙⚔️﹚***__DUELO 1v1__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${msgOriginal.author.username} desafiou ${adversario.username} para um duelo 1v1!*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor__** —  \`${setor}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Seu Drible__** —  \`+${jogadorStats.drible || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 💪 ⦘**  **__Seu Físico__** —  \`+${jogadorStats.fisico || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Desarme de ${adversario.username}__** —  \`+${defensorStats.desarme || 0}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Escolha seu estilo de duelo nos botões abaixo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embedSelecao = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `⚔️ ${msgOriginal.author.username} vs ${adversario.username}`, iconURL: msgOriginal.author.displayAvatarURL() })
                .setTitle('⚔️ DUELO 1v1!')
                .setDescription(texto)
                .setImage(duelo_1v1)
                .addFields(
                    { name: '🎯 Estilos de Duelo', value: opcoesDuelo.map(o => `**${o.emoji} ${o.nome}**\n└ *${o.desc}*`).join('\n\n'), inline: false }
                )
                .setFooter({ text: 'Tempo limite: 30 segundos • Escolha seu estilo' });

            const msg = await msgOriginal.reply({ embeds: [embedSelecao], components: [opcoesRow] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== msgOriginal.author.id) {
                    return i.reply({ content: '❌ **Apenas o desafiante pode escolher!**', flags: 64 });
                }
                
                const opcaoValor = i.customId.replace('opcao_', '');
                const opcaoInfo = opcoesDuelo.find(o => o.valor === opcaoValor);
                
                collector.stop();
                await executarDuelo(i, opcaoInfo, adversario, setor, partida, dados);
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await msg.edit({ 
                        embeds: [new EmbedBuilder()
                            .setColor('#FFA500')
                            .setDescription('⏰ **Tempo esgotado!** O duelo foi cancelado.')
                        ], 
                        components: [] 
                    }).catch(() => {});
                }
            });
        }

        async function executarDuelo(interaction, opcaoInfo, adversario, setor, partida, dados) {
            const jogadorStats = dados.jogadores?.[interaction.user.id]?.status || {};
            const defensorStats = dados.jogadores?.[adversario.id]?.status || {};
            
            let bonusAtacante = 0;
            let bonusDefensor = defensorStats.desarme || 0;
            let atributoUsado = '';
            
            if (opcaoInfo.valor === 'velocidade') {
                bonusAtacante = jogadorStats.drible || 0;
                atributoUsado = 'Drible';
            } else {
                bonusAtacante = jogadorStats.fisico || 0;
                atributoUsado = 'Físico';
            }
            
            const dadoAtacante = Math.floor(Math.random() * 20) + 1;
            const dadoDefensor = Math.floor(Math.random() * 20) + 1;
            
            const totalAtacante = dadoAtacante + bonusAtacante;
            const totalDefensor = dadoDefensor + bonusDefensor;
            
            let embed = null;
            
            // Erro fatal do atacante (tirou 1)
            if (dadoAtacante === 1) {
                const descricao = `${interaction.user.username} tentou usar **${opcaoInfo.nome}**, mas tropeçou na bola e perdeu totalmente o controle!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dadoAtacante} (FATAL!)` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `${dadoDefensor} + ${bonusDefensor} = ${totalDefensor}` },
                    { emoji: "💢", label: "Consequência", valor: "Perde a posse de bola" }
                ];
                const resultado = `${adversario.username} recupera a bola e sai em contra-ataque!`;
                const texto = criarMolde("💥", "ERRO FATAL NO DUELO", descricao, informativos, resultado, "#DC143C");

                embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setAuthor({ name: `💥 ${interaction.user.username} tropeçou!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(erro_fatal)
                    .setTimestamp();
                    
                partida.posse = adversario.id;
                partida.posseNome = adversario.username;
                
            } 
            // Erro fatal do defensor (tirou 1)
            else if (dadoDefensor === 1) {
                const descricao = `${adversario.username} tentou desarmar, mas escorregou e ficou no chão!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dadoAtacante} + ${bonusAtacante} = ${totalAtacante}` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `${dadoDefensor} (FATAL!)` },
                    { emoji: "🏅", label: "Vantagem", valor: "Passa livremente" }
                ];
                const resultado = `${interaction.user.username} passa livremente pelo adversário e ganha prioridade por 1 turno!`;
                const texto = criarMolde("✨", "VANTAGEM NO DUELO", descricao, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username} se livrou!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(duelo_1v1)
                    .setTimestamp();
                    
                if (!partida.prioridades) partida.prioridades = {};
                partida.prioridades[interaction.user.id] = { contra: adversario.id, turnos: 1 };
                
            } 
            // Atacante venceu
            else if (totalAtacante > totalDefensor) {
                const descricao = `${interaction.user.username} usou **${opcaoInfo.nome}** e venceu o duelo contra ${adversario.username}!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dadoAtacante} + ${bonusAtacante} = **${totalAtacante}**` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `${dadoDefensor} + ${bonusDefensor} = **${totalDefensor}**` },
                    { emoji: "🏅", label: "Atributo Usado", valor: `${atributoUsado} (+${bonusAtacante})` },
                    { emoji: "⚡", label: "Vantagem", valor: "Ganhou prioridade por 1 turno" }
                ];
                const resultado = `${interaction.user.username} venceu o duelo e ganha prioridade contra ${adversario.username}!`;
                const texto = criarMolde("✅", "VITÓRIA NO DUELO", descricao, informativos, resultado, "#00FF00");

                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `✅ ${interaction.user.username} venceu!`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(duelo_1v1)
                    .setTimestamp();
                    
                if (!partida.prioridades) partida.prioridades = {};
                partida.prioridades[interaction.user.id] = { contra: adversario.id, turnos: 1 };
                
            } 
            // Defensor venceu
            else {
                const descricao = `${adversario.username} conseguiu desarmar ${interaction.user.username} com precisão!`;
                const informativos = [
                    { emoji: "🎲", label: "Dado Atacante", valor: `${dadoAtacante} + ${bonusAtacante} = **${totalAtacante}**` },
                    { emoji: "🛡️", label: "Dado Defensor", valor: `${dadoDefensor} + ${bonusDefensor} = **${totalDefensor}**` },
                    { emoji: "🔄", label: "Consequência", valor: "Posse invertida" }
                ];
                const resultado = `${adversario.username} recupera a bola e agora está no ataque!`;
                const texto = criarMolde("🛡️", "DERROTA NO DUELO", descricao, informativos, resultado, "#FF0000");

                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setAuthor({ name: `🛡️ ${adversario.username} desarmou!`, iconURL: adversario.displayAvatarURL() })
                    .setDescription(texto)
                    .setImage(duelo_1v1)
                    .setTimestamp();
                    
                partida.posse = adversario.id;
                partida.posseNome = adversario.username;
            }
            
            partida.minuto += 0.5;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};