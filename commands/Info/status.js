const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// BÔNUS POR POSIÇÃO
// ==========================================
const bonusPosicao = {
    "Goleiro": { defesaGk: 4, interceptacao: 2 },
    "Lateral": { velocidade: 3, drible: 3, passe: 2 },
    "Zagueiro": { desarme: 4, fisico: 4, interceptacao: 2 },
    "Volante": { velocidade: 3, fisico: 3, desarme: 2 },
    "Meia Defensivo": { passe: 4, interceptacao: 4 },
    "Meio Ofensivo": { dominio: 4, passe: 4, drible: 2 },
    "Centro Avante": { finalizacao: 5, fisico: 4, dominio: 2 },
    "Segundo Atacante": { finalizacao: 4, dominio: 3, drible: 3, velocidade: 3 },
    "Pontas": { drible: 5, velocidade: 4, finalizacao: 2 }
};

const bonusUniversidade = {
    "Kurogane": { velocidade: 3, fisico: 3 },
    "Seiryu": { passe: 3, drible: 3 },
    "Raiden": { finalizacao: 3, interceptacao: 3 },
    "Genshō": { defesaGk: 3, fisico: 3 },
    "Tenshō": { finalizacao: 3, dominio: 3 },
    "Arashi": { drible: 3, desarme: 3 },
    "Shiden": { velocidade: 3, drible: 3 },
    "Ryuketsu": { finalizacao: 3, fisico: 3 },
    "Hakuryu": { passe: 3, defesaGk: 3 }
};

const bonusNacionalidade = {
    "Japonês": { dominio: 4, passe: 4 },
    "Francês": { drible: 5, velocidade: 4, finalizacao: 2 },
    "Espanhol": { finalizacao: 5, drible: 3, passe: 2 },
    "Argentino": { passe: 4, desarme: 3 },
    "Italiano": { finalizacao: 2, drible: 2, passe: 2, desarme: 2 },
    "Alemão": { finalizacao: 4, dominio: 3, desarme: 3, interceptacao: 2 },
    "Brasileiro": { drible: 5, velocidade: 4, finalizacao: 2 }
};

const bonusDominancia = {
    "Destro": { finalizacao: 2, velocidade: 2, drible: 2 },
    "Canhoto": { finalizacao: 3, passe: 3, dominio: 3 },
    "Ambidestria Forçada": { finalizacao: 4, velocidade: 4, fisico: 4, desarme: 4 },
    "Ambidestro": { finalizacao: 4, drible: 4, passe: 4, desarme: 4, velocidade: 4, fisico: 4, interceptacao: 4, defesaGk: 4, dominio: 4 }
};

const bonusMaestria = {
    "Interceptação": { interceptacao: 4 },
    "Desarme": { desarme: 4 },
    "Passe": { passe: 4 },
    "Defesa": { defesaGk: 4 },
    "Força": { fisico: 4 },
    "Drible": { drible: 4 },
    "Domínio": { dominio: 4 },
    "Velocidade": { velocidade: 4 },
    "Finalização": { finalizacao: 4 }
};

const posicaoNomes = Object.keys(bonusPosicao);
const nacionalidadeNomes = Object.keys(bonusNacionalidade);
const universidadeNomes = Object.keys(bonusUniversidade);
const dominanciaNomes = Object.keys(bonusDominancia);
const maestriaNomes = Object.keys(bonusMaestria);

// Cargos exatos de Talentos no Discord
const talentoCargos = [
    "๑˚ ꒱꒱ Prodigio ⏜ ︵ ₊⊹",
    "๑˚ ꒱꒱ Aprendiz Talentoso ⏜ ︵ ₊⊹",
    "๑˚ ꒱꒱ Genio ⏜ ︵ ₊⊹"
];

// Status padrão para novo jogador
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

