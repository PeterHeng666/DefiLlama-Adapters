const ADDRESSES = require('../helper/coreAssets.json')
const sui = require("../helper/chain/sui")

const decimalShift = {
  [ADDRESSES.sui.USDC]: -3, // USDC
  [ADDRESSES.sui.USDT]: -3, // USDT
  [ADDRESSES.sui.WETH]: -1,  // WETH
  ["0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD"]: -3, // AUSD
  ['0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN']: -1, // WBTC
  [ADDRESSES.sui.USDC_CIRCLE]: -3, // native USDC
}

const storageId = "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe"

async function borrow(api) {
  const storageObject = await sui.getObject(storageId);
  const reservesId = storageObject.fields.reserves.fields.id.id

  const dynamicFields = await sui.getDynamicFieldObjects({ parent: reservesId })
  dynamicFields.forEach((data) => {
    const coin = '0x' + data.fields.value.fields.coin_type
    const borrowed = data.fields.value.fields.borrow_balance.fields.total_supply * data.fields.value.fields.current_borrow_index / 1e27
    const amount = borrowed * (10 ** (decimalShift[coin] ?? 0))
    api.add(coin, amount)
  })
}


async function tvl(api) {
  const storageObject = await sui.getObject(storageId);
  const reservesId = storageObject.fields.reserves.fields.id.id

  const dynamicFields = await sui.getDynamicFieldObjects({ parent: reservesId })

  dynamicFields.forEach(object => {
    const coin = '0x' + object.fields.value.fields.coin_type
    const total_supply = object.fields.value.fields.supply_balance.fields.total_supply * object.fields.value.fields.current_supply_index / 1e27
    const borrowed = object.fields.value.fields.borrow_balance.fields.total_supply * object.fields.value.fields.current_borrow_index / 1e27
    const amount = (total_supply - borrowed) * (10 ** (decimalShift[coin] ?? 0))
    api.add(coin, amount)
  })
}


module.exports = {
  timetravel: false,
  sui: {
    tvl,
    borrowed: borrow,
  },
}