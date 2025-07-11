const conexao = require('../config/dataBase')

function buscaPedidoPorFiltro(filtroWhereSql) {
    return new Promise((resolve, reject) => {
        const sql = `
                SELECT 
                    p.id AS pedido_id, 
                    p.nome_cliente, 
                    p.endereco,
                    p.valor_total,
                    p.forma_pagamento,
                    p.foi_pago,
                    p.observacao,
                    p.numero_pedido_dia,
                    DATE_FORMAT(P.data_pedido,'%d/%m/%Y %H:%i' ) AS data_pedido,
                    p.entrega,
                    ip.quantidade,
                    ip.produto_id,
                    pr.nome As nome_produto, 
                    pr.unidade_medida,
                    ip.preco_unitario
                    

                FROM pedidos p
                JOIN itens_pedido ip ON p.id = ip.pedido_id
                JOIN produtos pr ON pr.codigo = ip.produto_id
                ${filtroWhereSql}
                ORDER BY p.id DESC
            `;
        conexao.query(sql, (err, rows) => {
            err ? reject(err) : resolve(rows)
        })
    })
}
//  Função auxiliar para agrupar
function agruparPedidos(resultado) {
    const pedidosAgrupados = [];

    resultado.forEach(linha => {
        let pedido = pedidosAgrupados.find(p => p.pedido_id === linha.pedido_id);
        if (!pedido) {
            pedido = {
                pedido_id: linha.pedido_id,
                nome_cliente: linha.nome_cliente,
                endereco: linha.endereco,
                valor_total: linha.valor_total,
                forma_pagamento: linha.forma_pagamento,
                foi_pago: linha.foi_pago,
                observacao: linha.observacao,
                data_pedido: linha.data_pedido,
                entrega: linha.entrega,
                numero_pedido: linha.numero_pedido_dia,
                itens: []
            };
            pedidosAgrupados.push(pedido);
        }
        pedido.itens.push({
            produto_id: linha.produto_id,
            nome_produto: linha.nome_produto,
            quantidade: linha.quantidade,
            preco_unitario: linha.preco_unitario,
            unidade_medida: linha.unidade_medida
        });
    });

    return pedidosAgrupados;
}
function gerarNumeroPedidoDoDia(dataAtual){
    return  new Promise((resolve, reject)=>{   
        const sql = `SELECT MAX(numero_pedido_dia) as maxPedido FROM pedidos WHERE DATE(data_pedido) = ?`

        conexao.query( sql, [dataAtual], (err, retorno)=>{
            if(err) return reject(err)

            const maxPedido = retorno[0].maxPedido || 0 //  retorna o maior numero da coluna, retorno é um array que contém o objeto maxPedido: { maxPedido: 3 } // ← esse é retorno[0]
            resolve(maxPedido + 1)
        })
    })
}

function pegaNumeroDoPedido(id){
    return new Promise((resolve, reject)=>{
        const pegaNumero  = `SELECT numero_pedido_dia FROM pedidos WHERE id = ${id}`
        conexao.query(pegaNumero, (err, retorno)=>{
            if(err) return reject(err)
            const numeroPedidoDia = retorno[0]?.numero_pedido_dia
            return resolve(numeroPedidoDia)
        })
    })
    
}

module.exports = {
    agruparPedidos,
    buscaPedidoPorFiltro, 
    gerarNumeroPedidoDoDia, 
    pegaNumeroDoPedido
}