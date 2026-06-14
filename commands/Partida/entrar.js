const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'entrar',
    description: '⚽ Entra na partida como jogador',
    aliases: ['join', 'entrarpartida'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ NENHUMA PARTIDA ATIVA')
                .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 ${message.author.username}, não há partida ativa neste canal!\n\n◞⚡ Use \`c!partida iniciar\` para começar um jogo.`)
                .setFooter({ text: '⚽ Blue Lock • Sistema de Partidas' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (partida.jogadores && partida.jogadores[message.author.id]) {
            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('⚠️ VOCÊ JÁ ESTÁ NA PARTIDA')
                .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 ${message.author.username}, você já está na partida!\n\n◞⚡ Use \`c!campo\` para ver o estado do jogo.`)
                .setFooter({ text: '⚽ Blue Lock • Sistema de Partidas' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const time = args[0]?.toLowerCase();
        
        if (!time || (time !== 'casa' && time !== 'fora')) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('entrar_casa').setLabel(`🏠 ${partida.timeCasa || 'Casa'}`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('entrar_fora').setLabel(`✈️ ${partida.timeFora || 'Fora'}`).setStyle(ButtonStyle.Danger)
            );
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⚽ ESCOLHA SEU TIME')
                .setDescription(
                    `﹒ ⟢ 🏆 ﹒\n\n` +
                    `𖦹 ${message.author.username}, escolha em qual time você quer jogar!\n\n` +
                    `ㅤㅤ⌞ 🏠 ⌝\n` +
                    `⤷ **${partida.timeCasa || 'Time da Casa'}**\n` +
                    `   Joga no lado esquerdo do campo\n\n` +
                    `ㅤㅤ⌞ ✈️ ⌝\n` +
                    `⤷ **${partida.timeFora || 'Time Visitante'}**\n` +
                    `   Joga no lado direito do campo\n\n` +
                    `◞⚡ Clique no botão do seu time abaixo!`
                )
                .setFooter({ text: '⚽ Blue Lock • Escolha sabiamente' })
                .setTimestamp();
            
            const msg = await message.reply({ embeds: [embed], components: [row] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });
            
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '❌ Apenas você pode escolher seu time!', flags: 64 });
                }
                collector.stop();
                const timeEscolhido = i.customId === 'entrar_casa' ? 'casa' : 'fora';
                await entrarNaPartida(i, message, timeEscolhido, dados, partida, partidaId);
            });
            
            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });
            return;
        }

        await entrarNaPartida(message, message, time, dados, partida, partidaId);
    }
};

async function entrarNaPartida(interaction, message, time, dados, partida, partidaId) {
    const nomeTime = time === 'casa' ? partida.timeCasa : partida.timeFora;
    const corTime = time === 'casa' ? '#2ECC71' : '#E74C3C';
    const iconeTime = time === 'casa' ? '🏠' : '✈️';
    
    // Recarrega dados
    let dadosAtual = {};
    if (fs.existsSync(blueLockPath)) dadosAtual = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
    const partidaAtual = dadosAtual.partidas[partidaId];
    
    if (!partidaAtual || !partidaAtual.ativa) {
        return interaction.update({ content: '❌ A partida não está mais ativa!', embeds: [], components: [] });
    }
    
    if (!partidaAtual.jogadores) partidaAtual.jogadores = {};
    
    // Adiciona jogador
    partidaAtual.jogadores[message.author.id] = {
        nome: message.author.username,
        time: nomeTime,
        timeTipo: time
    };

    // Adiciona aos times
    if (!partidaAtual.times) partidaAtual.times = {};
    if (!partidaAtual.times[nomeTime]) partidaAtual.times[nomeTime] = { jogadores: [] };
    if (!partidaAtual.times[nomeTime].jogadores.includes(message.author.id)) {
        partidaAtual.times[nomeTime].jogadores.push(message.author.id);
    }

    // Cria perfil se não existir
    if (!dadosAtual.jogadores) dadosAtual.jogadores = {};
    if (!dadosAtual.jogadores[message.author.id]) {
        dadosAtual.jogadores[message.author.id] = {
            id: message.author.id,
            nome: message.author.username,
            status: { 
                finalizacao: 0, drible: 0, passe: 0, desarme: 0, 
                velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, 
                dominio: 0, marcacao: 0 
            },
            estatisticas: { 
                gols: 0, assistencias: 0, passes: 0, dribles: 0, 
                desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, 
                vitorias: 0
            }
        };
    }

    fs.writeFileSync(blueLockPath, JSON.stringify(dadosAtual, null, 2));
    
    const totalJogadores = Object.keys(partidaAtual.jogadores).length;
    const golsCasa = partidaAtual.golsCasa || 0;
    const golsFora = partidaAtual.golsFora || 0;
    
    const textoResultado = 
        `﹒ ⟢ ${iconeTime} ﹒\n\n` +
        `𖦹 **${message.author.username}** entrou na partida!\n\n` +
        `ㅤㅤ⌞ 📋 ⌝\n` +
        `⤷ 🏠 **Time:** \`${nomeTime}\`\n` +
        `⤷ 👥 **Jogadores:** \`${totalJogadores}\`\n` +
        `⤷ 📊 **Placar:** \`${partidaAtual.timeCasa || 'Casa'} ${golsCasa} - ${golsFora} ${partidaAtual.timeFora || 'Fora'}\`\n\n` +
        `◞⚡ Use \`c!campo\` para ver o estado da partida!\n` +
        `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;

    const embedResultado = new EmbedBuilder()
        .setColor(corTime)
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('✅ ENTROU NA PARTIDA!')
        .setDescription(textoResultado)
        .setFooter({ text: `⚽ Blue Lock • ${nomeTime}` })
        .setTimestamp();

    if (interaction.update) {
        await interaction.update({ embeds: [embedResultado], components: [] });
    } else {
        await interaction.reply({ embeds: [embedResultado] });
    }
}