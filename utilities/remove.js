'use strict'

class remove {
  constructor(bullet) {
    return function remove(maxDepth) {
      bullet._ctx.once(props => nullProps(bullet._ctx, props, maxDepth))
    }

    function nullProps(context, obj, maxDepth, depth = 0) {
      if (!obj)
        return

      console.log('To null: ', obj)

      if (typeof obj === 'object')
        for (let key of Object.keys(obj)) {
          if (key === '_')
            continue

          if (typeof obj[key] === 'string') {
            console.log('nulling: ', key)
            context.get(key).put(null)
          } else {
            if (!obj[key])
              continue

            console.log('Get: ', key)
            //console.log(depth)

            if (depth === 0)
              context = context.get(key)
            else
              context = context.back(depth).get(key)

            context.once(props => { nullProps(context, props, maxDepth, depth); depth++ })
          }
        }
    }
  }
}

// If environment is not browser, export it (for node compatibility)
if (typeof window === 'undefined')
  module.exports = remove

// https://github.com/d3x0r/gun-unset/blob/master/unset.js
// https://github.com/d3x0r/gun-db/blob/c189a9a5d5ae3ded5616e32cabc4e110e9cf6520/testsetnul.js#L67
// https://github.com/amark/gun/issues/404

/*
          if (key === '#') {
            console.log('Get: ', key)
            bullet._ctx.get(key).once(props => deleteProps(bullet, props))
          } else
*/
