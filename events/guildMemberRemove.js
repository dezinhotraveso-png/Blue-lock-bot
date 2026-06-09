// Importando TODAS as funções necessárias do functions.js
const { 
    loadPlayers, 
    savePlayers, 
    loadGeral, 
    saveGeral, 
    loadBlueLock,      // ← ESTAVA FALTANDO ESTA
    saveBlueLock       // ← ESTAVA FALTANDO ESTA
} = require('../utils/functions.js');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member, client) {
        try {
            console.log(`[🧹 LIMPEZA] Processando saída de ${member.user.tag}...`);
            
            // 1. Apagar do Banco de Dados Principal (players.json)
            let data = loadPlayers();
            
            if (data[member.id]) {
                delete data[member.id];
                savePlayers(data);
                console.log(`[🧹 LIMPEZA] ✅ Jogador ${member.user.tag} (${member.id}) removido do players.json`);
            } else {
                console.log(`[🧹 LIMPEZA] ℹ️ ${member.user.tag} não tinha dados no players.json`);
            }

            // 2. Retirar da Fila da Seleção Final (geral.json) caso estivesse lá
            let geral = loadGeral();
            if (geral.selecao && geral.selecao.includes(member.id)) {
                geral.selecao = geral.selecao.filter(id => id !== member.id);
                saveGeral(geral);
                console.log(`[🧹 LIMPEZA] ✅ ${member.user.tag} removido da fila de Seleção Final.`);
            }

            // 3. Remover de partidas ativas (blueLock.json)
            const blueData = loadBlueLock();
            let mudouPartida = false;
            
            if (blueData.partidas) {
                for (const [partidaId, partida] of Object.entries(blueData.partidas)) {
                    if (partida.jogadores && partida.jogadores[member.id]) {
                        // Remove o jogador da partida
                        delete partida.jogadores[member.id];
                        mudouPartida = true;
                        console.log(`[🧹 LIMPEZA] ✅ ${member.user.tag} removido da partida ${partidaId}`);
                        
                        // Se tinha a posse, transfere para outro jogador
                        if (partida.posse === member.id) {
                            const outrosJogadores = Object.keys(partida.jogadores);
                            if (outrosJogadores.length > 0) {
                                const novoPosse = outrosJogadores[0];
                                partida.posse = novoPosse;
                                partida.posseNome = partida.jogadores[novoPosse]?.nome || "Jogador";
                                console.log(`[🧹 LIMPEZA] ⚽ Posse transferida para ${partida.posseNome}`);
                            } else {
                                partida.posse = null;
                                partida.posseNome = null;
                                partida.ativa = false;
                                console.log(`[🧹 LIMPEZA] 🛑 Partida ${partidaId} desativada (sem jogadores)`);
                            }
                        }
                    }
                }
            }
            
            // Remove do registro geral de jogadores
            if (blueData.jogadores && blueData.jogadores[member.id]) {
                delete blueData.jogadores[member.id];
                mudouPartida = true;
                console.log(`[🧹 LIMPEZA] ✅ ${member.user.tag} removido do registro de jogadores do BlueLock`);
            }
            
            // Salva se houve mudanças
            if (mudouPartida) {
                saveBlueLock(blueData);
                console.log(`[🧹 LIMPEZA] 💾 BlueLock.json atualizado`);
            }
            
            console.log(`[🧹 LIMPEZA] 🎉 Limpeza de ${member.user.tag} concluída com sucesso!`);

        } catch (error) {
            console.error(`🚨 Erro ao tentar limpar os dados de quem saiu:`, error);
        }
    }
};