const { EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/permissions.js');

module.exports = {
    name: 'setestatistica',
    description: 'Define estatísticas de um jogador',
    async execute(message, args, client, context) {
        const { loadBlueLock, saveBlueLock, getJogador } = context;
        
        // 🔒 VERIFICA PERMISSÃO AUTOMATICAMENTE
        if (!isAdmin(message.member)) {
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setAuthor({ name: `⛔ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('❌ ACESSO NEGADO')
                .setDescription('Você não tem permissão para usar este comando.\n\nApenas **Administradores** podem executar esta ação.')
                .setFooter({ text: '⚽ Blue Lock' });
            return message.reply({ embeds: [embed] });
        }
        
        const user = message.mentions.users.first();
        const stat = args[1]?.toLowerCase();
        const valor = parseInt(args[2]);
        
        const statsValidos = ['gols', 'assistencias', 'passes', 'dribles', 'desarmes', 'interceptacoes', 'defesas', 'partidas', 'vitorias'];
        
        if (!user || !stat || isNaN(valor)) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#FFD700')
                    .setAuthor({ name: `⚙️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTitle('📋 SETESTATISTICA - ADMIN')
                    .setDescription('Use: `c!setestatistica @user <estatistica> <valor>`\n\n**Estatísticas disponíveis:**\n' +
                        statsValidos.join(', '))
                ]
            });
        }
        
        if (!statsValidos.includes(stat)) {
            return message.reply(`❌ Estatística inválida! Opções: ${statsValidos.join(', ')}`);
        }
        
        const dados = loadBlueLock();
        const jogador = getJogador(user.id, dados);
        
        const nomes = {
            gols: '⚽ Gols',
            assistencias: '🎯 Assistências',
            passes: '✅ Passes',
            dribles: '✨ Dribles',
            desarmes: '🛡️ Desarmes',
            interceptacoes: '🎯 Interceptações',
            defesas: '🧤 Defesas',
            partidas: '🏆 Partidas',
            vitorias: '👑 Vitórias'
        };
        
        jogador.estatisticas[stat] = valor;
        
        saveBlueLock(dados);
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('📊 ESTATÍSTICA ATUALIZADA')
            .setDescription(`**${nomes[stat]}** definido para: **${valor}**`)
            .setFooter({ text: `👤 ${user.username}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};