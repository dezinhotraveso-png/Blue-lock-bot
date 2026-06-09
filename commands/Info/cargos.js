const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'cargos',
    description: '📋 Mostra TODOS os seus cargos e quais definem o perfil',
    async execute(message, args, client, context) {
        const membro = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!membro) return message.reply('❌ Erro ao buscar seus cargos!');
        
        const todosCargos = membro.roles.cache.map(r => r.name);
        console.log(`🔍 Cargos de ${message.author.username}: ${todosCargos.join(', ')}`);
        
        // ==========================================
        // CATEGORIAS ORDENADAS (maior nome primeiro)
        // ==========================================
        const categorias = {
            "👑 Dominância": ["Ambidestria Forçada", "Ambidestro", "Destro", "Canhoto"],
            "⭐ Dom (Talento)": ["Aprendiz Talentoso", "Prodígio", "Gênio"],
            "🎭 Estilo de Jogo": ["Individualista", "Artilheiro", "Velocista", "Garçom", "Marcador", "Muralha", "Biológico", "Zumbi", "Maestro", "Imperador", "Demônio", "Áureo", "Rei", "Servo", "Driblador", "Urso"],
            "⚽ Posição": ["Segundo Atacante", "Meia Defensivo", "Meio Ofensivo", "Centro Avante", "Goleiro", "Lateral", "Zagueiro", "Volante", "Pontas"],
            "👹 Monstro": ["Monstro Despertado", "Monstro Adormecido"],
            "🌍 Nacionalidade": ["Brasileiro", "Alemão", "Italiano", "Argentino", "Espanhol", "Francês", "Japonês"],
            "🏫 Universidade": ["Kurogane", "Seiryu", "Raiden", "Genshō", "Tenshō", "Arashi", "Shiden", "Ryuketsu", "Hakuryu"],
            "🏆 Rank": ["New Gen", "Mundial", "Anônimo", "Municipal", "Estadual", "Regional", "Nacional", "Continental"],
            "👨‍👩‍👧 Família": ["Iglesias", "Lorenzo", "Kunigami", "Tokimitsu", "Yukimiya", "Chevalier", "Gagamaru", "Kurona", "Chigiri", "Mikage", "Shidou", "Bachira", "Itoshi", "Otoya", "Hiori", "Darai", "Onazi", "Kaiser", "Isagi", "Barou", "Naruhaya", "Fukaku", "Igaguri", "Ness", "Karasu", "Kiyora", "Aiku", "Nagi", "Hugo", "Loki", "Ikki", "Agi", "Aryu"],
            "📜 Maestria": ["Interceptação", "Finalização", "Velocidade", "Desarme", "Domínio", "Força", "Passe", "Defesa", "Drible"],
            "⚔️ Arma": [
                "Ambidestria Divina", "Cabeçada Demoníaca", "Interceptação Surpresa", "Movimentação Off Ball",
                "Ferroada Do Escorpiao", "Torre De Observação", "Drible Supersônico", "Absolute Physics",
                "Kaiser Impact Magnus", "Destroyer Shot", "Zombie Dribbling", "Golden Intercept",
                "Sequence Dribble", "Africa Intercept", "Agressive Desarm", "Desarme Sorrateiro",
                "Dominio Orientado", "Drible Marionete", "Passe Perfeito", "Perfect Trap",
                "Planet Hotline", "Second Defense", "Chute Imaginário", "Chute Perfurador",
                "Drible Robotico", "Elastico Nutmeg", "Enfiada Gostosa", "Glam Intercept",
                "Genius Dribble", "Monster Dribble", "Second Chance", "Snake Intercept",
                "Supreme Domain", "Trivela Pass", "Two Gun Volley", "Balanço Inerte",
                "Chute Azarão", "Couraça Viva", "Defesa Do Urso", "Dragon Drive",
                "Fake Volley", "Kaiser Impact", "Observação", "Ponte Aérea",
                "Premeditado", "Shark Bite", "Trivela Kick", "Advanced 1v1",
                "Africa Crush", "Canhotinha", "Chaos Player", "Chute Direto",
                "Cold Pass", "Crow Analysis", "Curve Max", "Dribble Killer",
                "Fake Pass", "Godspeed", "Lion Shot", "My Name Is",
                "Papa Gol", "Paredinha", "Power Shot", "Red Devil",
                "Rupture", "Shark Speed", "Twister Pass", "Very Slow",
                "Yo Michael", "Anxiety", "Arco Fatal", "Bee Shot",
                "Big Bang", "Camaleão", "Freestyle", "Goldezone",
                "Kaiser Bike", "Left Shot", "Lucky Shot", "Pedalada",
                "Roleta", "Simulação", "Zone 44", "Ás", "Ginga"
            ]
        };
        
        let cargosPerfil = [];
        
        for (const [cargoId, cargoObj] of membro.roles.cache) {
            const nomeCargo = cargoObj.name;
            if (nomeCargo === '@everyone') continue;
            
            let encontrado = false;
            
            for (const [categoria, lista] of Object.entries(categorias)) {
                const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
                
                for (const nome of listaOrdenada) {
                    if (nomeCargo.toLowerCase().includes(nome.toLowerCase())) {
                        cargosPerfil.push({ nome: nomeCargo, nomeLimpo: nome, categoria });
                        encontrado = true;
                        break;
                    }
                }
                if (encontrado) break;
            }
        }
        
        console.log(`📋 Cargos de perfil encontrados: ${cargosPerfil.map(c => `${c.nomeLimpo} (${c.categoria})`).join(', ')}`);
        
        let texto = 
            `˚ ˳ ﹙📋﹚***__SEUS CARGOS__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${message.author.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Cargos de Perfil__** —  \`${cargosPerfil.length} encontrados\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        
        if (cargosPerfil.length === 0) {
            texto += 
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ❌ ⦘**  **__Nenhum cargo de perfil encontrado!__**\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Peça a um admin para te dar cargos!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        } else {
            texto += `> ˚ ˳ ﹙✅﹚***__Cargos que definem seu perfil__***\n\n`;
            
            let categoriaAtual = '';
            for (const cargo of cargosPerfil) {
                if (cargo.categoria !== categoriaAtual) {
                    categoriaAtual = cargo.categoria;
                    const emoji = categoriaAtual.split(' ')[0];
                    texto += `\n> ˳ ${emoji} ***__${categoriaAtual}__***\n`;
                }
                texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__${cargo.nomeLimpo}__**\n`;
            }
            
            texto += `\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!perfil para ver seu perfil completo!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: `📋 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('📋 SEUS CARGOS DE PERFIL')
            .setDescription(texto)
            .setFooter({ text: '⚽ Blue Lock • Cargos definem seu perfil automaticamente!' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};