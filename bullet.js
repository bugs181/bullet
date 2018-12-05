'use strict'

class Bullet {
  constructor(gun, opts) {
    let Gun = gun

    // If we don't pass gun instance, then see if it's available from window or file - use Bullet's args to create a new gun instance.
    const hasGun = (gun && gun.chain) ? true : false
    if (!hasGun) {
      const gunInstance = (typeof window !== 'undefined') ? window.Gun : require('../gun')
      Gun = gunInstance(...arguments)
    }

    this.gun = Gun
    this._ctx = null
    this._ctxN = ''

    this.saveOnChange = (opts && opts.mutate) ? true : false

    return new Proxy(this.gun, bulletProxy(this))
  }

  get value() {
    return new Promise((resolve, reject) => {
      if (!this || !this._ctx || !this._ctx.once)
        return reject('No gun context')

      this._ctx.once(data => {
        resolve(data)
      })
    })
  }
}


function bulletProxy(base) {
  return {
    get (target, prop, receiver) {
      // Return any class methods/props
      if (prop in target || prop === 'inspect' || prop === 'constructor' || typeof prop == 'symbol')
        return Reflect.get(target, prop, receiver)

      // Proxy all other requests as chainables
      if (!target[prop]) { // Method does not exist on GUn
        if (base[prop]) // Method exists in Bullet
          return base[prop]

        // Method does not exist, is a chainable
        console.log('Get prop:', prop)
        base._ctx = new Proxy(target.get(prop), bulletProxy(base))
        base._ctxN = prop
        return base._ctx
      }
    },

    set (target, prop, receiver) {
      /*
      if (base.saveOnChange) {
        console.log('Putting data')
        base._ctx.put(receiver)
      }*/

      console.log('Set prop:', prop)
      /*if (!base._ctx && prop) {
        console.log('new base')
        base._ctx = new Proxy(target.get(prop), bulletProxy(base))
        base._ctxN = prop
      }*/

      /*base._ctx = new Proxy(target.get(prop), bulletProxy(base))
      base._ctxN = prop

      return base._ctx.put(receiver)*/

      target.get(prop).put(receiver).once(data => console.log(data))
      return target
    },
  }
}

// If environment is not browser, export it (for node compatibility)
//if (typeof window === 'undefined')
//  module.exports = Bullet
