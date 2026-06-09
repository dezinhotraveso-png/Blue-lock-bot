const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// 🎲 FAMÍLIAS DISPONÍVEIS
const familias = {
    // 🟢 COMUNS (80%)
    comuns: [
        { nome: "Igaguri", bonus: 0, emoji: "🟢" },
        { nome: "Naruhaya", bonus: 0, emoji: "🟢" },
        { nome: "Fukaku", bonus: 0, emoji: "🟢" }
    ],
    // 🔵 RARAS (15%)
    raras: [
        { nome: "Isagi", bonus: 5, emoji: "🔵" },
        { nome: "Chigiri", bonus: 5, emoji: "🔵" },
        { nome: "Barou", bonus: 5, emoji: "🔵" },
        { nome: "Nagi", bonus: 5, emoji: "🔵" },
        { nome: "Bachira", bonus: 5, emoji: "🔵" },
        { nome: "Yukimiya", bonus: 5, emoji: "🔵" },
        { nome: "Karasu", bonus: 5, emoji: "🔵" },
        { nome: "Otoya", bonus: 5, emoji: "🔵" },
        { nome: "Hiori", bonus: 5, emoji: "🔵" },
        { nome: "Kurona", bonus: 5, emoji: "🔵" },
        { nome: "Aryu", bonus: 5, emoji: "🔵" },
        { nome: "Tokimitsu", bonus: 5, emoji: "🔵" },
        { nome: "Kiyora", bonus: 5, emoji: "🔵" },
        { nome: "Agi", bonus: 5, emoji: "🔵" },
        { nome: "Ikki", bonus: 5, emoji: "🔵" }
    ],
    // 🟣 LENDÁRIAS (4%)
    lendarias: [
        { nome: "Kunigami", bonus: 10, emoji: "🟣" },
        { nome: "Shidou", bonus: 10, emoji: "🟣" },
        { nome: "Bachira", bonus: 10, emoji: "🟣" },
        { nome: "Chigiri", bonus: 10, emoji: "🟣" },
        { nome: "Nagi", bonus: 10, emoji: "🟣" },
        { nome: "Barou", bonus: 10, emoji: "🟣" },
        { nome: "Yukimiya", bonus: 10, emoji: "🟣" }
    ],
    // 👑 SUPREMAS (1%)
    supremas: [
        { nome: "Itoshi", bonus: 20, emoji: "👑" },
        { nome: "Kaiser", bonus: 20, emoji: "👑" },
        { nome: "Loki", bonus: 20, emoji: "👑" },
        { nome: "Lorenzo", bonus: 20, emoji: "👑" },
        { nome: "Aiku", bonus: 20, emoji: "👑" },
        { nome: "Mikage", bonus: 20, emoji: "👑" },
        { nome: "Hugo", bonus: 20, emoji: "👑" },
        { nome: "Iglesias", bonus: 20, emoji: "👑" }
    ]
};

// GIF do roll
const gifRoll = "https://i.pinimg.com/originals/16/50/76/165076da0295092260bba9f9ddd2e720.gif";

