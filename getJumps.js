let esiJS = require('esijs')


module.exports = getJumps

async function getJumps(orgin, desto) {
    orgin = await esiJS.search.search(orgin, 'solar_system', true)
    desto = await esiJS.search.search(desto, 'solar_system', true)

    orgin = orgin.solar_system[0]

    desto = desto.solar_system[0]

    let jumps = await esiJS.routes.planRoute(orgin, desto, 'shortest')
    console.log(jumps, jumps.length, jumps.length - 1)

    return jumps.length - 1
}