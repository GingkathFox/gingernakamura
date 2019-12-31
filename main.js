let getJumps = require('./getJumps')

console.log(getJumps)

let b = document.getElementById('b')
        b.onclick = (e) => {
            e.preventDefault()
            getJumps("Tanoo", "Uchoshi")
            .then(r => {
                p.innerText = r
            })
        }