// Função para criar jogador automaticamente
function criarJogador(id, nome) {
    return {
        id: id,
        nome: nome,
        posicao: "Meio Ofensivo",
        talento: {
            tipo: "nenhum",             // "gênio", "aprendiz" ou "prodígio"
            atributoPrincipal: "finalizacao"
        },
        status: { ...STATUS_PADRAO },
        estatisticas: {
            gols: 0,
            assistencias: 0,
            passes: 0,
            dribles: 0,
            desarmes: 0,
            interceptacoes: 0,
            defesas: 0,
            bloqueios: 0,
            partidas: 0,
            vitorias: 0
        },
        habilidades: {},
        imagem: null
    };
}

// Função auxiliar: garantir que o jogador tenha TODOS os status
function garantirStatusJogador(jogador) {
    if (!jogador.status) {
        jogador.status = {};
    }
    
    // ✅ CORRIGIR: se existir "defenseGk" (errado), copia para "defesaGk" (certo) e remove o errado
    if (jogador.status.defenseGk !== undefined) {
        jogador.status.defesaGk = jogador.status.defenseGk;
        delete jogador.status.defenseGk;
    }
    
    // ✅ Garantir que TODOS os atributos existam com valor padrão 0
    const atributos = ['finalizacao', 'drible', 'passe', 'desarme', 'velocidade', 'fisico', 'interceptacao', 'defesaGk', 'dominio'];
    atributos.forEach(attr => {
        if (jogador.status[attr] === undefined || jogador.status[attr] === null) {
            jogador.status[attr] = 0;
        }
    });
    
    return jogador;
}

// Retorna as informações detalhadas de cada talento e a cor apropriada
function obterInfoTalento(talento) {
    const tipo = talento && talento.tipo ? talento.tipo.toLowerCase() : "nenhum";
    
    if (tipo.includes('gênio') || tipo.includes('genio') || tipo.includes('⭐️')) {
        return { nome: "Gênio ⭐️", cor: "#F1C40F" };
    }
    if (tipo.includes('aprendiz') || tipo.includes('🧩')) {
        return { nome: "Aprendiz Talentoso 🧩", cor: "#3498DB" };
    }
    if (tipo.includes('prodígio') || tipo.includes('prodigio') || tipo.includes('🧬')) {
        return { nome: "Prodígio 🧬", cor: "#E74C3C" };
    }
    return { nome: "Jogador Comum ⚽", cor: "#95A5A6" };
}

