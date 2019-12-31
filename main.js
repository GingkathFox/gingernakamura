let getJumps = require('./getJumps')
let numeral = require('numeral')
let esiJS = require('esijs')

let b = document.getElementById('b')

b.onclick = (e) => {
    e.preventDefault()
    let desto = document.getElementById('desto')

    let v = desto.value
    console.log(v)

    v === '' ? false : getJumps("Amarr", v)
    .then(r => {
        p.innerText = `${numeral(r * 1000000).format('0,0,0')} ISK for ${r} jumps`
    })
}