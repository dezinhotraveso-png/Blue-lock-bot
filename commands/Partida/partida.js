const { EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/permissions.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'partida',
    description: 'Inicia uma nova partida',
    async execute(message, args, client, context) {
        // 🔒 VERIFICA PERMISSÃO AUTOMATICAMENTE
        if (!isAdmin(message.member)) {
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setAuthor({ name: `⛔ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('❌ ACESSO NEGADO')
                .setDescription('Apenas **Administradores** podem iniciar partidas.')
                .setFooter({ text: '⚽ Blue Lock' });
            return message.reply({ embeds: [embed] });
        }

        let dados = {};
        if (fs.existsSync(blueLockPath)) {
            dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        }
        if (!dados.partidas) dados.partidas = {};

        const timeCasa = args[0];
        const timeFora = args[1];

        if (!timeCasa || !timeFora) {
            return message.reply('❌ Use: `c!partida <timeCasa> <timeFora>`\nEx: `c!partida "Time Azul" "Time Branco"`');
        }

        const partidaId = `partida_${message.channel.id}`;
        
        dados.partidas[partidaId] = {
            timeCasa,
            timeFora,
            golsCasa: 0,
            golsFora: 0,
            posse: null,
            posseNome: null,
            minuto: 0,
            tempo: "1º Tempo",
            ativa: true,
            canal: message.channel.id,
            jogadores: {},
            estatisticas: {},
            ultimoPasse: null,
            aguardandoDominio: false,
            bolaSetor: "C13",
            aguardandoChute: false,
            chutePendente: null,
            aguardandoPontapeAposGol: false,
            ultimoGol: null,
            prioridades: {},
            faltas: {},
            times: {
                [timeCasa]: { jogadores: [], gols: 0 },
                [timeFora]: { jogadores: [], gols: 0 }
            },
            placar: { casa: 0, fora: 0 }
        };

        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`🏆 ${timeCasa} vs ${timeFora}`)
            .setDescription('✅ Partida criada com sucesso!')
            .addFields(
                { name: '📋 INSTRUÇÕES', value: 
                    '1️⃣ Jogadores usem `c!entrar casa` ou `c!entrar fora`\n' +
                    '2️⃣ Após todos entrarem, use `c!pontape` para iniciar!\n' +
                    '3️⃣ Use `c!movimentar` para se mover no campo\n' +
                    '4️⃣ Use `c!passe` para passar a bola\n' +
                    '5️⃣ Use `c!chute` para finalizar', inline: false
                },
                { name: '🏆 PLACAR', value: `## ${timeCasa}: 0 x 0 ${timeFora}`, inline: false },
                { name: '⏱️ MINUTO', value: '0\'', inline: true },
                { name: '📊 STATUS', value: '🟢 Aguardando jogadores', inline: true }
            )
            .setFooter({ text: '⚽ Blue Lock' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};