module.exports = {
    name: 'status',
    description: 'Mostra os status do jogador com todos os bônus e talentos aplicados',
    aliases: ['stats', 'perfil'],
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        // CRIA O JOGADOR AUTOMATICAMENTE SE NÃO EXISTIR
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = criarJogador(target.id, target.username);
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            console.log(`✅ Jogador ${target.username} (${target.id}) criado automaticamente!`);
        }
        
        const jogador = dados.jogadores[target.id];
        
        // ✅ GARANTIR QUE O JOGADOR TENHA TODOS OS STATUS CORRETOS
        garantirStatusJogador(jogador);
        
        // Garante que as estatísticas existem
        if (!jogador.estatisticas) {
            jogador.estatisticas = {
                gols: 0, assistencias: 0, passes: 0, dribles: 0,
                desarmes: 0, interceptacoes: 0, defesas: 0, bloqueios: 0,
                partidas: 0, vitorias: 0
            };
        }
        
        // Garante que as habilidades existem
        if (!jogador.habilidades) {
            jogador.habilidades = {};
        }

        // Garante que a estrutura de talento existe
        if (!jogador.talento) {
            jogador.talento = {
                tipo: "nenhum",
                atributoPrincipal: "finalizacao"
            };
        }
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        
        function encontrarCargo(lista) {
            if (!membro) return null;
            const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
            for (const nome of listaOrdenada) {
                const cargoEncontrado = membro.roles.cache.find(r => 
                    r.name.toLowerCase().includes(nome.toLowerCase())
                );
                if (cargoEncontrado) return nome;
            }
            return null;
        }
        
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
        
        const posicao = encontrarCargo(posicaoNomes);
        const nacionalidade = encontrarCargo(nacionalidadeNomes);
        const universidade = encontrarCargo(universidadeNomes);
        const dominancia = encontrarCargo(dominanciaNomes);
        const maestria = encontrarCargo(maestriaNomes);

        // 👑 DETECTA E ATUALIZA O TALENTO VIA CARGOS DO DISCORD
        const talentoCargo = encontrarCargo(talentoCargos);
        let tipoTalento = "nenhum";
        
        if (talentoCargo) {
            const nomeCargoMinusculo = talentoCargo.toLowerCase();
            if (nomeCargoMinusculo.includes("prodigio")) {
                tipoTalento = "prodígio";
            } else if (nomeCargoMinusculo.includes("aprendiz")) {
                tipoTalento = "aprendiz";
            } else if (nomeCargoMinusculo.includes("genio")) {
                tipoTalento = "gênio";
            }
        }
        
        // Sincroniza dinamicamente o talento no JSON do jogador
        jogador.talento.tipo = tipoTalento;
        
        // Buscar armas (para calcular bônus, mas não mostrar)
        const todasHabilidades = listarTodasHabilidades();
        const todosNomesArmas = Object.values(todasHabilidades).map(h => h.nome);
        const armasCargo = encontrarTodosCargos(todosNomesArmas);
        
        // ✅ STATUS BASE (garantido que não é undefined)
        const statusBase = {
            finalizacao: jogador.status.finalizacao || 0,
            drible: jogador.status.drible || 0,
            passe: jogador.status.passe || 0,
            desarme: jogador.status.desarme || 0,
            velocidade: jogador.status.velocidade || 0,
            fisico: jogador.status.fisico || 0,
            interceptacao: jogador.status.interceptacao || 0,
            defesaGk: jogador.status.defesaGk || 0,
            dominio: jogador.status.dominio || 0
        };
        
        // ✅ BONUS TOTAL (tudo padronizado como defesaGk)
        const bonusTotal = { 
            finalizacao: 0, 
            drible: 0, 
            passe: 0, 
            desarme: 0, 
            velocidade: 0, 
            fisico: 0, 
            interceptacao: 0, 
            defesaGk: 0,  // ✅ CORRIGIDO: era "defenseGk"
            dominio: 0 
        };
        
        function somarBonus(bonus) {
            for (const [attr, val] of Object.entries(bonus)) {
                // ✅ CORRIGIR: se vier "defenseGk", somar em "defesaGk"
                if (attr === 'defenseGk') {
                    bonusTotal.defesaGk = (bonusTotal.defesaGk || 0) + val;
                } else if (bonusTotal[attr] !== undefined) {
                    bonusTotal[attr] += val;
                }
            }
        }
        
        if (posicao && bonusPosicao[posicao]) somarBonus(bonusPosicao[posicao]);
        if (nacionalidade && bonusNacionalidade[nacionalidade]) somarBonus(bonusNacionalidade[nacionalidade]);
        if (universidade && bonusUniversidade[universidade]) somarBonus(bonusUniversidade[universidade]);
        if (dominancia && bonusDominancia[dominancia]) somarBonus(bonusDominancia[dominancia]);
        if (maestria && bonusMaestria[maestria]) somarBonus(bonusMaestria[maestria]);
        
        // Somar bônus de TODAS as armas (calcula mas não mostra)
        for (const armaNome of armasCargo) {
            const habInfo = Object.values(todasHabilidades).find(h => h.nome === armaNome);
            if (habInfo && habInfo.bonus) {
                somarBonus(habInfo.bonus);
            }
        }

        // Regra Especial do Talento Prodígio 🧬: +8 permanente no seu maior atributo base
        const infoTalento = obterInfoTalento(jogador.talento);
        if (tipoTalento === "prodígio") {
            let maiorAtributo = "finalizacao";
            let maiorValor = -1;
            Object.entries(statusBase).forEach(([key, val]) => {
                if (val > maiorValor) {
                    maiorValor = val;
                    maiorAtributo = key;
                }
            });
            // Adiciona o bônus de Especialização Extrema diretamente ao bônus total calculado
            if (bonusTotal[maiorAtributo] !== undefined) {
                bonusTotal[maiorAtributo] += 8;
            }
        }
        
        // ✅ CALCULAR STATUS TOTAL
        const statusTotal = {};
        for (const attr of Object.keys(statusBase)) {
            statusTotal[attr] = statusBase[attr] + (bonusTotal[attr] || 0);
        }
        
        const statusArray = Object.values(statusTotal);
        const statusMedio = Math.floor(statusArray.reduce((a, b) => a + b, 0) / statusArray.length);
        const imagemStatus = jogador.imagem || perfil_padrao;
        
        let bonusAtivos = '';
        if (posicao) bonusAtivos += `⚽ Posição: ${posicao}\n`;
        if (nacionalidade) bonusAtivos += `🌍 Nacionalidade: ${nacionalidade}\n`;
        if (universidade) bonusAtivos += `🏫 Universidade: ${universidade}\n`;
        if (dominancia) bonusAtivos += `🦶 Dominância: ${dominancia}\n`;
        if (maestria) bonusAtivos += `📜 Maestria: ${maestria}\n`;
        if (jogador.talento.tipo !== "nenhum") bonusAtivos += `👑 Talento: ${infoTalento.nome}\n`;
        if (armasCargo.length > 0) bonusAtivos += `⚔️ Armas: ${armasCargo.length} equipada(s)\n`;
        if (!bonusAtivos) bonusAtivos = 'Nenhum bônus ativo';
        
        // ✅ Garantir que defesaGk não seja undefined na exibição
        const defesaGkBase = statusBase.defesaGk || 0;
        const defesaGkBonus = bonusTotal.defesaGk || 0;
        const defesaGkTotal = statusTotal.defesaGk || 0;
        
        let texto = 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘** **__Jogador__** —  \`${jogador.nome || target.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘** **__Talento__** —  \`${infoTalento.nome}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘** **__Status Médio__** —  \`${statusMedio}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙🎁﹚***__Bônus Ativos__***\n\n` +
            `> \`${bonusAtivos.trim().split('\n').join('`\n> `')}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙📊﹚***__Status__*** *(Base + Bônus = Total)*\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘** **__Finalização__** —  \`${statusBase.finalizacao || 0} + ${bonusTotal.finalizacao || 0} = ${statusTotal.finalizacao || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘** **__Drible__** —  \`${statusBase.drible || 0} + ${bonusTotal.drible || 0} = ${statusTotal.drible || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘** **__Passe__** —  \`${statusBase.passe || 0} + ${bonusTotal.passe || 0} = ${statusTotal.passe || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘** **__Desarme__** —  \`${statusBase.desarme || 0} + ${bonusTotal.desarme || 0} = ${statusTotal.desarme || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘** **__Velocidade__** —  \`${statusBase.velocidade || 0} + ${bonusTotal.velocidade || 0} = ${statusTotal.velocidade || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💪 ⦘** **__Físico__** —  \`${statusBase.fisico || 0} + ${bonusTotal.fisico || 0} = ${statusTotal.fisico || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘** **__Interceptação__** —  \`${statusBase.interceptacao || 0} + ${bonusTotal.interceptacao || 0} = ${statusTotal.interceptacao || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧱 ⦘** **__Defesa GK__** —  \`${defesaGkBase} + ${defesaGkBonus} = ${defesaGkTotal}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘** **__Domínio__** —  \`${statusBase.dominio || 0} + ${bonusTotal.dominio || 0} = ${statusTotal.dominio || 0}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘** **__Geral__** —  __***Use c!armas para ver detalhes das suas armas!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        // Salva as modificações no JSON do jogador sincronizando o talento encontrado nos cargos do Discord
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor(infoTalento.cor)
            .setAuthor({ name: `⚽ ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('˚ ˳ ﹙📊﹚ATRIBUTOS DE JOGO')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemStatus)
            .setFooter({ text: '⚽ Blue Lock • Base + Bônus = Total | Armas em c!armas' })
            .setTimestamp();
        
        return message.reply({ 
            embeds: [embed],
            allowedMentions: { repliedUser: false }
        });
    }
};