module.exports = {
    name: 'familia',
    description: '🎲 Sorteia uma família para o jogador gastando um roll guardado',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        
        if (!dados.jogadores) dados.jogadores = {};
        if (!dados.jogadores[message.author.id]) dados.jogadores[message.author.id] = { rolls: {} };
        
        const jogador = dados.jogadores[message.author.id];
        if (!jogador.rolls) jogador.rolls = {};
        
        // Garante que a propriedade de quantidade de rolls exista
        if (typeof jogador.rolls.quantidade === 'undefined') jogador.rolls.quantidade = 0;

        // VERIFICA SE O JOGADOR TEM ROLLS DISPONÍVEIS
        if (jogador.rolls.quantidade <= 0) {
            const embedErro = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Sem Rolls Suficientes!')
                .setDescription(`Você não possui **rolls** guardados para sortear uma família.\nConsiga mais para tentar a sorte!`)
                .setFooter({ text: '⚽ Blue Lock' });
            
            return message.reply({ embeds: [embedErro] });
        }
        
        // Verifica se já tem família
        if (jogador.rolls.familia && jogador.rolls.familia !== "Não possui") {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('trocar_familia')
                        .setLabel(`🔄 TROCAR FAMÍLIA (Custa 1 Roll)`)
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('manter_familia')
                        .setLabel('✅ MANTER ATUAL (Grátis)')
                        .setStyle(ButtonStyle.Success)
                );
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `🎲 FAMÍLIA • ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('⚠️ VOCÊ JÁ POSSUI UMA FAMÍLIA!')
                .setDescription(`Sua família atual é: **${jogador.rolls.familia}**\n\nVocê tem **${jogador.rolls.quantidade} roll(s)** guardados.`)
                .addFields(
                    { name: '❓ DESEJA TROCAR?', value: 'Ao trocar, **você gastará 1 roll** e perderá sua família atual permanentemente!', inline: false },
                    { name: '📊 PROBABILIDADES', value: '🟢 Comum: 80%\n🔵 Rara: 15%\n🟣 Lendária: 4%\n👑 Suprema: 1%', inline: false }
                )
                .setImage(gifRoll)
                .setFooter({ text: '⚽ Blue Lock • Escolha abaixo' });
            
            const msg = await message.reply({ embeds: [embed], components: [row] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });
            
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '❌ Você não pode escolher por ele!', ephemeral: true });
                }
                
                if (i.customId === 'manter_familia') {
                    await i.update({ content: '✅ Família mantida! Nenhum roll foi gasto.', embeds: [], components: [] });
                    collector.stop();
                    return;
                }
                
                if (i.customId === 'trocar_familia') {
                    // Verificação dupla para evitar exploits (caso gaste em outro lugar ao mesmo tempo)
                    if (jogador.rolls.quantidade <= 0) {
                        return i.reply({ content: '❌ Seus rolls acabaram antes de você confirmar!', ephemeral: true });
                    }
                    
                    await realizarSorteio(i, jogador, dados, message);
                    collector.stop();
                }
            });
            
            return;
        }
        
        // Se não tiver família ainda, faz o sorteio direto (gasta 1 roll)
        await realizarSorteio(message, jogador, dados, message);
    }
};

async function realizarSorteio(interaction, jogador, dados, message) {
    // DESCONTA O ROLL DO JOGADOR AQUI
    jogador.rolls.quantidade -= 1;

    const random = Math.random();
    let raridadeSorteada = "comum";
    let listaFamilias = [];
    let cor = "#808080";
    let raridadeNome = "";
    let chance = 0;
    let barraRaridade = "";
    
    if (random < 0.80) {
        raridadeSorteada = "comum";
        listaFamilias = familias.comuns;
        cor = "#00FF00";
        raridadeNome = "🟢 COMUM";
        chance = 80;
        barraRaridade = '🟢'.repeat(8) + '⬜'.repeat(2);
    } else if (random < 0.95) {
        raridadeSorteada = "rara";
        listaFamilias = familias.raras;
        cor = "#0099FF";
        raridadeNome = "🔵 RARA";
        chance = 15;
        barraRaridade = '🔵'.repeat(6) + '⬜'.repeat(4);
    } else if (random < 0.99) {
        raridadeSorteada = "lendaria";
        listaFamilias = familias.lendarias;
        cor = "#9B59B6";
        raridadeNome = "🟣 LENDÁRIA";
        chance = 4;
        barraRaridade = '🟣'.repeat(4) + '⬜'.repeat(6);
    } else {
        raridadeSorteada = "suprema";
        listaFamilias = familias.supremas;
        cor = "#FFD700";
        raridadeNome = "👑 SUPREMA";
        chance = 1;
        barraRaridade = '👑'.repeat(2) + '⬜'.repeat(8);
    }
    
    const familiaSorteada = listaFamilias[Math.floor(Math.random() * listaFamilias.length)];
    
    // Salva a nova família e a nova quantia de rolls no perfil
    jogador.rolls.familia = familiaSorteada.nome;
    jogador.rolls.familiaRaridade = raridadeSorteada;
    fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
    
    const embed = new EmbedBuilder()
        .setColor(cor)
        .setAuthor({ name: `🎲 SORTEIO DE FAMÍLIA • ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎴 FAMÍLIA DESCOBERTA!')
        .setDescription(`## ${familiaSorteada.emoji} ${familiaSorteada.nome} ${familiaSorteada.emoji}\n\n🎟️ **Rolls Restantes:** ${jogador.rolls.quantidade}`)
        .setImage(gifRoll)
        .addFields(
            { name: '🏷️ RARIDADE', value: `${raridadeNome}\n${barraRaridade}`, inline: false },
            { name: '✨ BÔNUS', value: `+${familiaSorteada.bonus} em todos os status`, inline: true },
            { name: '📊 PROBABILIDADE', value: `${chance}%`, inline: true },
            { name: '🎯 PRÓXIMO PASSO', value: 'Use `c!perfil` para ver sua nova família!', inline: false }
        )
        .setFooter({ text: `⚽ Blue Lock • Roll #${Math.floor(Math.random() * 10000)}` })
        .setTimestamp();
    
    // Atualiza a interação se for um botão, ou envia nova mensagem caso seja comando normal
    if (interaction.update) {
        await interaction.update({ embeds: [embed], components: [] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }
}