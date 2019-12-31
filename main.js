let esiJS = require('esijs')

async function getJumps(orgin, desto) {
    orgin = await esiJS.universe.systems.systemInfo(orgin)
    desto = await esiJS.universe.systems.systemInfo(desto)

    orgin = orgin.id
    desto = desto.id

    let jumps = await esiJS.routes.planRoute(orgin, desto, 'shortest')

    return jumps.length
}