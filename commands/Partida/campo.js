const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const setoresCampo = {
    "Goleiro": "🧤 Área de Goleiro",
    "Defesa": "🛡️ Linha Defensiva",
    "Meio-Campo": "⚡ Meio de Campo",
    "Ataque": "⚽ Ataque"
};

function mostrarPosicoesCampo(partida, bolaSetor = null, posseNome = null) {
    if (!partida.jogadores || Object.keys(partida.jogadores).length === 0) {
        return "📍 *Nenhum jogador no campo*";
    }
    
    const setores = {
        "🧤 Goleiro": [],
        "🛡️ Defesa": [],
        "⚡ Meio-Campo": [],
        "⚽ Ataque": []
    };
    
    for (const [id, jogador] of Object.entries(partida.jogadores)) {
        const setor = jogador.setor || "Meio-Campo";
        const nomeJogador = jogador.nome || "Jogador";
        const marcador = partida.posse === id ? " 🎯" : "";
        
        if (setor === "Goleiro") setores["🧤 Goleiro"].push(`${nomeJogador}${marcador}`);
        else if (setor === "Defesa") setores["🛡️ Defesa"].push(`${nomeJogador}${marcador}`);
        else if (setor === "Ataque") setores["⚽ Ataque"].push(`${nomeJogador}${marcador}`);
        else setores["⚡ Meio-Campo"].push(`${nomeJogador}${marcador}`);
    }
    
    let texto = `📍 **POSIÇÕES NO CAMPO**\n\`\`\`\n`;
    for (const [setor, jogadores] of Object.entries(setores)) {
        if (jogadores.length > 0) {
            texto += `${setor}: ${jogadores.join(", ")}\n`;
        } else {
            texto += `${setor}: (vazio)\n`;
        }
    }
    
    if (bolaSetor) {
        texto += `\n🎯 Bola está em: ${bolaSetor}\n`;
    }
    if (posseNome) {
        texto += `⚽ Posse: ${posseNome}\n`;
    }
    texto += `\`\`\``;
    
    return texto;
}

function mostrarPlacar(partida) {
    return `📊 **PLACAR**\n🏠 ${partida.timeCasa || 'Casa'}: ${partida.golsCasa || 0} | 🚀 ${partida.timeFora || 'Fora'}: ${partida.golsFora || 0}`;
}

module.exports = {
    name: 'campo',
    description: '📊 Mostra o estado atual do campo',
    aliases: ['estado', 'partida', 'status'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            return message.reply('❌ Não há partida ativa neste canal!');
        }

        const minuto = Math.floor(partida.minuto || 0);
        const tempo = partida.tempo || "1º Tempo";
        
        let posseNome = "Ninguém";
        if (partida.posse && partida.jogadores[partida.posse]) {
            posseNome = partida.jogadores[partida.posse].nome || "Jogador";
        }
        
        const bolaSetor = partida.bolaSetor || "Meio-Campo";
        const posicoesTexto = mostrarPosicoesCampo(partida, bolaSetor, posseNome);
        const placarTexto = mostrarPlacar(partida);
        
        const embed = new EmbedBuilder()
            .setColor('#2E86C1')
            .setTitle(`⚽ CAMPO - ${minuto}' ${tempo}`)
            .setDescription(`${placarTexto}\n\n${posicoesTexto}`)
            .setFooter({ text: `👥 ${Object.keys(partida.jogadores || {}).length} jogadores em campo` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};