const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// STATUS PADRÃO
// ==========================================
const STATUS_PADRAO = {
    finalizacao: 0,
    drible: 0,
    passe: 0,
    desarme: 0,
    velocidade: 0,
    fisico: 0,
    interceptacao: 0,
    defesaGk: 0,
    dominio: 0
};

// ==========================================
// FUNÇÃO PARA CRIAR JOGADOR
// ==========================================
function criarJogador(id, nome) {
    return {
        id: id,
        nome: nome,
        posicao: "Meio Ofensivo",
        status: { ...STATUS_PADRAO },
        pontosBase: 0,
        estatisticas: {
            gols: 0, assistencias: 0, passes: 0, dribles: 0,
            desarmes: 0, interceptacoes: 0, defesas: 0, bloqueios: 0,
            partidas: 0, vitorias: 0
        },
        habilidades: {},
        imagem: null
    };
}

// ==========================================
// FUNÇÃO PARA VERIFICAR SE É ADMIN (PELO DISCORD)
// ==========================================
function isAdmin(member) {
    if (!member) return false;
    
    // Verifica se tem permissão de ADMINISTRADOR
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return true;
    }
    
    // Verifica se tem permissão de GERENCIAR SERVIDOR
    if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return true;
    }
    
    return false;
}

// ==========================================
// COMANDO PRINCIPAL
// ==========================================
module.exports = {
    name: 'setstatus',
    description: '👑 [ADMIN] Define os status base de um jogador',
    aliases: ['setstat', 'adminstatus', 'setarstatus'],
    async execute(message, args) {
        // Verifica se é admin (pelo Discord)
        if (!isAdmin(message.member)) {
            return message.reply('❌ **Acesso Negado:** Apenas administradores do servidor podem usar este comando!');
        }

        const subComando = args[0]?.toLowerCase();

        // ==========================================
        // HELP
        // ==========================================
        if (!subComando || subComando === 'help') {
            const texto = 
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝👑﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *Comandos de Administração para Status*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Setar Status__** —  \`c!setstatus set @user <stat> <valor>\`\n` +
                `> │ Ex: \`c!setstatus set @user finalizacao 10\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Ver Status__** —  \`c!setstatus ver @user\`\n` +
                `> │ Mostra os status atuais do jogador\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ➕ ⦘**  **__Adicionar Pontos__** —  \`c!setstatus add @user <stat> <valor>\`\n` +
                `> │ Adiciona pontos a um atributo específico\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ➖ ⦘**  **__Remover Pontos__** —  \`c!setstatus remove @user <stat> <valor>\`\n` +
                `> │ Remove pontos de um atributo\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔄 ⦘**  **__Resetar__** —  \`c!setstatus reset @user\`\n` +
                `> │ Reseta todos os status para 0\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Dar Pontos Base__** —  \`c!setstatus dar @user <quantidade>\`\n` +
                `> │ Adiciona pontos base para o jogador distribuir\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Atributos Disponíveis__** —  \`finalizacao, drible, passe, desarme, velocidade, fisico, interceptacao, defesa, dominio\`\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setAuthor({ name: `👑 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('📋 COMANDOS DE ADMIN - STATUS')
                .setDescription(texto)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // DAR PONTOS BASE
        // ==========================================
        if (subComando === 'dar') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus dar @user 10`');
            }

            const pontos = parseInt(args[2]);
            if (isNaN(pontos) || pontos <= 0) {
                return message.reply('❌ Informe uma quantidade válida de pontos! Ex: `c!setstatus dar @user 10`');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                dados.jogadores[alvo.id] = criarJogador(alvo.id, alvo.username);
            }

            dados.jogadores[alvo.id].pontosBase = (dados.jogadores[alvo.id].pontosBase || 0) + pontos;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`✅ **${pontos} ponto(s) base** adicionado(s) para ${alvo.username}!\n📊 Total de pontos base: \`${dados.jogadores[alvo.id].pontosBase}\``)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // SETAR STATUS (substitui o valor)
        // ==========================================
        if (subComando === 'set') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus set @user finalizacao 10`');
            }

            const stat = args[2]?.toLowerCase();
            const valor = parseInt(args[3]);

            const statsValidos = ['finalizacao', 'drible', 'passe', 'desarme', 'velocidade', 'fisico', 'interceptacao', 'defesa', 'dominio'];

            if (!stat || !statsValidos.includes(stat)) {
                return message.reply(`❌ Atributo inválido! Use: finalizacao, drible, passe, desarme, velocidade, fisico, interceptacao, defesa, dominio`);
            }

            if (isNaN(valor) || valor < 0) {
                return message.reply('❌ Informe um valor válido (0-100)!');
            }

            if (valor > 100) {
                return message.reply('❌ Valor muito alto! Máximo permitido é 100.');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                dados.jogadores[alvo.id] = criarJogador(alvo.id, alvo.username);
            }

            const statKey = stat === 'defesa' ? 'defesaGk' : stat;
            dados.jogadores[alvo.id].status[statKey] = valor;

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`✅ **${stat.charAt(0).toUpperCase() + stat.slice(1)}** de ${alvo.username} foi alterado para \`+${valor}\`!`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // ADICIONAR PONTOS
        // ==========================================
        if (subComando === 'add') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus add @user finalizacao 5`');
            }

            const stat = args[2]?.toLowerCase();
            const valor = parseInt(args[3]);

            const statsValidos = ['finalizacao', 'drible', 'passe', 'desarme', 'velocidade', 'fisico', 'interceptacao', 'defesa', 'dominio'];

            if (!stat || !statsValidos.includes(stat)) {
                return message.reply(`❌ Atributo inválido! Use: finalizacao, drible, passe, desarme, velocidade, fisico, interceptacao, defesa, dominio`);
            }

            if (isNaN(valor) || valor <= 0) {
                return message.reply('❌ Informe um valor válido (positivo)!');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                dados.jogadores[alvo.id] = criarJogador(alvo.id, alvo.username);
            }

            const statKey = stat === 'defesa' ? 'defesaGk' : stat;
            const valorAtual = dados.jogadores[alvo.id].status[statKey] || 0;
            const novoValor = valorAtual + valor;

            if (novoValor > 100) {
                return message.reply(`❌ O valor ultrapassaria 100! Atual: ${valorAtual}, tentativa de adicionar: ${valor}`);
            }

            dados.jogadores[alvo.id].status[statKey] = novoValor;

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`✅ **+${valor}** adicionado em **${stat.charAt(0).toUpperCase() + stat.slice(1)}** de ${alvo.username}!\n📊 Novo valor: \`+${novoValor}\``)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // REMOVER PONTOS
        // ==========================================
        if (subComando === 'remove' || subComando === 'remover') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus remove @user finalizacao 5`');
            }

            const stat = args[2]?.toLowerCase();
            const valor = parseInt(args[3]);

            const statsValidos = ['finalizacao', 'drible', 'passe', 'desarme', 'velocidade', 'fisico', 'interceptacao', 'defesa', 'dominio'];

            if (!stat || !statsValidos.includes(stat)) {
                return message.reply(`❌ Atributo inválido! Use: finalizacao, drible, passe, desarme, velocidade, fisico, interceptacao, defesa, dominio`);
            }

            if (isNaN(valor) || valor <= 0) {
                return message.reply('❌ Informe um valor válido (positivo)!');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                return message.reply(`❌ ${alvo.username} não possui dados!`);
            }

            const statKey = stat === 'defesa' ? 'defesaGk' : stat;
            const valorAtual = dados.jogadores[alvo.id].status[statKey] || 0;
            const novoValor = Math.max(0, valorAtual - valor);

            dados.jogadores[alvo.id].status[statKey] = novoValor;

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setDescription(`⚠️ **-${valor}** removido de **${stat.charAt(0).toUpperCase() + stat.slice(1)}** de ${alvo.username}!\n📊 Novo valor: \`+${novoValor}\``)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // RESETAR TODOS OS STATUS
        // ==========================================
        if (subComando === 'reset') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus reset @user`');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                return message.reply(`❌ ${alvo.username} não possui dados!`);
            }

            dados.jogadores[alvo.id].status = { ...STATUS_PADRAO };
            dados.jogadores[alvo.id].pontosBase = 0;

            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#F39C12')
                .setDescription(`🔄 **Todos os status** de ${alvo.username} foram resetados para \`0\`!`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ==========================================
        // VER STATUS
        // ==========================================
        if (subComando === 'ver') {
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador! Ex: `c!setstatus ver @user`');
            }

            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.jogadores) dados.jogadores = {};

            if (!dados.jogadores[alvo.id]) {
                return message.reply(`❌ ${alvo.username} não possui dados! Use \`c!setstatus set\` primeiro.`);
            }

            const jogador = dados.jogadores[alvo.id];
            const status = jogador.status;
            const pontosBase = jogador.pontosBase || 0;

            const texto = 
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *Status de ${alvo.username}*\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Pontos Base__** —  \`${pontosBase}\`\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘**  **__Finalização__** —  \`+${status.finalizacao || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Drible__** —  \`+${status.drible || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__Passe__** —  \`+${status.passe || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Desarme__** —  \`+${status.desarme || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__Velocidade__** —  \`+${status.velocidade || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 💪 ⦘**  **__Físico__** —  \`+${status.fisico || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Interceptação__** —  \`+${status.interceptacao || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧱 ⦘**  **__Defesa GK__** —  \`+${status.defesaGk || 0}\`\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Domínio__** —  \`+${status.dominio || 0}\`\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setAuthor({ name: `👑 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`📊 STATUS DE ${alvo.username}`)
                .setDescription(texto)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Se chegou aqui, comando inválido
        return message.reply('❌ Comando inválido! Use `c!setstatus help` para ver os comandos disponíveis.');
    }
};