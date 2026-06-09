const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'armas',
    description: '⚔️ Mostra todas as armas equipadas do jogador',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        if (!dados.jogadores[target.id]) {
            return message.reply('❌ Jogador não encontrado!');
        }
        
        const jogador = dados.jogadores[target.id];
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        
        function encontrarTodosCargos(lista) {
            if (!membro) return [];
            const encontrados = [];
            const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
            for (const nome of listaOrdenada) {
                const cargoEncontrado = membro.roles.cache.find(r => 
                    r.name.toLowerCase().includes(nome.toLowerCase())
                );
                if (cargoEncontrado && !encontrados.includes(nome)) {
                    encontrados.push(nome);
                }
            }
            return encontrados;
        }
        
        const todasHabilidades = listarTodasHabilidades();
        const todosNomesArmas = Object.values(todasHabilidades).map(h => h.nome);
        const armasCargo = encontrarTodosCargos(todosNomesArmas);
        
        const armasInfo = [];
        for (const armaNome of armasCargo) {
            const habInfo = Object.values(todasHabilidades).find(h => h.nome === armaNome);
            if (habInfo) armasInfo.push(habInfo);
        }
        
        let texto = 
            `˚ ˳ ﹙⚔️﹚***__ARMAS DO JOGADOR__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${jogador.nome || target.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`${armasInfo.length} equipadas\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        
        if (armasInfo.length === 0) {
            texto += 
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ❌ ⦘**  **__Nenhuma arma equipada!__**\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Consiga cargos de armas para equipar!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        } else {
            for (const arma of armasInfo) {
                let cor = '#808080';
                if (arma.estrelas === "★★★★★") cor = '#FFD700';
                else if (arma.estrelas === "★★★★") cor = '#C0A050';
                else if (arma.estrelas === "★★★") cor = '#50C878';
                else if (arma.estrelas === "★★") cor = '#4169E1';
                
                texto += `> ˚ ˳ ﹙${arma.emoji}﹚***__${arma.nome}__*** —  \`${arma.estrelas}\`\n\n` +
                    `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Efeito__** —  \`${arma.efeito}\`\n`;
                
                if (arma.bonus) {
                    texto += `> ˚ ˳ ﹙📊﹚***__Bônus__***\n`;
                    if (arma.bonus.finalizacao) texto += `> │   🦵 Finalização +${arma.bonus.finalizacao}\n`;
                    if (arma.bonus.drible) texto += `> │   ✨ Drible +${arma.bonus.drible}\n`;
                    if (arma.bonus.passe) texto += `> │   ☄️ Passe +${arma.bonus.passe}\n`;
                    if (arma.bonus.desarme) texto += `> │   🛡️ Desarme +${arma.bonus.desarme}\n`;
                    if (arma.bonus.velocidade) texto += `> │   ⚡ Velocidade +${arma.bonus.velocidade}\n`;
                    if (arma.bonus.fisico) texto += `> │   💪 Físico +${arma.bonus.fisico}\n`;
                    if (arma.bonus.interceptacao) texto += `> │   🎯 Interceptação +${arma.bonus.interceptacao}\n`;
                    if (arma.bonus.defesaGk) texto += `> │   🧱 Defesa GK +${arma.bonus.defesaGk}\n`;
                    if (arma.bonus.dominio) texto += `> │   ⚽ Domínio +${arma.bonus.dominio}\n`;
                }
                texto += `\n`;
            }
            
            texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Quantos mais cargos de arma, mais forte você fica!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: `⚔️ ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('⚔️ ARMAS DO JOGADOR')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setFooter({ text: '⚽ Blue Lock • c!armas @jogador' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};