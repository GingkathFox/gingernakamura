
let numeral = require('numeral')
let b = document.getElementById('b')

b.onclick = (e) => {
    e.preventDefault()
    let getJumps = require('./getJumps')
    let desto = document.getElementById('desto')

    let v = desto.value

    v === '' ? false : getJumps("Amarr", v)
    .then(r => {
        p.innerText = `${numeral((r - 1) * 1000000).format('0,0,0')} ISK for ${r - 1} jumps`
    })
}