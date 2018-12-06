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
    this._ctxVal = null
    this._ready = true
    this._hooks = {}

    // Immutability is an opt-in feature. use: new Bullet(gun, { immutable: true })
    this.immutable = (opts && opts.immutable) ? true : false

    return new Proxy(this.gun, bulletProxy(this))
  }

  get value() {
    return new Promise((resolve, reject) => {
      if (!this || !this._ctx || !this._ctx.once)
        return reject('No gun context')

      this._ctx.once(data => {
        let timer = setInterval(() => {
          // Wait until bullet is ready (pending .put results)
          if (this._ready) {
            resolve(data)
            clearInterval(timer)
          }
        }, 100)
      })
    })
  }

  mutate(val) {
    if (!val && this._ctxVal) {
      this._ready = false
      this._ctxProp.put(this._ctxVal, () => this._ready = true)
    }
  }

  extends(instance) {
    if (instance && instance.extends === 'gun')
      for (const hook of Object.keys(instance)) {
        if (!this._hooks[hook])
          this._hooks[hook] = []

        this._hooks[hook].push(instance[hook])
      }
    else
      this[instance.name] = instance
  }
}


function bulletProxy(base) {
  return {
    get (target, prop, receiver) {
      // Run through any hooks first
      //console.log(prop)
      let willContinue = true
      /*if (base._hooks && base._hooks[prop] && Array.isArray(base._hooks[prop]))
        base._hooks[prop].forEach(hook => {
          hook(target, prop, receiver, () => willContinue = false)
        })

      if (!willContinue)
        return new Proxy(Reflect.get(target, prop, receiver), bulletProxy(base)) // Proxy any nested functions for extends()
      */

      // Return any class methods/props
      if (prop in target || prop === 'inspect' || prop === 'constructor' || typeof prop == 'symbol')
        return Reflect.get(target, prop, receiver)
        //return new Proxy(Reflect.get(target, prop, receiver), bulletProxy(base)) // Proxy any nested functions for extends()
        //return new Proxy(target[prop], bulletProxy(base))

      // Proxy all other requests as chainables
      if (base[prop]) // Method exists in Bullet
        return base[prop]

      // Method does not exist, is a chainable
      //console.log('Get prop:', prop)
      base._ctx = new Proxy(target.get(prop), bulletProxy(base))
      base._ctxN = prop
      return base._ctx
    },

    set (target, prop, receiver) {
      //console.log('Set prop:', prop)
      if (!base.immutable) {
        this._ready = false
        target.get(prop).put(receiver, () => base._ready = true)
        //return new Proxy(target.get(prop), bulletProxy).put(receiver, () => base._ready = true)
        //return new Proxy(target.get(prop), bulletProxy(base))
      } else {
        console.warn('You have immutable turned on; be sure to .mutate()')
        base._ctxProp = target.get(prop)
        base._ctxVal = receiver
        base._ready = true
      }

      return target
      //return base._ctx
    },
  }
}

// If environment is not browser, export it (for node compatibility)
//if (typeof window === 'undefined')
//  module.exports = Bullet
