let getJumps = require('./getJumps')

let b = document.getElementById('b')
        b.onclick = (e) => {
            e.preventDefault()
            getJumps("Tanoo", "Uchoshi")
            .then(r => {
                p.innerText = r
            })
        }