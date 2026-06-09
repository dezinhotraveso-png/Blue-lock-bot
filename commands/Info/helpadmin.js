const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'helpadmin',
    description: 'Mostra o menu de comandos administrativos',
    async execute(message, args, client, context) {
        
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#DC143C').setDescription('❌ Apenas **Administradores** podem acessar este menu.')] });
        }

        const pages = [
            // PÁGINA 1 - GESTÃO DE JOGADORES
            new EmbedBuilder()
                .setColor('#8B0000')
                .setAuthor({ name: `👑 PAINEL ADMIN • ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🎖️ GESTÃO DE JOGADORES')
                .setDescription(
                    `˚ ˳ ﹙👤﹚***__Comandos de Perfil__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__c!setperfil @user <campo> <valor>__**\n` +
                    `> │ Define atributos do perfil\n` +
                    `> │ Campos: estilo, talento, monstro, dominancia, arma, posicao, dons, fisico, rolls\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!setestatistica @user <stat> <valor>__**\n` +
                    `> │ Define estatísticas de jogo\n` +
                    `> │ Stats: gols, assistencias, dribles, desarmes, interceptacoes, defesas, partidas, vitorias, pdr\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎫 ⦘**  **__c!addrolls @user <tipo> <qtd>__**\n` +
                    `> │ Adiciona rolls para o jogador\n` +
                    `> │ Tipos: arma, estilo, dom, monstro, dominancia\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔄 ⦘**  **__c!resetar @user__**\n` +
                    `> │ Reseta status/pontos/rolls de um jogador\n` +
                    `> │ c!resetar @user status | pontos | rolls | tudo\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '👑 Página 1/3 • Use os botões para navegar' }),

            // PÁGINA 2 - PARTIDAS E SISTEMA
            new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `👑 PAINEL ADMIN • ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                .setTitle('⚽ GESTÃO DE PARTIDAS')
                .setDescription(
                    `˚ ˳ ﹙⚽﹚***__Comandos de Partida__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__c!partida <casa> <fora>__**\n` +
                    `> │ Cria uma nova partida\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛑 ⦘**  **__c!finalizar__**\n` +
                    `> │ Encerra a partida atual\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!statusjogo__**\n` +
                    `> │ Mostra o status completo da partida\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__c!bolaparada penalti <casa/fora>__**\n` +
                    `> │ Marca um pênalti\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📐 ⦘**  **__c!bolaparada escanteio <casa/fora>__**\n` +
                    `> │ Marca um escanteio\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙🔧﹚***__Sistema__***\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 💀 ⦘**  **__c!resetar resetall__** *(apenas dono)*\n` +
                    `> │ Reseta TODOS os jogadores\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧪 ⦘**  **__c!testar ativar / desativar__**\n` +
                    `> │ Ativa/desativa modo de teste\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '👑 Página 2/3 • Use os botões para navegar' }),

            // PÁGINA 3 - EXEMPLOS E DICAS
            new EmbedBuilder()
                .setColor('#00BFFF')
                .setAuthor({ name: `👑 PAINEL ADMIN • ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                .setTitle('💡 EXEMPLOS E DICAS')
                .setDescription(
                    `˚ ˳ ﹙📋﹚***__Exemplos de Uso__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Setar perfil__**\n` +
                    `> │ \`c!setperfil @user estilo Artilheiro\`\n` +
                    `> │ \`c!setperfil @user talento Genio\`\n` +
                    `> │ \`c!setperfil @user arma Kaiser Impact\`\n` +
                    `> │ \`c!setperfil @user posicao Atacante\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Setar estatísticas__**\n` +
                    `> │ \`c!setestatistica @user gols 10\`\n` +
                    `> │ \`c!setestatistica @user pdr 500\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎫 ⦘**  **__Adicionar rolls__**\n` +
                    `> │ \`c!addrolls @user arma 3\`\n` +
                    `> │ \`c!addrolls @user estilo 1\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔄 ⦘**  **__Resetar__**\n` +
                    `> │ \`c!resetar @user tudo\`\n` +
                    `> │ \`c!resetar @user pontos\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Organize partidas, gerencie jogadores e mantenha o servidor ativo!***__\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '👑 Página 3/3 • Use os botões para navegar' })
        ];

        let paginaAtual = 0;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('primeiro').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('anterior').setEmoji('◀️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('fechar').setLabel('Fechar').setEmoji('❌').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('proximo').setEmoji('▶️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ultimo').setEmoji('⏭️').setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.reply({ embeds: [pages[paginaAtual]], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async i => {
            if (i.customId === 'fechar') {
                collector.stop();
                return i.update({ content: '👑 Painel administrativo fechado.', embeds: [], components: [] });
            }

            switch (i.customId) {
                case 'primeiro': paginaAtual = 0; break;
                case 'anterior': paginaAtual = (paginaAtual - 1 + pages.length) % pages.length; break;
                case 'proximo': paginaAtual = (paginaAtual + 1) % pages.length; break;
                case 'ultimo': paginaAtual = pages.length - 1; break;
            }

            await i.update({ embeds: [pages[paginaAtual]] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};