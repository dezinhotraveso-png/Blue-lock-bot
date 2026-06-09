const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'setperfil',
    description: '👑 Admin: Seta os rolls/perfil de um jogador manualmente',
    async execute(message, args, client, context) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }
        
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Marque o jogador! Use: `c!setperfil @jogador <tipo> <valor>`');
        
        const tipo = args[1]?.toLowerCase();
        const valor = args.slice(2).join(' ');
        
        if (!tipo) {
            const texto = 
                `˚ ˳ ﹙📋﹚***__SETPERFIL - COMANDOS__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📖 ⦘**  **__Uso__** —  \`c!setperfil @jogador <tipo> <valor>\`\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Tipos__***\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__estilo__** —  Define o estilo de jogo\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__talento__** —  Define talento (genio/aprendiz/prodigio)\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__monstro__** —  Define monstro (sim/nao)\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__dominancia__** —  Define dominância\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__arma__** —  Equipa uma arma\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__posicao__** —  Define posição\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🕊️ ⦘**  **__dons__** —  Define dons\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 💪 ⦘**  **__fisico__** —  Define estilo físico\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎫 ⦘**  **__rolls__** —  Define quantidade de rolls disponíveis\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔄 ⦘**  **__reset__** —  Reseta todos os rolls\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Exemplos__** —\n` +
                `> │ \`c!setperfil @jogador estilo Artilheiro\`\n` +
                `> │ \`c!setperfil @jogador talento Genio\`\n` +
                `> │ \`c!setperfil @jogador monstro sim\`\n` +
                `> │ \`c!setperfil @jogador arma Kaiser Impact\`\n` +
                `> │ \`c!setperfil @jogador posicao Atacante\`\n` +
                `> │ \`c!setperfil @jogador rolls 5\`\n` +
                `> │ \`c!setperfil @jogador reset\`\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#FFD700').setTitle('📋 SETPERFIL').setDescription(texto)] });
        }
        
        // Cria jogador se não existir
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = {
                nome: target.username,
                status: { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 },
                rolls: {}
            };
        }
        
        const jogador = dados.jogadores[target.id];
        if (!jogador.rolls) jogador.rolls = {};
        
        let mensagem = '';
        
        switch (tipo) {
            case 'estilo':
                jogador.rolls.estilo = valor;
                mensagem = `✅ Estilo **${valor}** definido para ${target.username}!`;
                break;
                
            case 'talento':
                jogador.rolls.talento = valor;
                if (valor.toLowerCase() === 'prodigio' || valor === 'Prodígio') {
                    jogador.rolls.prodigio = (jogador.rolls.prodigio || 0) + 1;
                    mensagem = `✅ Talento **${valor}** definido! (+1 Prodígio: ${jogador.rolls.prodigio}x)`;
                } else {
                    mensagem = `✅ Talento **${valor}** definido para ${target.username}!`;
                }
                break;
                
            case 'monstro':
                jogador.rolls.monstro = valor.toLowerCase() === 'sim' ? 'Sim' : 'Não';
                mensagem = `✅ Monstro **${jogador.rolls.monstro}** definido para ${target.username}!`;
                break;
                
            case 'dominancia':
                jogador.rolls.dominancia = valor;
                mensagem = `✅ Dominância **${valor}** definida para ${target.username}!`;
                break;
                
            case 'arma':
                if (!valor) return message.reply('❌ Informe o nome da arma!');
                
                const todasHabilidades = listarTodasHabilidades();
                let armaEncontrada = null;
                
                for (const [key, hab] of Object.entries(todasHabilidades)) {
                    if (hab.nome.toLowerCase().includes(valor.toLowerCase())) {
                        armaEncontrada = hab;
                        break;
                    }
                }
                
                if (armaEncontrada) {
                    jogador.rolls.armas = armaEncontrada.nome;
                    if (!jogador.habilidades) jogador.habilidades = {};
                    jogador.habilidades[armaEncontrada.key] = { usosRestantes: 999 };
                    mensagem = `✅ Arma **${armaEncontrada.emoji} ${armaEncontrada.nome} (${armaEncontrada.estrelas})** equipada!`;
                } else {
                    jogador.rolls.armas = valor;
                    mensagem = `✅ Arma **${valor}** definida (não encontrada no sistema, salva como texto)!`;
                }
                break;
                
            case 'posicao':
                jogador.posicao = valor;
                mensagem = `✅ Posição **${valor}** definida para ${target.username}!`;
                break;
                
            case 'dons':
                jogador.rolls.dons = valor;
                mensagem = `✅ Dons **${valor}** definidos!`;
                break;
                
            case 'fisico':
                jogador.rolls['estilo-fisico'] = valor;
                mensagem = `✅ Estilo Físico **${valor}** definido!`;
                break;
                
            case 'rolls':
                const quantidade = parseInt(valor);
                if (isNaN(quantidade) || quantidade < 0) return message.reply('❌ Informe um número válido!');
                jogador.rollsDisponiveis = quantidade;
                mensagem = `✅ **${quantidade}** rolls disponíveis definidos para ${target.username}!`;
                break;
                
            case 'reset':
                jogador.rolls = {};
                jogador.rollsDisponiveis = 0;
                mensagem = `🔄 Todos os rolls de ${target.username} foram resetados!`;
                break;
                
            default:
                return message.reply(`❌ Tipo inválido! Use: estilo, talento, monstro, dominancia, arma, posicao, dons, fisico, rolls, reset`);
        }
        
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
        return message.reply(mensagem);
    }
};