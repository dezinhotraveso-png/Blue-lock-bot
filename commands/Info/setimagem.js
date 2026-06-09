const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

function criarMolde(icone, titulo, descricao, informativos, resultado, cor = '#00BFFF') {
    let texto = `˚ ˳ ﹙${icone}﹚***__${titulo}__***\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
    texto += `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${descricao}*\n\n`;
    
    if (informativos && informativos.length > 0) {
        texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        texto += `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n`;
        
        informativos.forEach(info => {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${info.emoji} ⦘**  **__${info.label}__** —  ${info.valor}\n`;
        });
    }
    
    texto += `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***${resultado}***__\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
    
    return texto;
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

module.exports = {
    name: 'setimagem',
    description: 'Define uma imagem de perfil personalizada para seu jogador',
    async execute(message, args, client, context) {
        const { getJogador, loadBlueLock, saveBlueLock } = context;
        
        const dados = loadBlueLock();
        const jogador = getJogador(message.author.id, dados);
        
        const url = args[0];
        
        // Se não tiver URL, mostra ajuda
        if (!url) {
            const informativos = [
                { emoji: "📖", label: "Como usar", valor: "`c!setimagem <url_da_imagem>`" },
                { emoji: "🖼️", label: "Exemplo", valor: "`c!setimagem https://exemplo.com/imagem.png`" },
                { emoji: "❌", label: "Remover imagem", valor: "`c!setimagem remover`" }
            ];
            
            const resultado = "Use uma URL direta de imagem (png, jpg, jpeg, gif, webp)";
            const texto = criarMolde("🖼️", "DEFINIR IMAGEM DE PERFIL", `${message.author.username}, escolha uma imagem para seu perfil!`, informativos, resultado, "#00BFFF");
            
            const embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setAuthor({ name: `🖼️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`🖼️ DEFINIR IMAGEM DE PERFIL`)
                .setDescription(texto)
                .setImage(perfil_padrao)
                .setFooter({ text: '⚽ Blue Lock • Use uma URL direta da imagem', iconURL: message.guild.iconURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Opção para remover a imagem
        if (url.toLowerCase() === 'remover') {
            jogador.imagem = null;
            saveBlueLock(dados);
            
            const informativos = [
                { emoji: "🖼️", label: "Imagem removida", valor: "Voltou para a imagem padrão" }
            ];
            
            const resultado = "Sua imagem de perfil foi removida com sucesso!";
            const texto = criarMolde("✅", "IMAGEM REMOVIDA", `${message.author.username}, sua imagem foi resetada para o padrão.`, informativos, resultado, "#00FF00");
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`✅ IMAGEM REMOVIDA`)
                .setDescription(texto)
                .setImage(perfil_padrao)
                .setFooter({ text: '⚽ Blue Lock • Agora você tem a imagem padrão', iconURL: message.guild.iconURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Verifica se é uma URL válida
        if (!isValidUrl(url)) {
            const informativos = [
                { emoji: "❌", label: "Erro", valor: "URL inválida" }
            ];
            
            const resultado = "Por favor, forneça uma URL válida começando com http:// ou https://";
            const texto = criarMolde("❌", "URL INVÁLIDA", `${message.author.username}, a URL fornecida não é válida!`, informativos, resultado, "#E74C3C");
            
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setAuthor({ name: `❌ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`❌ URL INVÁLIDA`)
                .setDescription(texto)
                .setFooter({ text: '⚽ Blue Lock • Use uma URL válida', iconURL: message.guild.iconURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Verifica se é uma imagem (extensões comuns)
        const extensoesImagem = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
        const isImagem = extensoesImagem.some(ext => url.toLowerCase().includes(ext));
        
        if (!isImagem) {
            const informativos = [
                { emoji: "⚠️", label: "Aviso", valor: "Pode não ser uma imagem válida" }
            ];
            
            const resultado = "A URL não parece ser de uma imagem. Certifique-se de usar .png, .jpg, .jpeg, .gif ou .webp";
            const texto = criarMolde("⚠️", "FORMATO NÃO RECOMENDADO", `${message.author.username}, verifique se é uma imagem válida!`, informativos, resultado, "#FFA500");
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setAuthor({ name: `⚠️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`⚠️ FORMATO NÃO RECOMENDADO`)
                .setDescription(texto)
                .setFooter({ text: '⚽ Blue Lock • A imagem pode não funcionar corretamente', iconURL: message.guild.iconURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Salva a imagem
        jogador.imagem = url;
        saveBlueLock(dados);
        
        const informativos = [
            { emoji: "🖼️", label: "Nova imagem", valor: "Definida com sucesso!" },
            { emoji: "🔗", label: "URL", valor: `[Clique aqui](${url})` }
        ];
        
        const resultado = "Sua imagem de perfil foi atualizada! Ela aparecerá no seu perfil, status e estatísticas.";
        const texto = criarMolde("✅", "IMAGEM DEFINIDA", `${message.author.username}, sua imagem de perfil foi atualizada!`, informativos, resultado, "#00FF00");
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`✅ IMAGEM DEFINIDA COM SUCESSO!`)
            .setDescription(texto)
            .setImage(url)
            .setFooter({ text: '⚽ Blue Lock • Sua imagem foi salva!', iconURL: message.guild.iconURL() })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};