const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot online! Logado como ${client.user.tag}`);
        
        // Pega o nome do servidor
        const guildName = client.guilds.cache.first()?.name || 'Kimetsu: MoonNight';
        
        // Lista de status para alternar
        const activities = [
            { name: `🌙 ${guildName}`, type: ActivityType.Watching },
            { name: `⚔️ ${guildName}`, type: ActivityType.Playing },
            { name: `🌸 ${guildName}`, type: ActivityType.Listening },
        ];
        
        let i = 0;
        setInterval(() => {
            client.user.setActivity(activities[i].name, {
                type: activities[i].type
            });
            i = (i + 1) % activities.length;
        }, 60000); // Muda a cada 60 segundos
        
        // Inicializa variáveis globais
        if (typeof global.missoesAtivas === 'undefined') global.missoesAtivas = new Map();
        if (typeof global.duelosAtivos === 'undefined') global.duelosAtivos = new Map();
    }
};