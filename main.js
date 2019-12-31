let getJumps = require('./getJumps')
let numeral = require('numeral')
console.log(getJumps)

let b = document.getElementById('b')
        b.onclick = (e) => {
            e.preventDefault()
            getJumps("Tanoo", "Uchoshi")
            .then(r => {
                p.innerText = `${numeral(r * 1000000).format('0,0,0')} ISK`
            })
        }