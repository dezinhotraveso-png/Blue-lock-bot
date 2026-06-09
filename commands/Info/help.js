const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Mostra o menu de ajuda do Blue Lock RPG',
    async execute(message, args, client, context) {
        
        const pages = [
            // PÁGINA 1 - VISÃO GERAL
            new EmbedBuilder()
                .setColor('#00BFFF')
                .setAuthor({ name: `⚽ BLUE LOCK RPG • ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🎮 BEM-VINDO AO BLUE LOCK!')
                .setDescription(
                    `˚ ˳ ﹙⚽﹚***__Sistema de Futebol Estratégico__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__Dados__** —  \`D20 para ações | D40 para chutes\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Status__** —  \`Treine para aumentar seus atributos!\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`Habilidades especiais com bônus\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__Como Jogar__**\n` +
                    `> │ 1. Use \`c!entrar casa/fora\` para entrar na partida\n` +
                    `> │ 2. Use \`c!movimentar <setor>\` para se mover\n` +
                    `> │ 3. Use \`c!passe\`, \`c!chute\` ou \`c!driblar\` para agir\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setImage('https://media1.tenor.com/m/OxN7wX8kZoEAAAAC/blue-lock-anime.gif')
                .setFooter({ text: '📖 Página 1/7 • Use os botões para navegar' }),

            // PÁGINA 2 - PERFIL E STATUS
            new EmbedBuilder()
                .setColor('#9B59B6')
                .setAuthor({ name: `👤 PERFIL E STATUS`, iconURL: client.user.displayAvatarURL() })
                .setTitle('📊 SEU JOGADOR')
                .setDescription(
                    `˚ ˳ ﹙👤﹚***__Comandos de Perfil__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📜 ⦘**  **__c!perfil__** —  \`Mostra seu perfil completo (cargos + rolls)\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!status__** —  \`Mostra atributos com bônus\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__c!overall__** —  \`Mostra seu overall FIFA\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__c!estatisticas__** —  \`Gols, assistências, PDR e ranking\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__c!armas__** —  \`Mostra suas armas equipadas\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📋 ⦘**  **__c!cargos__** —  \`Mostra o que cada cargo te dá\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🖼️ ⦘**  **__c!setimagem__** —  \`Define imagem do perfil\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙📊﹚***__Status Disponíveis__***\n` +
                    `> 🦵 Finalização • ✨ Drible • ☄️ Passe\n` +
                    `> 🛡️ Desarme • ⚡ Velocidade • 💪 Físico\n` +
                    `> 🎯 Interceptação • 🧱 Defesa GK • ⚽ Domínio\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 2/7 • Use os botões para navegar' }),

            // PÁGINA 3 - ROLAGENS
            new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `🎲 ROLAGENS E SORTEIOS`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🎲 SISTEMA DE ROLLS')
                .setDescription(
                    `˚ ˳ ﹙🎲﹚***__Comandos de Roll__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎲 ⦘**  **__c!roll__** —  \`Menu de rolls disponíveis\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__c!roll arma__** —  \`Revela sua arma\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__c!roll estilo__** —  \`Revela seu estilo de jogo\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__c!roll dom__** —  \`Revela seu dom/talento\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__c!roll monstro__** —  \`Revela se tem monstro\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__c!roll dominancia__** —  \`Revela sua dominância\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 👨‍👩‍👧 ⦘**  **__c!roll familia__** —  \`Revela sua família\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Rolls revelam o que seus cargos já te dão!***__\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 3/7 • Use os botões para navegar' }),

            // PÁGINA 4 - TREINO E EVOLUÇÃO
            new EmbedBuilder()
                .setColor('#00FF00')
                .setAuthor({ name: `🏋️ TREINO E EVOLUÇÃO`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🏋️ SISTEMA DE TREINO')
                .setDescription(
                    `˚ ˳ ﹙🏋️﹚***__Comandos de Treino__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏋️ ⦘**  **__c!treinar__** —  \`Faz o treino diário (3-7 pontos)\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!treinar pontos__** —  \`Vê quantos pontos tem\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__c!treinar distribuir__** —  \`Lista atributos\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__c!treinar distribuir <attr> <qtd>__** —  \`Distribui pontos\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Exemplo__** —  \`c!treinar distribuir finalizacao 5\`\n\n` +
                    `> ˚ ˳ ﹙⏰﹚***__Regras__***\n` +
                    `> │ • Treino disponível a cada 24 horas\n` +
                    `> │ • Ganha de 3 a 7 pontos por treino\n` +
                    `> │ • Distribua nos atributos que preferir\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 4/7 • Use os botões para navegar' }),

            // PÁGINA 5 - PARTIDA
            new EmbedBuilder()
                .setColor('#FF4500')
                .setAuthor({ name: `⚔️ COMANDOS DE PARTIDA`, iconURL: client.user.displayAvatarURL() })
                .setTitle('⚔️ DENTRO DO CAMPO')
                .setDescription(
                    `˚ ˳ ﹙⚽﹚***__Ações Ofensivas__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__c!chute__** —  \`Finaliza ao gol\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__c!passe @user__** —  \`Passa a bola\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__c!cruzamento @user__** —  \`Cruza para área\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__c!driblar @user__** —  \`Tenta drible\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__c!dominar__** —  \`Domina a bola\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙🛡️﹚***__Ações Defensivas__***\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧤 ⦘**  **__c!defender__** —  \`Goleiro defende\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__c!desarmar @user__** —  \`Rouba a bola\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔒 ⦘**  **__c!marcar @user__** —  \`Marca adversário\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__c!interceptar__** —  \`Intercepta passe\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 5/7 • Use os botões para navegar' }),

            // PÁGINA 6 - PARTIDAS E MOVIMENTAÇÃO
            new EmbedBuilder()
                .setColor('#4169E1')
                .setAuthor({ name: `🏟️ PARTIDAS E MOVIMENTAÇÃO`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🏟️ GERENCIANDO PARTIDAS')
                .setDescription(
                    `˚ ˳ ﹙🏟️﹚***__Comandos de Partida__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏟️ ⦘**  **__c!campo__** —  \`Mostra o campo e posições\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏃 ⦘**  **__c!movimentar <setor>__** —  \`Move seu jogador\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__c!velocidade @user__** —  \`Disputa de velocidade\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__c!1v1 @user__** —  \`Duelo 1v1\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__c!placar__** —  \`Mostra o placar\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__c!pontape__** —  \`Inicia/recomeça partida\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📋 ⦘**  **__c!statusjogo__** —  \`Status da partida\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙🎭﹚***__Bola Parada__***\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__c!bolaparada cavar @user__** —  \`Cavar falta\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🥅 ⦘**  **__c!bolaparada cobrar__** —  \`Cobrar falta/pênalti\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 6/7 • Use os botões para navegar' }),

            // PÁGINA 7 - EXTRAS
            new EmbedBuilder()
                .setColor('#FF69B4')
                .setAuthor({ name: `🧪 EXTRAS E TESTES`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🧪 MODO TESTE E RANKING')
                .setDescription(
                    `˚ ˳ ﹙🧪﹚***__Modo Teste__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__c!testar ativar__** —  \`Ativa modo de teste\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__c!testar chute__** —  \`Testa finalizações\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧤 ⦘**  **__c!testar defesa__** —  \`Testa defesas\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__c!testar drible__** —  \`Testa dribles\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__c!testar passe__** —  \`Testa passes\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚙️ ⦘**  **__c!testar config__** —  \`Configura atributos\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__c!testar hab add <nome>__** —  \`Adiciona habilidade\`\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛑 ⦘**  **__c!testar desativar__** —  \`Desativa modo teste\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `> ˚ ˳ ﹙🏆﹚***__Ranking__***\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__c!ranking__** —  \`Ranking de jogadores\`\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '📖 Página 7/7 • Use os botões para navegar' })
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
                return i.update({ content: '📖 Menu de ajuda fechado.', embeds: [], components: [] });
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