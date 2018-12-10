'use strict'

class Bullet {
  constructor(gun, opts) {
    this.gun = gun
    this.Gun = (typeof window !== 'undefined') ? window.Gun : require('gun/gun')

    // If we don't pass gun instance, then see if it's available from window or file - use Bullet's args to create a new gun instance.
    const hasGun = (gun && gun.chain) ? true : false
    if (!hasGun)
      this.gun = this.Gun(...arguments)

    this._ctx = null
    this._ctxVal = null
    this._ready = true
    this._hooks = {}
    this._proxyEnable = true

    // Immutability is an opt-in feature. use: new Bullet(gun, { immutable: true })
    this.immutable = (opts && opts.immutable) ? true : false

    this.Gun.on('opt', context => {
      this._registerHooks(context, 'in')
      this._registerHooks(context, 'out')
      this.to.next(context)
    })
    this.gun = this.Gun(this.Gun)

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

  extend(clss) {
    this._proxyEnable = false
    if (typeof cls === 'object')
      if (!Array.isArray(clss))
        throw new Error('bullet.extends() only supports a single utility or an array of utilities')
      else
        clss = [clss]
    else
      clss = [clss]

    for (let cls of clss)
      if (typeof cls === 'function') {
        const instance = new cls(this)
        this[instance.name] = instance
        this._registerInstanceHooks(instance)
      }
    this._proxyEnable = true
  }

  _registerHooks(context, event) {
    let base = this
    if (!this._hooks[event])
      this._hooks[event] = []

    context.on(event, function wireOutput(msg) {
      if (base._hooks[event].length > 0) {
        for (const hook of base._hooks[event])
          hook(msg)
      } else {
        //console.log('this.to.next:', msg)
        this.to.next(msg)
      }
    })
  }

  _registerInstanceHooks(instance) {
    if (typeof instance.out === 'function')
      this._hooks.out.push(instance.out)
    if (typeof instance.in === 'function')
      this._hooks.in.push(instance.in)
  }
}


function bulletProxy(base) {
  return {
    get (target, prop, receiver) {
      // Return any class methods/props
      if (prop in target || prop === 'inspect' || prop === 'constructor' || typeof prop == 'symbol')
        return Reflect.get(target, prop, receiver)

      // Proxy all other requests as chainables
      if (base[prop]) // Method exists in Bullet
        return base[prop]

      // Method does not exist, is a chainable
      //console.log('Get prop:', prop)
      base._ctx = new Proxy(target.get(prop), bulletProxy(base))
      return base._ctx
    },

    set (target, prop, receiver) {
      if (prop in base || !base._proxyEnable)
        return base[prop] = receiver

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
if (typeof window === 'undefined')
  module.exports = Bullet
