import BigNumber from 'bignumber.js'
import { TRANSACTION_STATUS, pascalToWord } from './utils'
import './navigation'

import {
  ERC20_DECIMALS,
  MPContractAddress,
  cUSDContractAddress,
  connectCeloWallet,
  notification,
  notificationOff,
  kit,
  contract
} from './common'

let transactions = []


const getTransactions = async function() {

  const _transactionLength = await contract.methods.getTransactionCount().call()
  const _transactions = []
console.log('aaaaa ', _transactionLength)
  for (let i = 0; i < _transactionLength; i++) {

    let _transaction = new Promise(async (resolve) => {
      let p = await contract.methods.getTransactions(i, kit.defaultAccount).call()
      p.index = i

      resolve(p)
    })
    _transactions.push(_transaction)
  }

  transactions = await Promise.all(_transactions)
  console.log('xxx ', transactions)
  renderTransactions()
}

function renderTransactions() {
  document.getElementById('transactions').innerHTML = ''
  transactions.forEach((_transaction) => {
    const newDiv = document.createElement('div')
    newDiv.className = 'col-md-4'
    newDiv.innerHTML = transactionTemplate(_transaction)
    document.getElementById('transactions').appendChild(newDiv)
  })
}

function transactionTemplate(_transaction) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_transaction.filePath}" alt="...">
      <div class="state-${_transaction.status} position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${pascalToWord(TRANSACTION_STATUS(_transaction.status))}
      </div>
      <div class="card-body text-left p-4 position-relative">
        <h2 class="card-title fs-4 fw-bold mt-2">${_transaction.businessName}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_transaction.description}             
        </p>
      
        <div class="d-grid gap-2">
          <a class="${_transaction.transactionIndex} status-${_transaction.status} btn btn-lg btn-outline-dark updateTransaction fs-6 p-3" id=${_transaction.status}>
            ${(_transaction.status == 1 || _transaction.status == 2) ? 'Confirm Transaction' : 'Completed'}
          </a>
        </div>
      </div>
    </div>
  `
}


window.addEventListener('load', async () => {
  notification('⌛ Loading...')
  await connectCeloWallet()
  await getTransactions()
  notificationOff()

})

if (window.location.pathname === '/my-transactions.html') {
  document.querySelector('#transactions').addEventListener('click', async (e) => {

    const el = e.target
    if (el.className.includes('updateTransaction') && (el.id == '1' || el.id == '2')) {

      notification(`⌛ Awaiting transaction update...`)
      try {
        const index = el.classList[0]
        let cUSDcontract = await kit.contracts.getStableToken()

        const result = await contract.methods
          .confirmService(index, transactions[index].vendor)
          .send({ from: kit.defaultAccount, feeCurrency: cUSDcontract.address })

        notification(`🎉 You successfully confirmed the transaction`)

        console.log(result)

      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    }
  })
}


